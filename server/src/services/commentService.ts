import { Types } from 'mongoose';
import Comment, { ICommentDocument } from '../models/Comment';
import Issue, { IIssueDocument } from '../models/Issue';
import ActivityLog from '../models/ActivityLog';
import OrgMember from '../models/OrgMember';
import User from '../models/User';
import ApiError from '../utils/ApiError';
import logger from '../utils/logger';
import { IComment, IReaction, IUser, OrgRole } from '../types';

function fireCommentActivityLog(params: {
  issueId: string;
  projectId: string;
  orgId: string;
  actorId: string;
  action: 'comment_added' | 'comment_deleted';
}): void {
  void ActivityLog.create({
    issue: new Types.ObjectId(params.issueId),
    project: new Types.ObjectId(params.projectId),
    organisation: new Types.ObjectId(params.orgId),
    actor: new Types.ObjectId(params.actorId),
    action: params.action,
  }).catch((err: unknown) => {
    logger.warn('Failed to write activity log for comment', { err });
  });
}

async function requireActiveOrgMemberForIssue(
  orgId: Types.ObjectId,
  userId: string
): Promise<{ role: OrgRole }> {
  const member = await OrgMember.findOne({
    organisation: orgId,
    user: new Types.ObjectId(userId),
    status: 'active',
  });
  if (!member) throw new ApiError(403, 'You are not an active member of this organisation');
  return { role: member.role };
}

async function getIssueInProjectOrThrow(
  issueId: string,
  projectId: string,
  orgId: string,
  userId: string
): Promise<IIssueDocument> {
  const orgObjectId = new Types.ObjectId(orgId);
  await requireActiveOrgMemberForIssue(orgObjectId, userId);

  const issue = await Issue.findById(issueId);
  if (!issue) throw new ApiError(404, 'Issue not found');
  if (!issue.organisation.equals(orgObjectId)) {
    throw new ApiError(403, 'You do not have access to this issue');
  }
  if (!issue.project.equals(new Types.ObjectId(projectId))) {
    throw new ApiError(400, 'Issue does not belong to this project');
  }
  return issue;
}

function extractMentionUserIds(content: string): Types.ObjectId[] {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const seen = new Set<string>();
  const ids: Types.ObjectId[] = [];
  let match: RegExpExecArray | null = mentionRegex.exec(content);
  while (match !== null) {
    const idStr = match[2]?.trim() ?? '';
    if (Types.ObjectId.isValid(idStr) && !seen.has(idStr)) {
      seen.add(idStr);
      ids.push(new Types.ObjectId(idStr));
    }
    match = mentionRegex.exec(content);
  }
  return ids;
}

function extractId(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Types.ObjectId) return value.toString();
  if (typeof value === 'object' && '_id' in value && (value as { _id: unknown })._id !== undefined) {
    return String((value as { _id: unknown })._id);
  }
  return null;
}

function userDocToUser(doc: unknown): IUser {
  if (!doc || typeof doc !== 'object' || !('_id' in doc)) {
    throw new ApiError(500, 'Invalid user payload');
  }
  const o = doc as Record<string, unknown>;
  return {
    _id: String(o._id),
    name: String(o.name ?? ''),
    email: String(o.email ?? ''),
    avatar: typeof o.avatar === 'string' ? o.avatar : undefined,
    role: o.role === 'admin' ? 'admin' : 'member',
    createdAt:
      o.createdAt instanceof Date ? o.createdAt.toISOString() : String(o.createdAt ?? new Date().toISOString()),
    updatedAt:
      o.updatedAt instanceof Date ? o.updatedAt.toISOString() : String(o.updatedAt ?? new Date().toISOString()),
  };
}

async function buildUserMapFromCommentDocs(docs: ICommentDocument[]): Promise<Map<string, IUser>> {
  const ids = new Set<string>();
  for (const doc of docs) {
    const authorId = extractId(doc.author as unknown);
    if (authorId) ids.add(authorId);
    for (const m of doc.mentions ?? []) {
      const mid = extractId(m as unknown);
      if (mid) ids.add(mid);
    }
    for (const r of doc.reactions ?? []) {
      for (const u of r.users) {
        const uid = extractId(u as unknown);
        if (uid) ids.add(uid);
      }
    }
  }
  const users =
    ids.size > 0
      ? await User.find({ _id: { $in: [...ids].map((id) => new Types.ObjectId(id)) } }).select(
          'name email avatar role createdAt updatedAt'
        )
      : [];
  const map = new Map<string, IUser>();
  for (const u of users) {
    map.set(u._id.toString(), userDocToUser(u));
  }
  return map;
}

function docToIComment(doc: ICommentDocument, userMap: Map<string, IUser>, replies?: IComment[]): IComment {
  const authorId = extractId(doc.author as unknown);
  if (!authorId) throw new ApiError(500, 'Author not found for comment');
  const author = userMap.get(authorId);
  if (!author) {
    throw new ApiError(500, 'Author not found for comment');
  }
  const mentionUsers = (doc.mentions ?? []).map((id) => {
    const mid = extractId(id as unknown) ?? id.toString();
    const u = userMap.get(mid);
    if (!u) {
      return {
        _id: mid,
        name: '',
        email: '',
        role: 'member' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return u;
  });

  const reactions: IReaction[] = (doc.reactions ?? []).map((r) => ({
    emoji: r.emoji,
    users: r.users.map((uid) => {
      if (typeof uid === 'object' && uid !== null && 'email' in uid) {
        return userDocToUser(uid);
      }
      const key = extractId(uid as unknown) ?? '';
      const u = userMap.get(key);
      if (!u) {
        return {
          _id: key,
          name: '',
          email: '',
          role: 'member' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      return u;
    }),
  }));

  return {
    _id: doc._id.toString(),
    content: doc.content,
    issue: doc.issue.toString(),
    author,
    isEdited: doc.isEdited,
    editedAt: doc.editedAt ? doc.editedAt.toISOString() : null,
    mentions: mentionUsers,
    reactions,
    parentComment: doc.parentComment ? doc.parentComment.toString() : null,
    replies,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export const createComment = async (
  issueId: string,
  userId: string,
  orgId: string,
  projectId: string,
  content: string,
  parentId?: string | null
): Promise<IComment> => {
  const issue = await getIssueInProjectOrThrow(issueId, projectId, orgId, userId);

  let parentComment: Types.ObjectId | null = null;
  if (parentId) {
    const parent = await Comment.findOne({
      _id: parentId,
      issue: issue._id,
    });
    if (!parent) throw new ApiError(400, 'Parent comment not found for this issue');
    parentComment = parent._id;
  }

  const mentions = extractMentionUserIds(content);

  const created = await Comment.create({
    content,
    issue: issue._id,
    project: new Types.ObjectId(projectId),
    organisation: issue.organisation,
    author: new Types.ObjectId(userId),
    mentions,
    parentComment,
  });

  fireCommentActivityLog({
    issueId,
    projectId,
    orgId,
    actorId: userId,
    action: 'comment_added',
  });

  const populated = await Comment.findById(created._id)
    .populate('author', 'name avatar email role createdAt updatedAt')
    .populate('mentions', 'name avatar email role createdAt updatedAt');

  if (!populated) throw new ApiError(500, 'Failed to load created comment');

  const userMap = await buildUserMapFromCommentDocs([populated]);
  return docToIComment(populated, userMap);
};

export const getIssueComments = async (
  issueId: string,
  projectId: string,
  orgId: string,
  userId: string
): Promise<Array<IComment & { replies: IComment[] }>> => {
  await getIssueInProjectOrThrow(issueId, projectId, orgId, userId);

  const topLevel = await Comment.find({ issue: issueId, parentComment: null })
    .populate('author', 'name avatar email role createdAt updatedAt')
    .populate('mentions', 'name avatar email role createdAt updatedAt')
    .populate({ path: 'reactions.users', select: 'name avatar email role createdAt updatedAt' })
    .sort({ createdAt: 1 });

  const result: Array<IComment & { replies: IComment[] }> = [];

  for (const parent of topLevel) {
    const repliesRaw = await Comment.find({ issue: issueId, parentComment: parent._id })
      .populate('author', 'name avatar email role createdAt updatedAt')
      .populate('mentions', 'name avatar email role createdAt updatedAt')
      .populate({ path: 'reactions.users', select: 'name avatar email role createdAt updatedAt' })
      .sort({ createdAt: 1 });

    const allForMap = [parent, ...repliesRaw];
    const userMap = await buildUserMapFromCommentDocs(allForMap);

    const replies = repliesRaw.map((r) => docToIComment(r, userMap));
    result.push({ ...docToIComment(parent, userMap), replies });
  }

  return result;
};

export const updateComment = async (
  commentId: string,
  userId: string,
  orgId: string,
  projectId: string,
  issueId: string,
  content: string
): Promise<IComment> => {
  await getIssueInProjectOrThrow(issueId, projectId, orgId, userId);

  const comment = await Comment.findOne({
    _id: commentId,
    issue: new Types.ObjectId(issueId),
    project: new Types.ObjectId(projectId),
  });
  if (!comment) throw new ApiError(404, 'Comment not found');

  if (!comment.author.equals(new Types.ObjectId(userId))) {
    throw new ApiError(403, 'Only the author can edit this comment');
  }

  comment.content = content;
  comment.isEdited = true;
  comment.editedAt = new Date();
  await comment.save();

  const populated = await Comment.findById(comment._id)
    .populate('author', 'name avatar email role createdAt updatedAt')
    .populate('mentions', 'name avatar email role createdAt updatedAt');

  if (!populated) throw new ApiError(500, 'Failed to load updated comment');

  const userMap = await buildUserMapFromCommentDocs([populated]);
  return docToIComment(populated, userMap);
};

async function collectDescendantCommentIds(rootId: Types.ObjectId): Promise<Types.ObjectId[]> {
  const ids: Types.ObjectId[] = [rootId];
  const queue: Types.ObjectId[] = [rootId];
  while (queue.length > 0) {
    const current = queue.shift() as Types.ObjectId;
    const children = await Comment.find({ parentComment: current }).select('_id').lean();
    for (const ch of children) {
      const cid = ch._id as Types.ObjectId;
      ids.push(cid);
      queue.push(cid);
    }
  }
  return ids;
}

export const deleteComment = async (
  commentId: string,
  userId: string,
  userRole: OrgRole | undefined,
  orgId: string,
  projectId: string,
  issueId: string
): Promise<void> => {
  await getIssueInProjectOrThrow(issueId, projectId, orgId, userId);

  const comment = await Comment.findOne({
    _id: commentId,
    issue: new Types.ObjectId(issueId),
    project: new Types.ObjectId(projectId),
  });
  if (!comment) throw new ApiError(404, 'Comment not found');

  const isAuthor = comment.author.equals(new Types.ObjectId(userId));
  const isOrgModerator = userRole === 'owner' || userRole === 'admin';
  if (!isAuthor && !isOrgModerator) {
    throw new ApiError(403, 'You do not have permission to delete this comment');
  }

  const toRemove = await collectDescendantCommentIds(comment._id);
  await Comment.deleteMany({ _id: { $in: toRemove } });

  fireCommentActivityLog({
    issueId,
    projectId,
    orgId,
    actorId: userId,
    action: 'comment_deleted',
  });
};

export const addReaction = async (
  commentId: string,
  userId: string,
  orgId: string,
  projectId: string,
  issueId: string,
  emoji: string
): Promise<IReaction[]> => {
  await getIssueInProjectOrThrow(issueId, projectId, orgId, userId);

  const comment = await Comment.findOne({
    _id: commentId,
    issue: new Types.ObjectId(issueId),
    project: new Types.ObjectId(projectId),
  });
  if (!comment) throw new ApiError(404, 'Comment not found');

  const trimmed = emoji.trim();
  if (!trimmed) throw new ApiError(400, 'Emoji is required');

  const reactions = comment.reactions ?? [];
  const idx = reactions.findIndex((r) => r.emoji === trimmed);
  const uid = new Types.ObjectId(userId);

  if (idx === -1) {
    reactions.push({ emoji: trimmed, users: [uid] });
  } else {
    const users = reactions[idx].users;
    const userIdx = users.findIndex((u) => u.equals(uid));
    if (userIdx === -1) {
      users.push(uid);
    } else {
      users.splice(userIdx, 1);
    }
    if (users.length === 0) {
      reactions.splice(idx, 1);
    }
  }

  comment.reactions = reactions;
  comment.markModified('reactions');
  await comment.save();

  const refreshed = await Comment.findById(comment._id).populate({
    path: 'reactions.users',
    select: 'name avatar email role createdAt updatedAt',
  });
  if (!refreshed) throw new ApiError(500, 'Failed to reload comment reactions');

  const userMap = await buildUserMapFromCommentDocs([refreshed]);
  const out: IReaction[] = (refreshed.reactions ?? []).map((r) => ({
    emoji: r.emoji,
    users: r.users.map((id) => {
      const u = userMap.get(id.toString());
      if (!u) {
        return {
          _id: id.toString(),
          name: '',
          email: '',
          role: 'member' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      return u;
    }),
  }));

  return out;
};
