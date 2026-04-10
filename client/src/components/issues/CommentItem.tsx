import { useState } from 'react';
import { IComment } from '@/types';
import {
  useAddReaction,
  useCreateComment,
  useDeleteComment,
  useUpdateComment,
} from '@/hooks/useComment';
import { formatRelativeTime } from '@/utils/formatTime';

const QUICK_EMOJIS = ['👍', '👎', '😄', '🎉', '🚀', '👀', '❤️', '🔥'] as const;

interface CommentItemProps {
  comment: IComment;
  orgSlug: string;
  projectId: string;
  issueId: string;
  currentUserId: string;
  depth?: number;
}

function Avatar({ name, avatar }: { name: string; avatar: string }) {
  const initial = name[0]?.toUpperCase() ?? '?';
  if (avatar) {
    return (
      <img
        src={avatar}
        alt=""
        className="h-8 w-8 rounded-full object-cover border border-gray-200 flex-shrink-0"
      />
    );
  }
  return (
    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[11px] font-bold text-slate-700 flex-shrink-0">
      {initial}
    </div>
  );
}

const CommentItem = ({
  comment,
  orgSlug,
  projectId,
  issueId,
  currentUserId,
  depth = 0,
}: CommentItemProps) => {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [repliesOpen, setRepliesOpen] = useState(false);

  const createComment = useCreateComment(orgSlug, projectId, issueId);
  const updateComment = useUpdateComment(orgSlug, projectId, issueId);
  const deleteComment = useDeleteComment(orgSlug, projectId, issueId);
  const addReaction = useAddReaction(orgSlug, projectId, issueId);

  const isAuthor = comment.author._id === currentUserId;
  const replies = comment.replies ?? [];
  const hasReplies = replies.length > 0;

  const handleSaveEdit = () => {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === comment.content) {
      setEditing(false);
      setEditText(comment.content);
      return;
    }
    updateComment.mutate(
      { commentId: comment._id, content: trimmed },
      {
        onSuccess: () => {
          setEditing(false);
        },
      },
    );
  };

  const handleCancelEdit = () => {
    setEditText(comment.content);
    setEditing(false);
  };

  const handleDelete = () => {
    if (!window.confirm('Delete this comment?')) return;
    deleteComment.mutate(comment._id);
  };

  const handleReplySave = () => {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    createComment.mutate(
      { content: trimmed, parentId: comment._id },
      {
        onSuccess: () => {
          setReplyText('');
          setReplying(false);
          setRepliesOpen(true);
        },
      },
    );
  };

  const toggleReaction = (emoji: string) => {
    addReaction.mutate({ commentId: comment._id, emoji });
    setPickerOpen(false);
  };

  return (
    <div className={depth > 0 ? 'mt-3 pl-4 border-l-2 border-gray-100' : ''}>
      <div className="group flex gap-3">
        <Avatar name={comment.author.name} avatar={comment.author.avatar} />
        <div className="min-w-0 flex-1">
          <div className="rounded-lg border border-transparent hover:border-gray-100 hover:bg-gray-50/80 px-2 py-1.5 -mx-2 -my-1.5 transition-colors">
            <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
              <span className="text-sm font-semibold text-gray-900">{comment.author.name}</span>
              <time
                className="text-xs text-gray-400"
                dateTime={comment.createdAt}
                title={new Date(comment.createdAt).toISOString()}
              >
                {formatRelativeTime(comment.createdAt)}
              </time>
              {comment.isEdited && (
                <span className="text-xs text-gray-400 italic">(edited)</span>
              )}
            </div>

            {editing ? (
              <div className="mt-2 space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[80px]"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={updateComment.isPending}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-1.5 text-sm text-gray-800 whitespace-pre-wrap break-words">
                {comment.content}
              </p>
            )}

            {/* Reactions */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {comment.reactions.map((r) => {
                const count = r.users.length;
                const userReacted = r.users.some((u) => u._id === currentUserId);
                return (
                  <button
                    key={r.emoji}
                    type="button"
                    onClick={() => toggleReaction(r.emoji)}
                    className={[
                      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors',
                      userReacted
                        ? 'border-blue-300 bg-blue-50 text-blue-900'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
                    ].join(' ')}
                  >
                    <span>{r.emoji}</span>
                    <span className="tabular-nums text-gray-500">{count}</span>
                  </button>
                );
              })}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPickerOpen((v) => !v)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:bg-gray-50 text-sm"
                  aria-label="Add reaction"
                >
                  +
                </button>
                {pickerOpen && (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-10 cursor-default"
                      aria-label="Close picker"
                      onClick={() => setPickerOpen(false)}
                    />
                    <div className="absolute left-0 top-full z-20 mt-1 flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                      {QUICK_EMOJIS.map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => toggleReaction(em)}
                          className="rounded p-1 text-lg hover:bg-gray-100"
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-1.5 flex flex-wrap items-center gap-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity">
              {isAuthor && !editing && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditText(comment.content);
                      setEditing(true);
                    }}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="text-xs font-medium text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </>
              )}
              {depth === 0 && (
                <button
                  type="button"
                  onClick={() => setReplying((v) => !v)}
                  className="text-xs font-medium text-gray-600 hover:text-gray-900"
                >
                  Reply
                </button>
              )}
            </div>

            {replying && (
              <div className="mt-3 space-y-2 pl-0">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleReplySave}
                    disabled={createComment.isPending || !replyText.trim()}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReplying(false);
                      setReplyText('');
                    }}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {depth === 0 && hasReplies && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setRepliesOpen((v) => !v)}
                className="text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                ↩ {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </button>
              {repliesOpen && (
                <div className="mt-2 space-y-0">
                  {replies.map((r) => (
                    <CommentItem
                      key={r._id}
                      comment={r}
                      orgSlug={orgSlug}
                      projectId={projectId}
                      issueId={issueId}
                      currentUserId={currentUserId}
                      depth={1}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;
