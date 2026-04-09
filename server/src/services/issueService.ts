import mongoose, { ClientSession, FilterQuery, Types } from 'mongoose';
import Issue, {
  IIssueDocument,
  IssuePriority,
  IssueStatus,
  IssueType,
} from '../models/Issue';
import IssueCounter from '../models/IssueCounter';
import Project, { IProjectDocument } from '../models/Project';
import OrgMember from '../models/OrgMember';
import Sprint from '../models/Sprint';
import ApiError from '../utils/ApiError';
import { IUser, OrgRole } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const PRIORITY_RANK: Record<IssuePriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

async function requireActiveOrgMember(
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

async function getProjectInOrgOrThrow(
  projectId: string,
  orgId: Types.ObjectId
): Promise<IProjectDocument> {
  const project = await Project.findOne({
    _id: projectId,
    organisation: orgId,
  });
  if (!project) throw new ApiError(404, 'Project not found');
  return project;
}

function isProjectLead(project: IProjectDocument, userId: string): boolean {
  return project.lead?.equals(new Types.ObjectId(userId)) ?? false;
}

async function requireDeletePermission(
  issue: IIssueDocument,
  project: IProjectDocument,
  userId: string
): Promise<void> {
  if (issue.reporter.equals(new Types.ObjectId(userId))) return;
  if (isProjectLead(project, userId)) return;

  const member = await OrgMember.findOne({
    organisation: project.organisation,
    user: new Types.ObjectId(userId),
    status: 'active',
  });
  if (member && (member.role === 'owner' || member.role === 'admin')) return;

  throw new ApiError(403, 'Only the reporter, project lead, or an org admin can delete this issue');
}

const issuePopulateDetail = [
  { path: 'assignee', select: 'name avatar email role createdAt updatedAt' },
  { path: 'reporter', select: 'name avatar email role createdAt updatedAt' },
  { path: 'watchers', select: 'name avatar email role createdAt updatedAt' },
  {
    path: 'epic',
    select: 'key title status',
  },
  {
    path: 'parent',
    select: 'key title status',
  },
  { path: 'sprint', select: 'name' },
];

const issuePopulateListFields = [
  { path: 'assignee', select: 'name avatar email role createdAt updatedAt' },
  { path: 'reporter', select: 'name avatar email role createdAt updatedAt' },
  {
    path: 'epic',
    select: 'key title',
  },
];

function populateIssueById(issueId: Types.ObjectId | string): Promise<IIssueDocument | null> {
  return Issue.findById(issueId).populate(issuePopulateDetail);
}

export async function generateIssueKey(projectId: string): Promise<string> {
  const counter = await IssueCounter.findOneAndUpdate(
    { project: new Types.ObjectId(projectId) },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  );

  if (!counter) throw new ApiError(500, 'Failed to generate issue key');

  const project = await Project.findById(projectId).select('key');
  if (!project) throw new ApiError(404, 'Project not found');

  return `${project.key}-${counter.count}`;
}

export interface TCreateIssueData {
  title: string;
  description?: string;
  type?: IssueType;
  status?: IssueStatus;
  priority?: IssuePriority;
  storyPoints?: number | null;
  sprint?: string | null;
  epic?: string | null;
  parent?: string | null;
  assignee?: string | null;
  labels?: string[];
  dueDate?: string | null;
}

export const createIssue = async (
  projectId: string,
  orgId: string,
  userId: string,
  data: TCreateIssueData
): Promise<IIssueDocument> => {
  const orgObjectId = new Types.ObjectId(orgId);
  await requireActiveOrgMember(orgObjectId, userId);

  const project = await getProjectInOrgOrThrow(projectId, orgObjectId);

  const status: IssueStatus = data.status ?? 'backlog';

  const lastInColumn = await Issue.findOne({ project: project._id, status }).sort({ order: -1 });
  const nextOrder = lastInColumn ? lastInColumn.order + 1 : 0;

  const key = await generateIssueKey(projectId);

  if (data.sprint) {
    const sprint = await Sprint.findOne({
      _id: data.sprint,
      project: project._id,
      organisation: orgObjectId,
    });
    if (!sprint) throw new ApiError(400, 'Sprint not found for this project');
  }

  if (data.epic) {
    const epic = await Issue.findOne({
      _id: data.epic,
      project: project._id,
      type: 'epic',
    });
    if (!epic) throw new ApiError(400, 'Epic not found in this project');
  }

  if (data.parent) {
    const parent = await Issue.findOne({ _id: data.parent, project: project._id });
    if (!parent) throw new ApiError(400, 'Parent issue not found in this project');
  }

  if (data.assignee) {
    await requireActiveOrgMember(orgObjectId, data.assignee);
  }

  const issue = await Issue.create({
    key,
    title: data.title,
    description: data.description,
    type: data.type ?? 'task',
    status,
    priority: data.priority ?? 'medium',
    project: project._id,
    organisation: orgObjectId,
    sprint: data.sprint ? new Types.ObjectId(data.sprint) : null,
    epic: data.epic ? new Types.ObjectId(data.epic) : null,
    parent: data.parent ? new Types.ObjectId(data.parent) : null,
    assignee: data.assignee ? new Types.ObjectId(data.assignee) : null,
    reporter: new Types.ObjectId(userId),
    storyPoints: data.storyPoints ?? null,
    labels: data.labels ?? [],
    order: nextOrder,
    dueDate: data.dueDate ? new Date(data.dueDate) : null,
  });

  await Project.findByIdAndUpdate(project._id, { $inc: { issueCount: 1 } });

  const populated = await populateIssueById(issue._id);
  if (!populated) throw new ApiError(500, 'Failed to load created issue');
  return populated;
};

export interface TIssueFilters {
  status?: IssueStatus;
  sprint?: string;
  assignee?: string;
  priority?: IssuePriority;
  type?: IssueType;
  label?: string;
  search?: string;
}

export const getProjectIssues = async (
  projectId: string,
  orgId: string,
  userId: string,
  filters?: TIssueFilters
): Promise<IIssueDocument[]> => {
  const orgObjectId = new Types.ObjectId(orgId);
  await requireActiveOrgMember(orgObjectId, userId);
  await getProjectInOrgOrThrow(projectId, orgObjectId);

  const query: FilterQuery<IIssueDocument> = { project: projectId };

  if (filters?.status) query.status = filters.status;

  if (filters?.sprint !== undefined) {
    if (filters.sprint === 'backlog') {
      query.sprint = null;
    } else {
      query.sprint = new Types.ObjectId(filters.sprint);
    }
  }

  if (filters?.assignee) query.assignee = new Types.ObjectId(filters.assignee);
  if (filters?.priority) query.priority = filters.priority;
  if (filters?.type) query.type = filters.type;
  if (filters?.label) query.labels = filters.label;

  if (filters?.search?.trim()) {
    query.title = new RegExp(escapeRegExp(filters.search.trim()), 'i');
  }

  const issues = await Issue.find(query)
    .populate(issuePopulateListFields)
    .sort({ order: 1 });

  return issues;
};

export const getIssueById = async (
  issueId: string,
  orgId: string,
  userId: string
): Promise<IIssueDocument> => {
  const orgObjectId = new Types.ObjectId(orgId);
  await requireActiveOrgMember(orgObjectId, userId);

  const issue = await populateIssueById(issueId);
  if (!issue) throw new ApiError(404, 'Issue not found');

  if (!issue.organisation.equals(orgObjectId)) {
    throw new ApiError(403, 'You do not have access to this issue');
  }

  return issue;
};

export interface TUpdateIssueData {
  title?: string;
  description?: string;
  type?: IssueType;
  status?: IssueStatus;
  priority?: IssuePriority;
  assignee?: string | null;
  storyPoints?: number | null;
  labels?: string[];
  dueDate?: string | null;
  sprint?: string | null;
  epic?: string | null;
  parent?: string | null;
  order?: number;
}

export const updateIssue = async (
  issueId: string,
  orgId: string,
  userId: string,
  updates: TUpdateIssueData
): Promise<IIssueDocument> => {
  const orgObjectId = new Types.ObjectId(orgId);
  await requireActiveOrgMember(orgObjectId, userId);

  const issue = await Issue.findById(issueId);
  if (!issue) throw new ApiError(404, 'Issue not found');
  if (!issue.organisation.equals(orgObjectId)) throw new ApiError(403, 'You do not have access to this issue');

  const project = await Project.findById(issue.project);
  if (!project) throw new ApiError(404, 'Project not found');

  const oldStatus = issue.status;
  const oldOrder = issue.order;

  const payload: Partial<{
    title: string;
    description: string;
    type: IssueType;
    status: IssueStatus;
    priority: IssuePriority;
    assignee: Types.ObjectId | null;
    storyPoints: number | null;
    labels: string[];
    dueDate: Date | null;
    sprint: Types.ObjectId | null;
    epic: Types.ObjectId | null;
    parent: Types.ObjectId | null;
    order: number;
  }> = {};

  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.type !== undefined) payload.type = updates.type;
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.storyPoints !== undefined) payload.storyPoints = updates.storyPoints;
  if (updates.labels !== undefined) payload.labels = updates.labels;
  if (updates.dueDate !== undefined) {
    payload.dueDate = updates.dueDate === null ? null : new Date(updates.dueDate);
  }

  if (updates.assignee !== undefined) {
    if (updates.assignee === null) {
      payload.assignee = null;
    } else {
      await requireActiveOrgMember(orgObjectId, updates.assignee);
      payload.assignee = new Types.ObjectId(updates.assignee);
    }
  }

  if (updates.sprint !== undefined) {
    if (updates.sprint === null) {
      payload.sprint = null;
    } else {
      const sprint = await Sprint.findOne({
        _id: updates.sprint,
        project: issue.project,
        organisation: orgObjectId,
      });
      if (!sprint) throw new ApiError(400, 'Sprint not found for this project');
      payload.sprint = new Types.ObjectId(updates.sprint);
    }
  }

  if (updates.epic !== undefined) {
    if (updates.epic === null) {
      payload.epic = null;
    } else {
      const epic = await Issue.findOne({
        _id: updates.epic,
        project: issue.project,
        type: 'epic',
      });
      if (!epic) throw new ApiError(400, 'Epic not found in this project');
      payload.epic = new Types.ObjectId(updates.epic);
    }
  }

  if (updates.parent !== undefined) {
    if (updates.parent === null) {
      payload.parent = null;
    } else {
      if (updates.parent === issueId) throw new ApiError(400, 'Issue cannot be its own parent');
      const parent = await Issue.findOne({ _id: updates.parent, project: issue.project });
      if (!parent) throw new ApiError(400, 'Parent issue not found in this project');
      payload.parent = new Types.ObjectId(updates.parent);
    }
  }

  let newStatus = oldStatus;
  if (updates.status !== undefined) {
    payload.status = updates.status;
    newStatus = updates.status;
  }

  if (updates.status !== undefined && updates.status !== oldStatus) {
    await Issue.updateMany(
      { project: issue.project, status: oldStatus, order: { $gt: oldOrder } },
      { $inc: { order: -1 } }
    );

    const maxInNew = await Issue.findOne({
      project: issue.project,
      status: newStatus,
      _id: { $ne: issue._id },
    }).sort({ order: -1 });

    payload.order = maxInNew ? maxInNew.order + 1 : 0;
  } else if (updates.order !== undefined) {
    payload.order = updates.order;
  }

  if (Object.keys(payload).length === 0) {
    throw new ApiError(400, 'No valid fields to update');
  }

  const updated = await Issue.findByIdAndUpdate(issueId, payload, { new: true }).populate(
    issuePopulateDetail
  );

  if (!updated) throw new ApiError(500, 'Failed to update issue');
  return updated;
};

async function reorderColumnAfterRemoval(
  session: ClientSession,
  projectId: Types.ObjectId,
  status: IssueStatus,
  excludeIssueId: Types.ObjectId
): Promise<void> {
  const remaining = await Issue.find({
    project: projectId,
    status,
    _id: { $ne: excludeIssueId },
  })
    .sort({ order: 1 })
    .session(session);

  for (let i = 0; i < remaining.length; i++) {
    await Issue.findByIdAndUpdate(remaining[i]._id, { order: i }).session(session);
  }
}

async function applyColumnOrder(
  session: ClientSession,
  projectId: Types.ObjectId,
  status: IssueStatus,
  orderedIds: string[]
): Promise<void> {
  for (let i = 0; i < orderedIds.length; i++) {
    await Issue.findByIdAndUpdate(
      orderedIds[i],
      { order: i, status },
      { new: false }
    ).session(session);
  }
}

export const updateIssueStatus = async (
  issueId: string,
  orgId: string,
  userId: string,
  status: IssueStatus,
  order: number
): Promise<IIssueDocument> => {
  const orgObjectId = new Types.ObjectId(orgId);
  await requireActiveOrgMember(orgObjectId, userId);

  const issue = await Issue.findById(issueId);
  if (!issue) throw new ApiError(404, 'Issue not found');
  if (!issue.organisation.equals(orgObjectId)) throw new ApiError(403, 'You do not have access to this issue');

  const projectId = issue.project as Types.ObjectId;
  const oldStatus = issue.status;
  const oldOrder = issue.order;

  if (oldStatus === status && oldOrder === order) {
    const populated = await populateIssueById(issueId);
    if (!populated) throw new ApiError(404, 'Issue not found');
    return populated;
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      if (oldStatus === status) {
        const column = await Issue.find({ project: projectId, status })
          .sort({ order: 1 })
          .session(session);

        const ids = column.map((doc) => doc._id.toString());
        const currentIndex = ids.indexOf(issueId);
        if (currentIndex === -1) throw new ApiError(500, 'Inconsistent board state');

        ids.splice(currentIndex, 1);
        const insertIndex = Math.min(Math.max(0, order), ids.length);
        ids.splice(insertIndex, 0, issueId);

        await applyColumnOrder(session, projectId, status, ids);
      } else {
        await reorderColumnAfterRemoval(session, projectId, oldStatus, new Types.ObjectId(issueId));

        const targetColumn = await Issue.find({ project: projectId, status })
          .sort({ order: 1 })
          .session(session);

        const ids = targetColumn.map((doc) => doc._id.toString());
        const insertIndex = Math.min(Math.max(0, order), ids.length);
        ids.splice(insertIndex, 0, issueId);

        await applyColumnOrder(session, projectId, status, ids);
      }
    });
  } finally {
    await session.endSession();
  }

  const populated = await populateIssueById(issueId);
  if (!populated) throw new ApiError(404, 'Issue not found');
  return populated;
};

export const deleteIssue = async (
  issueId: string,
  orgId: string,
  userId: string
): Promise<void> => {
  const orgObjectId = new Types.ObjectId(orgId);
  await requireActiveOrgMember(orgObjectId, userId);

  const issue = await Issue.findById(issueId);
  if (!issue) throw new ApiError(404, 'Issue not found');
  if (!issue.organisation.equals(orgObjectId)) throw new ApiError(403, 'You do not have access to this issue');

  const project = await Project.findById(issue.project);
  if (!project) throw new ApiError(404, 'Project not found');

  await requireDeletePermission(issue, project, userId);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Issue.deleteOne({ _id: issue._id }).session(session);
      await Project.findByIdAndUpdate(project._id, { $inc: { issueCount: -1 } }).session(session);
      await Issue.updateMany(
        {
          project: issue.project,
          status: issue.status,
          order: { $gt: issue.order },
        },
        { $inc: { order: -1 } }
      )
        .session(session)
        .exec();
    });
  } finally {
    await session.endSession();
  }
};

export const addWatcher = async (
  issueId: string,
  orgId: string,
  userId: string
): Promise<IUser[]> => {
  const orgObjectId = new Types.ObjectId(orgId);
  await requireActiveOrgMember(orgObjectId, userId);

  const issue = await Issue.findById(issueId);
  if (!issue) throw new ApiError(404, 'Issue not found');
  if (!issue.organisation.equals(orgObjectId)) throw new ApiError(403, 'You do not have access to this issue');

  const uid = new Types.ObjectId(userId);
  if (!issue.watchers.some((w) => w.equals(uid))) {
    issue.watchers.push(uid);
    await issue.save();
  }

  const refreshed = await Issue.findById(issueId).populate(
    'watchers',
    'name avatar email role createdAt updatedAt'
  );
  if (!refreshed) throw new ApiError(500, 'Failed to reload issue');
  return refreshed.watchers as unknown as IUser[];
};

export const removeWatcher = async (
  issueId: string,
  orgId: string,
  userId: string
): Promise<IUser[]> => {
  const orgObjectId = new Types.ObjectId(orgId);
  await requireActiveOrgMember(orgObjectId, userId);

  const issue = await Issue.findById(issueId);
  if (!issue) throw new ApiError(404, 'Issue not found');
  if (!issue.organisation.equals(orgObjectId)) throw new ApiError(403, 'You do not have access to this issue');

  const uid = new Types.ObjectId(userId);
  issue.watchers = issue.watchers.filter((w) => !w.equals(uid));
  await issue.save();

  const refreshed = await Issue.findById(issueId).populate(
    'watchers',
    'name avatar email role createdAt updatedAt'
  );
  if (!refreshed) throw new ApiError(500, 'Failed to reload issue');
  return refreshed.watchers as unknown as IUser[];
};

const ALL_TYPES: IssueType[] = ['story', 'task', 'bug', 'epic', 'subtask'];

export const getBacklogIssues = async (
  projectId: string,
  orgId: string,
  userId: string
): Promise<Record<IssueType, IIssueDocument[]>> => {
  const orgObjectId = new Types.ObjectId(orgId);
  await requireActiveOrgMember(orgObjectId, userId);
  await getProjectInOrgOrThrow(projectId, orgObjectId);

  const raw = await Issue.find({
    project: projectId,
    sprint: null,
    status: { $ne: 'done' },
  }).populate(issuePopulateListFields);

  raw.sort((a, b) => {
    const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (pr !== 0) return pr;
    return a.order - b.order;
  });

  const grouped: Record<IssueType, IIssueDocument[]> = {
    story: [],
    task: [],
    bug: [],
    epic: [],
    subtask: [],
  };

  for (const t of ALL_TYPES) {
    grouped[t] = raw.filter((doc) => doc.type === t);
  }

  return grouped;
};
