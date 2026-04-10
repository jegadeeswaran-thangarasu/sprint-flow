import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useAuthStore from '@/store/authStore';
import { useProject } from '@/hooks/useProject';
import { useProjectSprints } from '@/hooks/useSprint';
import {
  useCreateComment,
  useIssueComments,
} from '@/hooks/useComment';
import { useFullIssue, useIssueActivity, useUpdateIssue } from '@/hooks/useIssue';
import { addIssueWatcher, removeIssueWatcher } from '@/api/issueApi';
import ActivityItem from '@/components/issues/ActivityItem';
import CommentItem from '@/components/issues/CommentItem';
import IssueTypeIcon from '@/components/issues/IssueTypeIcon';
import PriorityIcon from '@/components/issues/PriorityIcon';
import {
  IActivityLog,
  IFullIssue,
  IIssue,
  IProject,
  IssuePriority,
  IssueStatus,
  IUser,
} from '@/types';

type TIssueFallback = IIssue | IFullIssue;
import { QUERY_KEYS } from '@/utils/constants';
import { formatRelativeTime } from '@/utils/formatTime';

const ALL_STATUSES: IssueStatus[] = ['backlog', 'todo', 'inprogress', 'review', 'done'];
const ALL_PRIORITIES: IssuePriority[] = ['urgent', 'high', 'medium', 'low'];

const STATUS_STYLE: Record<IssueStatus, string> = {
  backlog: 'bg-slate-100 text-slate-800',
  todo: 'bg-blue-100 text-blue-900',
  inprogress: 'bg-amber-100 text-amber-900',
  review: 'bg-violet-100 text-violet-900',
  done: 'bg-emerald-100 text-emerald-900',
};

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <div className="text-sm text-gray-900">{children}</div>
    </div>
  );
}

function projectMembersList(project: IProject): IUser[] {
  const users = project.members.map((m) => m.user);
  if (project.lead && !users.some((u) => u._id === project.lead._id)) {
    users.unshift(project.lead);
  }
  return users;
}

function resolveActivityDisplay(
  activity: IActivityLog,
  membersById: Map<string, string>,
  sprintsById: Map<string, string>,
): string | undefined {
  if (activity.action === 'assignee_changed') {
    const id = activity.newValue ?? '';
    if (!id) return 'Unassigned';
    return membersById.get(id) ?? id;
  }
  if (activity.action === 'sprint_changed') {
    const id = activity.newValue ?? '';
    if (!id) return 'Backlog';
    return sprintsById.get(id) ?? 'Sprint';
  }
  return undefined;
}

interface IssueDetailContentProps {
  orgSlug: string;
  projectId: string;
  issueId: string;
  fallbackIssue: TIssueFallback;
  onIssueUpdated?: (issue: IIssue) => void;
  /** When true, hides the main header row (panel provides its own) */
  hideHeader?: boolean;
}

const IssueDetailContent = ({
  orgSlug,
  projectId,
  issueId,
  fallbackIssue,
  onIssueUpdated,
  hideHeader = false,
}: IssueDetailContentProps) => {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: full, isLoading: fullLoading } = useFullIssue(orgSlug, projectId, issueId);
  const { data: activity = [] } = useIssueActivity(orgSlug, projectId, issueId);
  const { data: comments = [] } = useIssueComments(orgSlug, projectId, issueId);
  const { data: project } = useProject(orgSlug, projectId);
  const { data: sprints = [] } = useProjectSprints(orgSlug, projectId);

  const updateIssue = useUpdateIssue(orgSlug, projectId);
  const createComment = useCreateComment(orgSlug, projectId, issueId);

  const [titleEdit, setTitleEdit] = useState(false);
  const [titleValue, setTitleValue] = useState(fallbackIssue.title);
  const [descEdit, setDescEdit] = useState(false);
  const [descValue, setDescValue] = useState(fallbackIssue.description ?? '');
  const [commentDraft, setCommentDraft] = useState('');
  const [commentFocused, setCommentFocused] = useState(false);
  const [activityOpen, setActivityOpen] = useState(true);
  const [labelInput, setLabelInput] = useState('');
  const [pointsEdit, setPointsEdit] = useState(false);
  const [pointsDraft, setPointsDraft] = useState('');
  const [dueOpen, setDueOpen] = useState(false);

  const display: IFullIssue | IIssue = (full ?? fallbackIssue) as IFullIssue | IIssue;

  const sprintSelectValue = useMemo(() => {
    if (full?.sprint) return full.sprint._id;
    if (typeof fallbackIssue.sprint === 'string' && fallbackIssue.sprint) {
      return fallbackIssue.sprint;
    }
    return '';
  }, [full, fallbackIssue.sprint]);

  useEffect(() => {
    setTitleValue(display.title);
    setDescValue(display.description ?? '');
  }, [display.title, display.description, issueId]);

  const membersById = useMemo(() => {
    const m = new Map<string, string>();
    if (project) {
      for (const u of projectMembersList(project)) {
        m.set(u._id, u.name);
      }
    }
    return m;
  }, [project]);

  const sprintsById = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of sprints) {
      m.set(s._id, s.name);
    }
    return m;
  }, [sprints]);

  const watchers = useMemo((): IUser[] => {
    if (full && 'watchers' in full) return full.watchers;
    return fallbackIssue.watchers ?? [];
  }, [full, fallbackIssue]);

  const watchMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const watching = watchers.some((w) => w._id === user._id);
      if (watching) {
        return removeIssueWatcher(orgSlug, projectId, issueId);
      }
      return addIssueWatcher(orgSlug, projectId, issueId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ISSUE(issueId) });
    },
  });

  const patch = (data: Parameters<typeof updateIssue.mutate>[0]['data'], onDone?: (i: IIssue) => void) => {
    updateIssue.mutate(
      { issueId, data },
      {
        onSuccess: (updated) => {
          onIssueUpdated?.(updated);
          onDone?.(updated);
        },
      },
    );
  };

  const isWatching = Boolean(user && watchers.some((w) => w._id === user._id));

  const titleDirty = titleValue.trim() !== display.title;
  const descDirty = (descValue ?? '') !== (display.description ?? '');

  const handleTitleBlur = () => {
    if (!titleDirty) {
      setTitleEdit(false);
      return;
    }
    patch({ title: titleValue.trim() }, () => setTitleEdit(false));
  };

  const handleDescBlur = () => {
    if (!descDirty) {
      setDescEdit(false);
      return;
    }
    patch({ description: descValue }, () => setDescEdit(false));
  };

  const sprintOptions = useMemo(() => {
    return sprints.filter((s) => s.status !== 'completed');
  }, [sprints]);

  if (!project) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-gray-500">
        Loading project…
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row lg:items-start gap-8 lg:gap-10 min-h-0">
      {/* Left column */}
      <div className="min-w-0 flex-1 lg:flex-[2] space-y-6">
        {!hideHeader && (
          <div className="flex items-start gap-2">
            <IssueTypeIcon type={display.type} />
            <span className="text-sm font-mono text-gray-400">{display.key}</span>
          </div>
        )}

        {/* Title */}
        <div>
          {titleEdit ? (
            <div className="space-y-2">
              <textarea
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onBlur={handleTitleBlur}
                rows={2}
                className="w-full text-xl font-bold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              {titleDirty && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => patch({ title: titleValue.trim() }, () => setTitleEdit(false))}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTitleValue(display.title);
                      setTitleEdit(false);
                    }}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setTitleEdit(true)}
              className="text-left w-full text-2xl font-bold text-gray-900 leading-snug hover:bg-gray-50 rounded-lg px-1 -mx-1 py-0.5 transition-colors"
            >
              {display.title}
            </button>
          )}
        </div>

        {/* Description */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Description
          </h3>
          {descEdit ? (
            <textarea
              value={descValue}
              onChange={(e) => setDescValue(e.target.value)}
              onBlur={handleDescBlur}
              rows={6}
              placeholder="Add a description..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[120px]"
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={() => setDescEdit(true)}
              className={[
                'text-left w-full rounded-lg px-2 py-2 text-sm border border-transparent hover:border-gray-200 hover:bg-gray-50',
                display.description ? 'text-gray-700 whitespace-pre-wrap' : 'text-gray-400 italic',
              ].join(' ')}
            >
              {display.description?.trim() ? display.description : 'Add a description...'}
            </button>
          )}
        </div>

        {/* Comments */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Comments{' '}
            <span className="text-gray-400 font-normal">({comments.length})</span>
          </h3>

          <div
            className={[
              'rounded-xl border border-gray-200 bg-gray-50/50 p-3 transition-shadow',
              commentFocused ? 'ring-2 ring-blue-500/30 shadow-sm' : '',
            ].join(' ')}
          >
            <div className="flex gap-3">
              {user && (
                <div className="flex-shrink-0">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt=""
                      className="h-9 w-9 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                      {user.name[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <textarea
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  onFocus={() => setCommentFocused(true)}
                  onBlur={() => {
                    if (!commentDraft.trim()) setCommentFocused(false);
                  }}
                  placeholder="Add a comment..."
                  rows={commentFocused || commentDraft ? 3 : 1}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[40px]"
                />
                {(commentFocused || commentDraft.trim().length > 0) && (
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const t = commentDraft.trim();
                        if (!t) return;
                        createComment.mutate(
                          { content: t },
                          {
                            onSuccess: () => {
                              setCommentDraft('');
                              setCommentFocused(false);
                            },
                          },
                        );
                      }}
                      disabled={createComment.isPending || !commentDraft.trim()}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCommentDraft('');
                        setCommentFocused(false);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-700 hover:bg-white"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {comments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No comments yet</p>
            ) : (
              comments.map((c) => (
                <CommentItem
                  key={c._id}
                  comment={c}
                  orgSlug={orgSlug}
                  projectId={projectId}
                  issueId={issueId}
                  currentUserId={user?._id ?? ''}
                  depth={0}
                />
              ))
            )}
          </div>
        </div>

        {/* Activity */}
        <div className="border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={() => setActivityOpen((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-900 w-full text-left hover:text-blue-700"
          >
            <svg
              className={`h-4 w-4 text-gray-500 transition-transform ${activityOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            Activity
          </button>
          {activityOpen && (
            <div className="mt-2">
              {activity.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">No activity yet</p>
              ) : (
                activity.map((a) => (
                  <ActivityItem
                    key={a._id}
                    activity={a}
                    displayNewValue={resolveActivityDisplay(a, membersById, sprintsById)}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {fullLoading && (
          <p className="text-xs text-gray-400">Syncing latest details…</p>
        )}
      </div>

      {/* Right column */}
      <aside className="w-full lg:flex-1 lg:min-w-[240px] lg:max-w-md flex-shrink-0 space-y-5 lg:border-l lg:border-gray-100 lg:pl-6">
        <FieldRow label="Status">
          <select
            value={display.status}
            onChange={(e) => {
              const status = e.target.value as IssueStatus;
              patch({ status });
            }}
            className={`w-full rounded-lg border-0 py-2 px-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 ${STATUS_STYLE[display.status] ?? 'bg-gray-100'}`}
          >
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === 'inprogress' ? 'In progress' : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </FieldRow>

        <FieldRow label="Assignee">
          <select
            value={display.assignee?._id ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              patch({ assignee: v === '' ? null : v });
            }}
            className="w-full rounded-lg border border-gray-200 py-2 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Unassigned</option>
            {projectMembersList(project).map((m) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
        </FieldRow>

        <FieldRow label="Reporter">
          <div className="flex items-center gap-2">
            {display.reporter.avatar ? (
              <img
                src={display.reporter.avatar}
                alt=""
                className="h-7 w-7 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                {display.reporter.name[0]?.toUpperCase()}
              </div>
            )}
            <span className="font-medium text-gray-800 truncate">{display.reporter.name}</span>
          </div>
        </FieldRow>

        <FieldRow label="Priority">
          <div className="flex items-center gap-2">
            <PriorityIcon priority={display.priority} />
            <select
              value={display.priority}
              onChange={(e) => patch({ priority: e.target.value as IssuePriority })}
              className="flex-1 rounded-lg border border-gray-200 py-1.5 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {ALL_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </FieldRow>

        <FieldRow label="Sprint">
          <select
            value={sprintSelectValue}
            onChange={(e) => {
              const v = e.target.value;
              patch({ sprint: v === '' ? null : v });
            }}
            className="w-full rounded-lg border border-gray-200 py-2 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Backlog</option>
            {sprintOptions.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </FieldRow>

        <FieldRow label="Story points">
          {pointsEdit ? (
            <input
              type="number"
              min={0}
              max={100}
              value={pointsDraft}
              onChange={(e) => setPointsDraft(e.target.value)}
              onBlur={() => {
                setPointsEdit(false);
                const n = pointsDraft === '' ? null : Number(pointsDraft);
                if (n !== null && (!Number.isFinite(n) || n < 0 || n > 100)) {
                  setPointsDraft(
                    display.storyPoints != null ? String(display.storyPoints) : '',
                  );
                  return;
                }
                if (
                  (n === null && (display.storyPoints === null || display.storyPoints === undefined)) ||
                  (n !== null && display.storyPoints === n)
                ) {
                  return;
                }
                patch({ storyPoints: n });
              }}
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setPointsDraft(display.storyPoints != null ? String(display.storyPoints) : '');
                setPointsEdit(true);
              }}
              className="text-left w-full rounded-lg border border-dashed border-gray-200 px-2 py-1.5 text-sm text-gray-800 hover:border-gray-300"
            >
              {display.storyPoints != null ? display.storyPoints : '— Set points'}
            </button>
          )}
        </FieldRow>

        <FieldRow label="Due date">
          {dueOpen ? (
            <input
              type="date"
              value={
                display.dueDate
                  ? display.dueDate.slice(0, 10)
                  : ''
              }
              onChange={(e) => {
                const v = e.target.value;
                patch({ dueDate: v === '' ? null : new Date(v).toISOString() });
              }}
              onBlur={() => setDueOpen(false)}
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={() => setDueOpen(true)}
              className="text-left w-full text-sm text-gray-800 hover:bg-gray-50 rounded-lg px-1 py-0.5"
            >
              {display.dueDate
                ? new Date(display.dueDate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'No due date'}
            </button>
          )}
        </FieldRow>

        <FieldRow label="Labels">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {display.labels.map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
              >
                {label}
                <button
                  type="button"
                  onClick={() =>
                    patch({
                      labels: display.labels.filter((l) => l !== label),
                    })
                  }
                  className="text-gray-500 hover:text-red-600"
                  aria-label={`Remove ${label}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const t = labelInput.trim();
                  if (!t || display.labels.includes(t)) return;
                  patch({ labels: [...display.labels, t] });
                  setLabelInput('');
                }
              }}
              placeholder="Add label…"
              className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
            />
            <button
              type="button"
              onClick={() => {
                const t = labelInput.trim();
                if (!t || display.labels.includes(t)) return;
                patch({ labels: [...display.labels, t] });
                setLabelInput('');
              }}
              className="px-2 py-1.5 rounded-lg bg-gray-100 text-xs font-medium text-gray-700 hover:bg-gray-200"
            >
              +
            </button>
          </div>
        </FieldRow>

        <FieldRow label="Created">
          <span className="text-gray-600" title={new Date(display.createdAt).toISOString()}>
            {formatRelativeTime(display.createdAt)}
          </span>
        </FieldRow>

        <FieldRow label="Updated">
          <span className="text-gray-600" title={new Date(display.updatedAt).toISOString()}>
            {formatRelativeTime(display.updatedAt)}
          </span>
        </FieldRow>

        <FieldRow label="Watchers">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex -space-x-1">
              {watchers.slice(0, 5).map((w) => (
                <div key={w._id} title={w.name}>
                  {w.avatar ? (
                    <img
                      src={w.avatar}
                      alt=""
                      className="h-7 w-7 rounded-full border-2 border-white object-cover"
                    />
                  ) : (
                    <div className="h-7 w-7 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-600">
                      {w.name[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <span className="text-xs text-gray-500">{watchers.length} watching</span>
          </div>
          {user && (
            <button
              type="button"
              onClick={() => watchMutation.mutate()}
              disabled={watchMutation.isPending}
              className="mt-2 w-full rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
            >
              {isWatching ? 'Unwatch' : 'Watch'}
            </button>
          )}
        </FieldRow>
      </aside>
    </div>
  );
};

export default IssueDetailContent;
