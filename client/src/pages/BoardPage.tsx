import { useMemo, useState } from 'react';
import { Link, NavLink, useParams } from 'react-router-dom';
import { useProject } from '@/hooks/useProject';
import { useProjectIssues } from '@/hooks/useIssue';
import { groupIssuesByStatus } from '@/utils/issueUtils';
import { IssueStatus } from '@/types';
import CreateIssueModal from '@/components/issues/CreateIssueModal';
import Button from '@/components/ui/Button';

const COLUMN_ORDER: IssueStatus[] = ['todo', 'inprogress', 'review', 'done'];

const COLUMN_LABEL: Record<IssueStatus, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  inprogress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

const BoardPage = () => {
  const { orgSlug, projectId } = useParams<{ orgSlug: string; projectId: string }>();
  const slug = orgSlug ?? '';
  const id = projectId ?? '';

  const { data: project, isLoading: projectLoading } = useProject(slug, id);
  const { data: issues = [], isLoading: issuesLoading } = useProjectIssues(slug, id);
  const [createOpen, setCreateOpen] = useState(false);

  const grouped = useMemo(() => groupIssuesByStatus(issues), [issues]);

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

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between mb-6">
        <div className="flex items-start gap-3 min-w-0">
          {project.icon && <span className="text-2xl leading-none flex-shrink-0">{project.icon}</span>}
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">{project.name}</h1>
            <p className="text-sm text-gray-400 mt-0.5">Board</p>
            <div className="flex gap-1 p-0.5 bg-gray-100 rounded-lg w-fit mt-3">
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
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <Button onClick={() => setCreateOpen(true)}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Create issue
          </Button>
          <Link
            to={`/org/${slug}/projects`}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            All projects
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMN_ORDER.map((status) => (
          <div
            key={status}
            className="flex flex-col rounded-xl border border-gray-200 bg-gray-50/80 min-h-[280px]"
          >
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 bg-white rounded-t-xl">
              <span className="text-sm font-semibold text-gray-800">{COLUMN_LABEL[status]}</span>
              <span className="text-xs font-medium text-gray-500 tabular-nums bg-gray-100 px-2 py-0.5 rounded-full">
                {grouped[status].length}
              </span>
            </div>
            <div className="flex-1 p-3 flex flex-col items-center justify-center text-center">
              <p className="text-sm text-gray-500 mb-1">Kanban board coming soon</p>
              <p className="text-xs text-gray-400">Drag and drop will arrive in the next phase</p>
            </div>
          </div>
        ))}
      </div>

      {createOpen && (
        <CreateIssueModal
          onClose={() => setCreateOpen(false)}
          orgSlug={slug}
          projectId={id}
          project={project}
          defaultStatus="todo"
        />
      )}
    </>
  );
};

export default BoardPage;
