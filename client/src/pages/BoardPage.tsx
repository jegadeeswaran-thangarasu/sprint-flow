import { useEffect, useMemo, useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Link, NavLink, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useProject } from '@/hooks/useProject';
import { useProjectSprints } from '@/hooks/useSprint';
import { useBoardIssues, useBulkUpdateOrder } from '@/hooks/useIssue';
import useSprintStore from '@/store/sprintStore';
import {
  BoardStatus,
  IBoardColumn,
  IBoardData,
  IBulkUpdateItem,
  IIssue,
  IssuePriority,
  IssueStatus,
  IssueType,
} from '@/types';
import { QUERY_KEYS } from '@/utils/constants';
import BoardColumn from '@/components/board/BoardColumn';
import CreateIssueModal from '@/components/issues/CreateIssueModal';
import IssueDetailPanel from '@/components/issues/IssueDetailPanel';
import Button from '@/components/ui/Button';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLUMNS: IBoardColumn[] = [
  { id: 'todo', label: 'To Do', color: 'blue' },
  { id: 'inprogress', label: 'In Progress', color: 'amber' },
  { id: 'review', label: 'In Review', color: 'purple' },
  { id: 'done', label: 'Done', color: 'green' },
];

type TPriorityFilter = 'all' | IssuePriority;
type TTypeFilter = 'all' | IssueType;

const PRIORITY_OPTIONS: { id: TPriorityFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'urgent', label: 'Urgent' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
];

const TYPE_OPTIONS: { id: TTypeFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'story', label: 'Story' },
  { id: 'task', label: 'Task' },
  { id: 'bug', label: 'Bug' },
  { id: 'epic', label: 'Epic' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getDaysRemaining = (endDate: string | null): number | null => {
  if (!endDate) return null;
  const end = new Date(endDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

// ─── Column skeleton ──────────────────────────────────────────────────────────

const ColumnSkeleton = () => (
  <div className="flex flex-col w-[280px] flex-shrink-0 rounded-xl border border-gray-200 bg-gray-50/80 overflow-hidden">
    <div className="flex items-center justify-between px-3 py-2.5 bg-gray-100 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-gray-200 animate-pulse" />
        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="h-4 w-6 bg-gray-200 rounded-full animate-pulse" />
    </div>
    <div className="p-2 space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-100 p-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 bg-gray-100 rounded animate-pulse" />
            <div className="h-3 w-14 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
          <div className="flex justify-end">
            <div className="h-5 w-5 bg-gray-100 rounded-full animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Avatar (assignee filter) ─────────────────────────────────────────────────

const AvatarFilter = ({ name, avatar }: { name: string; avatar: string }) => {
  const initial = name[0]?.toUpperCase() ?? '?';
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        title={name}
        className="h-6 w-6 rounded-full object-cover border border-gray-200"
      />
    );
  }
  return (
    <div
      title={name}
      className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-semibold text-gray-600"
    >
      {initial}
    </div>
  );
};

// ─── BoardPage ────────────────────────────────────────────────────────────────

const BoardPage = () => {
  const { orgSlug, projectId } = useParams<{ orgSlug: string; projectId: string }>();
  const slug = orgSlug ?? '';
  const id = projectId ?? '';
  const queryClient = useQueryClient();

  const { data: project, isLoading: projectLoading } = useProject(slug, id);
  const { isLoading: sprintsLoading } = useProjectSprints(slug, id);
  const activeSprint = useSprintStore((s) => s.activeSprint);

  const { data: boardData, isLoading: boardLoading } = useBoardIssues(
    slug,
    id,
    activeSprint?._id ?? '',
  );

  const bulkUpdateOrder = useBulkUpdateOrder(slug, id, activeSprint?._id ?? '');

  // ─── Local optimistic state ───────────────────────────────────────────────

  const [localBoardData, setLocalBoardData] = useState<IBoardData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (boardData) setLocalBoardData(boardData);
  }, [boardData]);

  useEffect(() => {
    if (!errorMsg) return;
    const timer = setTimeout(() => setErrorMsg(null), 4000);
    return () => clearTimeout(timer);
  }, [errorMsg]);

  // ─── Filter state ─────────────────────────────────────────────────────────

  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<TPriorityFilter>('all');
  const [selectedType, setSelectedType] = useState<TTypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Modal state ──────────────────────────────────────────────────────────

  const [createDefaultStatus, setCreateDefaultStatus] = useState<IssueStatus>('todo');
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<IIssue | null>(null);

  // ─── Project members ──────────────────────────────────────────────────────

  const members = useMemo(() => {
    if (!project) return [];
    const users = project.members.map((m) => m.user);
    if (project.lead && !users.some((u) => u._id === project.lead._id)) {
      users.unshift(project.lead);
    }
    return users;
  }, [project]);

  // ─── Filtered board data ──────────────────────────────────────────────────

  const filteredBoardData = useMemo<IBoardData | null>(() => {
    if (!localBoardData) return null;

    const filterIssues = (issues: IIssue[]): IIssue[] =>
      issues.filter((issue) => {
        if (
          selectedAssignees.length > 0 &&
          !selectedAssignees.includes(issue.assignee?._id ?? 'unassigned')
        )
          return false;
        if (selectedPriority !== 'all' && issue.priority !== selectedPriority) return false;
        if (selectedType !== 'all' && issue.type !== selectedType) return false;
        if (
          searchQuery.trim() &&
          !issue.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
        )
          return false;
        return true;
      });

    return {
      todo: filterIssues(localBoardData.todo),
      inprogress: filterIssues(localBoardData.inprogress),
      review: filterIssues(localBoardData.review),
      done: filterIssues(localBoardData.done),
    };
  }, [localBoardData, selectedAssignees, selectedPriority, selectedType, searchQuery]);

  // ─── Sprint stats ─────────────────────────────────────────────────────────

  const sprintStats = useMemo(() => {
    if (!localBoardData) return { total: 0, done: 0, pct: 0 };
    const total =
      localBoardData.todo.length +
      localBoardData.inprogress.length +
      localBoardData.review.length +
      localBoardData.done.length;
    const done = localBoardData.done.length;
    return { total, done, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
  }, [localBoardData]);

  // ─── Sprint day badge ─────────────────────────────────────────────────────

  const daysRemaining = activeSprint ? getDaysRemaining(activeSprint.endDate) : null;

  const daysLabel =
    daysRemaining === null
      ? null
      : daysRemaining < 0
        ? `${Math.abs(daysRemaining)}d overdue`
        : daysRemaining === 0
          ? 'Due today'
          : `${daysRemaining}d left`;

  const daysBadgeColor =
    daysRemaining === null
      ? ''
      : daysRemaining < 0
        ? 'bg-red-100 text-red-700'
        : daysRemaining < 3
          ? 'bg-amber-100 text-amber-700'
          : 'bg-green-100 text-green-700';

  // ─── DnD handler ──────────────────────────────────────────────────────────

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;
    if (!localBoardData) return;

    const sourceStatus = source.droppableId as BoardStatus;
    const destStatus = destination.droppableId as BoardStatus;

    const previousBoardData = localBoardData;

    const newBoardData: IBoardData = {
      todo: [...localBoardData.todo],
      inprogress: [...localBoardData.inprogress],
      review: [...localBoardData.review],
      done: [...localBoardData.done],
    };

    // Find and remove from source
    const movedIssue = newBoardData[sourceStatus].find((i) => i._id === draggableId);
    if (!movedIssue) return;
    newBoardData[sourceStatus] = newBoardData[sourceStatus].filter(
      (i) => i._id !== draggableId,
    );

    // Insert into destination
    const updatedIssue: IIssue = { ...movedIssue, status: destStatus };
    const destArray = [...newBoardData[destStatus]];
    destArray.splice(destination.index, 0, updatedIssue);
    newBoardData[destStatus] = destArray;

    setLocalBoardData(newBoardData);

    // Build bulk update payload
    const updates: IBulkUpdateItem[] = [];
    newBoardData[destStatus].forEach((issue, index) => {
      updates.push({ issueId: issue._id, status: destStatus, order: index });
    });
    if (sourceStatus !== destStatus) {
      newBoardData[sourceStatus].forEach((issue, index) => {
        updates.push({ issueId: issue._id, status: sourceStatus, order: index });
      });
    }

    bulkUpdateOrder.mutate(updates, {
      onError: () => {
        setLocalBoardData(previousBoardData);
        setErrorMsg('Failed to update issue position. Changes reverted.');
      },
    });
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleAddIssue = (status: IssueStatus) => {
    setCreateDefaultStatus(status);
    setCreateOpen(true);
  };

  const handleCloseCreateModal = () => {
    setCreateOpen(false);
    if (activeSprint) {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BOARD_ISSUES(activeSprint._id) });
    }
  };

  const toggleAssignee = (userId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(userId) ? prev.filter((uid) => uid !== userId) : [...prev, userId],
    );
  };

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (projectLoading || !project) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg
          className="h-6 w-6 animate-spin text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  const boardIsLoading = sprintsLoading || (activeSprint !== null && (boardLoading || !localBoardData));

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Error toast */}
      {errorMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-red-600 text-white text-sm rounded-lg shadow-xl">
          {errorMsg}
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link to={`/org/${slug}/projects`} className="hover:text-gray-800 transition-colors">
          Projects
        </Link>
        <span aria-hidden>/</span>
        <span className="text-gray-900 font-medium truncate">
          <span className="font-mono text-gray-400 mr-1">{project.key}</span>
          {project.name}
        </span>
      </nav>

      {/* Page header */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Title + tabs */}
        <div className="flex items-start gap-3">
          {project.icon && (
            <span className="text-2xl leading-none flex-shrink-0">{project.icon}</span>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">{project.name}</h1>
            <div className="flex gap-1 p-0.5 bg-gray-100 rounded-lg w-fit mt-2">
              <NavLink
                to={`/org/${slug}/projects/${id}/board`}
                className={({ isActive }) =>
                  [
                    'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900',
                  ].join(' ')
                }
              >
                Board
              </NavLink>
              <NavLink
                to={`/org/${slug}/projects/${id}/backlog`}
                className={({ isActive }) =>
                  [
                    'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900',
                  ].join(' ')
                }
              >
                Backlog
              </NavLink>
            </div>
          </div>
        </div>

        {/* Sprint info bar */}
        {!sprintsLoading && (
          activeSprint ? (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-200">
              <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                <span className="inline-block w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                <span className="font-semibold text-gray-900 truncate">{activeSprint.name}</span>
                {activeSprint.startDate && activeSprint.endDate && (
                  <span className="text-sm text-gray-500 flex-shrink-0">
                    {formatDate(activeSprint.startDate)} → {formatDate(activeSprint.endDate)}
                  </span>
                )}
                {daysLabel && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${daysBadgeColor}`}>
                    {daysLabel}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 sm:ml-auto flex-shrink-0">
                <span className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{sprintStats.done}</span>
                  <span className="text-gray-400">/{sprintStats.total} done</span>
                </span>
                <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${sprintStats.pct}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-500 tabular-nums w-9 text-right">
                  {sprintStats.pct}%
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
              <svg className="h-4 w-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              </svg>
              <span className="text-sm font-medium text-amber-800">No active sprint</span>
              <Link
                to={`/org/${slug}/projects/${id}/backlog`}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Start one in backlog →
              </Link>
            </div>
          )
        )}

        {/* Filters */}
        <div className="flex flex-col gap-3 p-3 bg-white rounded-xl border border-gray-200">
          <div className="flex flex-wrap items-center gap-3">
            {/* Assignee filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Assignee
              </span>
              <button
                type="button"
                onClick={() => setSelectedAssignees([])}
                className={[
                  'px-2 py-1 rounded-full text-xs font-medium border transition-colors',
                  selectedAssignees.length === 0
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50',
                ].join(' ')}
              >
                All
              </button>
              {members.map((user) => (
                <button
                  key={user._id}
                  type="button"
                  onClick={() => toggleAssignee(user._id)}
                  className={[
                    'rounded-full ring-2 ring-offset-1 transition',
                    selectedAssignees.includes(user._id)
                      ? 'ring-blue-500'
                      : 'ring-transparent hover:ring-gray-300',
                  ].join(' ')}
                >
                  <AvatarFilter name={user.name} avatar={user.avatar} />
                </button>
              ))}
            </div>

            <div className="flex-1" />

            <Button size="sm" onClick={() => handleAddIssue('todo')}>
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create issue
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Priority filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide mr-0.5">
                Priority
              </span>
              {PRIORITY_OPTIONS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPriority(p.id)}
                  className={[
                    'px-2 py-1 rounded-full text-xs font-medium border transition-colors',
                    selectedPriority === p.id
                      ? 'border-blue-500 bg-blue-50 text-blue-800'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50',
                  ].join(' ')}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Type filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide mr-0.5">
                Type
              </span>
              {TYPE_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedType(t.id)}
                  className={[
                    'px-2 py-1 rounded-full text-xs font-medium border transition-colors',
                    selectedType === t.id
                      ? 'border-blue-500 bg-blue-50 text-blue-800'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50',
                  ].join(' ')}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative ml-auto">
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"
                />
              </svg>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search issues…"
                className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Board area */}
      {!activeSprint && !sprintsLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
          <div className="text-4xl mb-3">🏃</div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">No active sprint</h3>
          <p className="text-sm text-gray-500 mb-4">
            Start a sprint from the backlog to see issues on the board.
          </p>
          <Link
            to={`/org/${slug}/projects/${id}/backlog`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Backlog
          </Link>
        </div>
      ) : boardIsLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[0, 1, 2, 3].map((i) => (
            <ColumnSkeleton key={i} />
          ))}
        </div>
      ) : filteredBoardData ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-6 pt-1 -mx-1 px-1">
            {COLUMNS.map((column) => (
              <BoardColumn
                key={column.id}
                column={column}
                issues={filteredBoardData[column.id]}
                onIssueClick={setSelectedIssue}
                onAddIssue={handleAddIssue}
              />
            ))}
          </div>
        </DragDropContext>
      ) : null}

      {/* Create Issue Modal */}
      {createOpen && (
        <CreateIssueModal
          onClose={handleCloseCreateModal}
          orgSlug={slug}
          projectId={id}
          project={project}
          defaultStatus={createDefaultStatus}
        />
      )}

      {/* Issue Detail Panel */}
      {selectedIssue && (
        <IssueDetailPanel
          issue={selectedIssue}
          orgSlug={slug}
          projectId={id}
          onClose={() => setSelectedIssue(null)}
          onUpdate={(updated) => {
            setSelectedIssue(updated);
            if (activeSprint?._id) {
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BOARD_ISSUES(activeSprint._id) });
            }
          }}
        />
      )}
    </>
  );
};

export default BoardPage;
