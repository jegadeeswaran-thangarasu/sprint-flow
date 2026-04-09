import { useMemo, useState } from 'react';
import { Link, NavLink, useParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useProject } from '@/hooks/useProject';
import { useBacklogIssues, useDeleteIssue } from '@/hooks/useIssue';
import {
  useProjectSprints,
  useCreateSprint,
  useStartSprint,
  useCompleteSprint,
  useDeleteSprint,
  useMoveIssuesToSprint,
  useRemoveIssuesFromSprint,
  useUpdateSprint,
} from '@/hooks/useSprint';
import useSprintStore from '@/store/sprintStore';
import { IProject, IIssue, ISprint, IssuePriority, IssueType } from '@/types';
import CreateIssueModal from '@/components/issues/CreateIssueModal';
import IssueDetailPanel from '@/components/issues/IssueDetailPanel';
import IssueTypeIcon from '@/components/issues/IssueTypeIcon';
import PriorityIcon from '@/components/issues/PriorityIcon';
import Button from '@/components/ui/Button';
import SprintPanel from '@/components/sprints/SprintPanel';
import CreateSprintButton from '@/components/sprints/CreateSprintButton';

// ─── Constants ─────────────────────────────────────────────────────────────────

const BACKLOG_DROPPABLE_ID = '__backlog__';

type TAssigneeFilter = 'all' | string;
type TTypeFilter = 'all' | Exclude<IssueType, 'subtask'>;
type TPriorityFilter = 'all' | IssuePriority;

const TYPE_FILTERS: { id: TTypeFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'story', label: 'Story' },
  { id: 'task', label: 'Task' },
  { id: 'bug', label: 'Bug' },
  { id: 'epic', label: 'Epic' },
];

const PRIORITY_FILTERS: { id: TPriorityFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'urgent', label: 'Urgent' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

const projectMembers = (project: IProject) => {
  const users = project.members.map((m) => m.user);
  if (project.lead && !users.some((u) => u._id === project.lead._id)) {
    users.unshift(project.lead);
  }
  return users;
};

const Avatar = ({ name, avatar }: { name: string; avatar: string }) => {
  const initial = name[0]?.toUpperCase() ?? '?';
  if (avatar) {
    return <img src={avatar} alt="" className="h-7 w-7 rounded-full object-cover border border-gray-200" />;
  }
  return (
    <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-600">
      {initial}
    </div>
  );
};

// ─── Issue row (backlog section) ───────────────────────────────────────────────

interface BacklogIssueRowProps {
  issue: IIssue;
  index: number;
  sprints: ISprint[];
  onIssueClick: (issue: IIssue) => void;
  onDelete: (issue: IIssue) => void;
  onMoveToSprint: (issueId: string, sprintId: string) => void;
}

const BacklogIssueRow = ({
  issue,
  index,
  sprints,
  onIssueClick,
  onDelete,
  onMoveToSprint,
}: BacklogIssueRowProps) => {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (!el.closest('[data-backlog-issue-menu]')) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const targetSprints = sprints.filter((s) => s.status !== 'completed');

  return (
    <Draggable draggableId={issue._id} index={index}>
      {(provided, snapshot) => (
        <li
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={snapshot.isDragging ? 'rounded-lg shadow-md bg-white' : ''}
        >
          <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors">
            <span
              {...provided.dragHandleProps}
              className="text-gray-300 select-none w-5 text-center cursor-grab flex-shrink-0"
              aria-label="Drag"
            >
              ⠿
            </span>
            <IssueTypeIcon type={issue.type} size="sm" />
            <span className="text-xs font-mono text-gray-400 w-14 flex-shrink-0 truncate">
              {issue.key}
            </span>
            <button
              type="button"
              className="flex-1 text-left text-sm font-medium text-gray-900 truncate min-w-0 hover:text-blue-600"
              onClick={() => onIssueClick(issue)}
            >
              {issue.title}
            </button>
            <span className="flex-shrink-0 w-14 flex justify-center">
              <PriorityIcon priority={issue.priority} />
            </span>
            <span className="flex-shrink-0 w-8 flex justify-center">
              {issue.assignee ? (
                <Avatar name={issue.assignee.name} avatar={issue.assignee.avatar} />
              ) : (
                <div className="h-7 w-7 rounded-full border-2 border-dashed border-gray-200" />
              )}
            </span>
            <span className="flex-shrink-0 w-10 flex justify-center">
              {issue.storyPoints != null ? (
                <span className="text-xs font-semibold text-gray-600 tabular-nums">
                  {issue.storyPoints}
                </span>
              ) : (
                <span className="text-gray-300">—</span>
              )}
            </span>
            <div
              className="relative flex-shrink-0"
              data-backlog-issue-menu
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                aria-label="Issue actions"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 z-10 w-44 rounded-lg border border-gray-200 bg-white shadow-lg py-1 text-sm">
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-gray-50"
                    onClick={() => { setMenuOpen(false); onIssueClick(issue); }}
                  >
                    View / Edit
                  </button>
                  {targetSprints.map((s) => (
                    <button
                      key={s._id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 truncate"
                      onClick={() => { setMenuOpen(false); onMoveToSprint(issue._id, s._id); }}
                    >
                      Move to {s.name}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50"
                    onClick={() => { setMenuOpen(false); onDelete(issue); }}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </li>
      )}
    </Draggable>
  );
};

// ─── Edit Sprint Modal (inline) ────────────────────────────────────────────────

interface EditSprintModalProps {
  sprint: ISprint;
  onSave: (data: { name: string; goal: string }) => void;
  onClose: () => void;
  isLoading: boolean;
}

const EditSprintModal = ({ sprint, onSave, onClose, isLoading }: EditSprintModalProps) => {
  const [name, setName] = useState(sprint.name);
  const [goal, setGoal] = useState(sprint.goal ?? '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Edit sprint</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); onSave({ name, goal }); }}
          className="px-6 py-4 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sprint name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Goal <span className="font-normal text-gray-400">(optional)</span></label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={2}
              placeholder="What do you want to achieve?"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
            <Button type="submit" isLoading={isLoading}>Save</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── BacklogPage ───────────────────────────────────────────────────────────────

const BacklogPage = () => {
  const { orgSlug, projectId } = useParams<{ orgSlug: string; projectId: string }>();
  const slug = orgSlug ?? '';
  const id = projectId ?? '';

  const { data: project, isLoading: projectLoading } = useProject(slug, id);
  const { data: backlogIssues = [], isLoading: issuesLoading } = useBacklogIssues(slug, id);
  const { data: sprintsData = [], isLoading: sprintsLoading } = useProjectSprints(slug, id);

  const sprints = useSprintStore((s) => s.sprints);
  const activeSprint = useSprintStore((s) => s.activeSprint);

  const deleteIssue = useDeleteIssue(slug, id);
  const createSprint = useCreateSprint(slug, id);
  const startSprint = useStartSprint(slug, id);
  const completeSprint = useCompleteSprint(slug, id);
  const deleteSprint = useDeleteSprint(slug, id);
  const moveToSprint = useMoveIssuesToSprint(slug, id);
  const removeFromSprint = useRemoveIssuesFromSprint(slug, id);
  const updateSprint = useUpdateSprint(slug, id);

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<IIssue | null>(null);
  const [editingSprint, setEditingSprint] = useState<ISprint | null>(null);

  const [assigneeFilter, setAssigneeFilter] = useState<TAssigneeFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TTypeFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<TPriorityFilter>('all');
  const [search, setSearch] = useState('');

  const members = useMemo(() => (project ? projectMembers(project) : []), [project]);

  const filteredBacklog = useMemo(() => {
    return backlogIssues.filter((issue) => {
      if (assigneeFilter !== 'all') {
        if (issue.assignee?._id !== assigneeFilter) return false;
      }
      if (typeFilter !== 'all' && issue.type !== typeFilter) return false;
      if (priorityFilter !== 'all' && issue.priority !== priorityFilter) return false;
      if (search.trim()) {
        if (!issue.title.toLowerCase().includes(search.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [backlogIssues, assigneeFilter, typeFilter, priorityFilter, search]);

  const sortedSprints = useMemo(() => {
    const active = sprints.filter((s) => s.status === 'active');
    const planning = sprints.filter((s) => s.status === 'planning').sort((a, b) => a.order - b.order);
    const completed = sprints.filter((s) => s.status === 'completed').sort((a, b) => a.order - b.order);
    return [...active, ...planning, ...completed];
  }, [sprints]);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    const isFromBacklog = source.droppableId === BACKLOG_DROPPABLE_ID;
    const isToBacklog = destination.droppableId === BACKLOG_DROPPABLE_ID;

    if (isFromBacklog && !isToBacklog) {
      // Backlog → Sprint
      moveToSprint.mutate({ sprintId: destination.droppableId, issueIds: [draggableId] });
    } else if (!isFromBacklog && isToBacklog) {
      // Sprint → Backlog
      removeFromSprint.mutate({ sprintId: source.droppableId, issueIds: [draggableId] });
    } else if (!isFromBacklog && !isToBacklog) {
      // Sprint → different Sprint
      moveToSprint.mutate({ sprintId: destination.droppableId, issueIds: [draggableId] });
    }
  };

  const handleDeleteIssue = (issue: IIssue) => {
    if (!window.confirm(`Delete ${issue.key}? This cannot be undone.`)) return;
    deleteIssue.mutate(issue._id, {
      onSuccess: () => {
        if (selectedIssue?._id === issue._id) setSelectedIssue(null);
      },
    });
  };

  const handleDeleteSprint = (sprintId: string) => {
    const sprint = sprints.find((s) => s._id === sprintId);
    if (!window.confirm(`Delete "${sprint?.name ?? 'sprint'}"? Issues will return to backlog.`)) return;
    deleteSprint.mutate(sprintId);
  };

  const handleMoveIssueToSprint = (issueId: string, sprintId: string) => {
    moveToSprint.mutate({ sprintId, issueIds: [issueId] });
  };

  const handleRemoveIssueFromSprint = (issueId: string, sprintId: string) => {
    removeFromSprint.mutate({ sprintId, issueIds: [issueId] });
  };

  const loading = projectLoading || issuesLoading || sprintsLoading;

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg className="h-6 w-6 animate-spin text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <>
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link to={`/org/${slug}/projects`} className="hover:text-gray-800">Projects</Link>
        <span aria-hidden>/</span>
        <span className="text-gray-900 font-medium truncate">
          <span className="font-mono text-gray-400 mr-1">{project.key}</span>
          {project.name}
        </span>
      </nav>

      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {project.icon && <span className="text-2xl leading-none">{project.icon}</span>}
            <h1 className="text-xl font-bold text-gray-900">Backlog</h1>
          </div>
          <div className="flex gap-1 p-0.5 bg-gray-100 rounded-lg w-fit">
            <NavLink
              to={`/org/${slug}/projects/${id}/board`}
              className={({ isActive }) =>
                ['px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'].join(' ')
              }
            >
              Board
            </NavLink>
            <NavLink
              to={`/org/${slug}/projects/${id}/backlog`}
              className={({ isActive }) =>
                ['px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'].join(' ')
              }
            >
              Backlog
            </NavLink>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create issue
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 mb-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Assignee</span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setAssigneeFilter('all')}
              className={['px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                assigneeFilter === 'all' ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'].join(' ')}
            >
              All
            </button>
            {members.map((u) => (
              <button
                key={u._id}
                type="button"
                onClick={() => setAssigneeFilter(u._id)}
                title={u.name}
                className={['rounded-full ring-2 transition ring-offset-1',
                  assigneeFilter === u._id ? 'ring-blue-500' : 'ring-transparent hover:ring-gray-300'].join(' ')}
              >
                <Avatar name={u.name} avatar={u.avatar} />
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide mr-1">Type</span>
          {TYPE_FILTERS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTypeFilter(t.id)}
              className={['px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                typeFilter === t.id ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide mr-1">Priority</span>
          {PRIORITY_FILTERS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPriorityFilter(p.id)}
              className={['px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                priorityFilter === p.id ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-gray-200 text-gray-600 hover:bg-gray-50'].join(' ')}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div>
          <label htmlFor="backlog-search" className="sr-only">Search by title</label>
          <input
            id="backlog-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title…"
            className="w-full max-w-sm px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        {/* Sprint sections */}
        {sortedSprints.length > 0 && (
          <section className="space-y-4 mb-6">
            {sortedSprints.map((sprint) => (
              <SprintPanel
                key={sprint._id}
                sprint={sprint}
                allSprints={sprints}
                activeSprint={activeSprint}
                orgSlug={slug}
                projectId={id}
                onStartSprint={(sprintId, data) => {
                  updateSprint.mutate(
                    { sprintId, data: { name: data.name, goal: data.goal, startDate: data.startDate, endDate: data.endDate } },
                    {
                      onSuccess: () => {
                        startSprint.mutate(sprintId);
                      },
                    },
                  );
                }}
                onCompleteSprint={(sprintId, moveToSprintId) => {
                  completeSprint.mutate({ sprintId, moveToSprintId });
                }}
                onDeleteSprint={handleDeleteSprint}
                onEditSprint={(sprint) => setEditingSprint(sprint)}
                onIssueClick={setSelectedIssue}
                onRemoveFromSprint={(issueId) => handleRemoveIssueFromSprint(issueId, sprint._id)}
                onMoveToSprint={handleMoveIssueToSprint}
                isStarting={startSprint.isPending}
                isCompleting={completeSprint.isPending}
              />
            ))}
          </section>
        )}

        <CreateSprintButton
          nextSprintNumber={sprints.length + 1}
          onCreate={(name) => createSprint.mutate({ name })}
          isLoading={createSprint.isPending}
        />

        {/* Backlog section */}
        <section className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Backlog</h2>
            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              {filteredBacklog.length}
            </span>
          </div>

          <Droppable droppableId={BACKLOG_DROPPABLE_ID}>
            {(provided, snapshot) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {filteredBacklog.length === 0 ? (
                  <div className={[
                    'flex flex-col items-center justify-center py-16 text-center rounded-xl border-2 border-dashed bg-gray-50 min-h-[80px]',
                    snapshot.isDraggingOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200',
                  ].join(' ')}>
                    {!snapshot.isDraggingOver && (
                      <>
                        <div className="text-3xl mb-2">📭</div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-1">Backlog is empty</h3>
                        <p className="text-xs text-gray-500 max-w-xs mb-4">
                          Create issues or drag sprint issues here to move them to backlog
                        </p>
                        <Button size="sm" onClick={() => setCreateOpen(true)}>Create issue</Button>
                      </>
                    )}
                  </div>
                ) : (
                  <ul className={[
                    'border border-gray-200 rounded-xl overflow-hidden bg-white divide-y divide-gray-100',
                    snapshot.isDraggingOver ? 'ring-2 ring-blue-400' : '',
                  ].join(' ')}>
                    {filteredBacklog.map((issue, index) => (
                      <BacklogIssueRow
                        key={issue._id}
                        issue={issue}
                        index={index}
                        sprints={sprints}
                        onIssueClick={setSelectedIssue}
                        onDelete={handleDeleteIssue}
                        onMoveToSprint={handleMoveIssueToSprint}
                      />
                    ))}
                    {provided.placeholder}
                  </ul>
                )}
                {filteredBacklog.length > 0 && provided.placeholder}
              </div>
            )}
          </Droppable>
        </section>
      </DragDropContext>

      {createOpen && (
        <CreateIssueModal
          onClose={() => setCreateOpen(false)}
          orgSlug={slug}
          projectId={id}
          project={project}
          defaultStatus="backlog"
        />
      )}

      {selectedIssue && (
        <IssueDetailPanel issue={selectedIssue} onClose={() => setSelectedIssue(null)} />
      )}

      {editingSprint && (
        <EditSprintModal
          sprint={editingSprint}
          onSave={(data) => {
            updateSprint.mutate(
              { sprintId: editingSprint._id, data },
              { onSuccess: () => setEditingSprint(null) },
            );
          }}
          onClose={() => setEditingSprint(null)}
          isLoading={updateSprint.isPending}
        />
      )}
    </>
  );
};

export default BacklogPage;
