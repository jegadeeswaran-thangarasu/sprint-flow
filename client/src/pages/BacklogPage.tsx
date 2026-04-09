import { useMemo, useState, useEffect } from 'react';
import { Link, NavLink, useParams } from 'react-router-dom';
import { useProject } from '@/hooks/useProject';
import { useBacklogIssues, useDeleteIssue } from '@/hooks/useIssue';
import { IProject, IIssue, IssuePriority, IssueType } from '@/types';
import CreateIssueModal from '@/components/issues/CreateIssueModal';
import IssueDetailPanel from '@/components/issues/IssueDetailPanel';
import IssueTypeIcon from '@/components/issues/IssueTypeIcon';
import PriorityIcon from '@/components/issues/PriorityIcon';
import Button from '@/components/ui/Button';

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

const projectMembers = (project: IProject) => {
  const users = project.members.map((m) => m.user);
  if (!users.some((u) => u._id === project.lead._id)) {
    users.unshift(project.lead);
  }
  return users;
};

const Avatar = ({ name, avatar }: { name: string; avatar: string }) => {
  const initial = name[0]?.toUpperCase() ?? '?';
  if (avatar) {
    return (
      <img src={avatar} alt="" className="h-7 w-7 rounded-full object-cover border border-gray-200" />
    );
  }
  return (
    <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-600">
      {initial}
    </div>
  );
};

const BacklogPage = () => {
  const { orgSlug, projectId } = useParams<{ orgSlug: string; projectId: string }>();
  const slug = orgSlug ?? '';
  const id = projectId ?? '';

  const { data: project, isLoading: projectLoading } = useProject(slug, id);
  const { data: issues = [], isLoading: issuesLoading } = useBacklogIssues(slug, id);
  const deleteIssue = useDeleteIssue(slug, id);

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<IIssue | null>(null);
  const [menuIssueId, setMenuIssueId] = useState<string | null>(null);

  const [assigneeFilter, setAssigneeFilter] = useState<TAssigneeFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TTypeFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<TPriorityFilter>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!menuIssueId) return;
    const close = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (!el.closest('[data-issue-menu-root]')) setMenuIssueId(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuIssueId]);

  const members = useMemo(() => (project ? projectMembers(project) : []), [project]);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (assigneeFilter !== 'all') {
        const aid = issue.assignee?._id;
        if (aid !== assigneeFilter) return false;
      }
      if (typeFilter !== 'all' && issue.type !== typeFilter) return false;
      if (priorityFilter !== 'all' && issue.priority !== priorityFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!issue.title.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [issues, assigneeFilter, typeFilter, priorityFilter, search]);

  const loading = projectLoading || issuesLoading;

  if (loading || !project) {
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

  const handleDelete = (issue: IIssue) => {
    setMenuIssueId(null);
    if (!window.confirm(`Delete ${issue.key}? This cannot be undone.`)) return;
    deleteIssue.mutate(issue._id, {
      onSuccess: () => {
        if (selectedIssue?._id === issue._id) setSelectedIssue(null);
      },
    });
  };

  return (
    <>
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link to={`/org/${slug}/projects`} className="hover:text-gray-800">
          Projects
        </Link>
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
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              {filteredIssues.length}
            </span>
          </div>
          <div className="flex gap-1 p-0.5 bg-gray-100 rounded-lg w-fit">
            <NavLink
              to={`/org/${slug}/projects/${id}/board`}
              className={({ isActive }) =>
                [
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900',
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
                  isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900',
                ].join(' ')
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

      <div className="rounded-xl border border-gray-200 bg-white p-4 mb-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Assignee</span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setAssigneeFilter('all')}
              className={[
                'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                assigneeFilter === 'all'
                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50',
              ].join(' ')}
            >
              All
            </button>
            {members.map((u) => (
              <button
                key={u._id}
                type="button"
                onClick={() => setAssigneeFilter(u._id)}
                title={u.name}
                className={[
                  'rounded-full ring-2 transition ring-offset-1',
                  assigneeFilter === u._id ? 'ring-blue-500' : 'ring-transparent hover:ring-gray-300',
                ].join(' ')}
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
              className={[
                'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                typeFilter === t.id
                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50',
              ].join(' ')}
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
              className={[
                'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                priorityFilter === p.id
                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50',
              ].join(' ')}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div>
          <label htmlFor="backlog-search" className="sr-only">
            Search by title
          </label>
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

      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Backlog</h2>
          <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            {filteredIssues.length}
          </span>
        </div>

        {filteredIssues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
            <div className="text-4xl mb-3">📭</div>
            <h3 className="text-base font-semibold text-gray-800 mb-1">Your backlog is empty</h3>
            <p className="text-sm text-gray-500 max-w-sm mb-6">
              Create issues to start planning your work
            </p>
            <Button onClick={() => setCreateOpen(true)}>Create issue</Button>
          </div>
        ) : (
          <ul className="border border-gray-200 rounded-xl overflow-hidden bg-white divide-y divide-gray-100">
            {filteredIssues.map((issue) => (
              <li key={issue._id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedIssue(issue)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedIssue(issue);
                    }
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <span className="text-gray-300 select-none w-5 text-center" aria-hidden>
                    ⠿
                  </span>
                  <IssueTypeIcon type={issue.type} size="sm" />
                  <span className="text-xs font-mono text-gray-400 w-14 flex-shrink-0 truncate">
                    {issue.key}
                  </span>
                  <span className="flex-1 text-sm font-medium text-gray-900 truncate min-w-0">
                    {issue.title}
                  </span>
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
                    data-issue-menu-root
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                      aria-label="Issue actions"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuIssueId((v) => (v === issue._id ? null : issue._id));
                      }}
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                      </svg>
                    </button>
                    {menuIssueId === issue._id && (
                      <div className="absolute right-0 top-full mt-1 z-10 w-36 rounded-lg border border-gray-200 bg-white shadow-lg py-1 text-sm">
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-gray-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuIssueId(null);
                            setSelectedIssue(issue);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(issue);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

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
    </>
  );
};

export default BacklogPage;
