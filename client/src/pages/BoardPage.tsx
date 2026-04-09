import { useMemo, useState } from 'react';
import { Link, NavLink, useParams } from 'react-router-dom';
import { useProject } from '@/hooks/useProject';
import { useProjectSprints, useSprintIssues } from '@/hooks/useSprint';
import useSprintStore from '@/store/sprintStore';
import { groupIssuesByStatus } from '@/utils/issueUtils';
import { IIssue, IssueStatus } from '@/types';
import CreateIssueModal from '@/components/issues/CreateIssueModal';
import IssueTypeIcon from '@/components/issues/IssueTypeIcon';
import PriorityIcon from '@/components/issues/PriorityIcon';
import Button from '@/components/ui/Button';

const COLUMN_ORDER: IssueStatus[] = ['todo', 'inprogress', 'review', 'done'];

const COLUMN_LABEL: Record<IssueStatus, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  inprogress: 'In Progress',
  review: 'In Review',
  done: 'Done',
};

const Avatar = ({ name, avatar }: { name: string; avatar: string }) => {
  const initial = name[0]?.toUpperCase() ?? '?';
  if (avatar) {
    return <img src={avatar} alt="" className="h-6 w-6 rounded-full object-cover border border-gray-200" />;
  }
  return (
    <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-600">
      {initial}
    </div>
  );
};

const IssueCard = ({ issue }: { issue: IIssue }) => (
  <li className="flex flex-col gap-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-default">
    <div className="flex items-center gap-1.5">
      <IssueTypeIcon type={issue.type} size="sm" />
      <span className="text-xs font-mono text-gray-400 truncate">{issue.key}</span>
      <span className="ml-auto flex-shrink-0">
        <PriorityIcon priority={issue.priority} />
      </span>
    </div>
    <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">{issue.title}</p>
    {issue.assignee && (
      <div className="flex items-center gap-1.5 mt-0.5">
        <Avatar name={issue.assignee.name} avatar={issue.assignee.avatar} />
        <span className="text-xs text-gray-500 truncate">{issue.assignee.name}</span>
      </div>
    )}
  </li>
);

const BoardPage = () => {
  const { orgSlug, projectId } = useParams<{ orgSlug: string; projectId: string }>();
  const slug = orgSlug ?? '';
  const id = projectId ?? '';

  const { data: project, isLoading: projectLoading } = useProject(slug, id);
  useProjectSprints(slug, id);
  const activeSprint = useSprintStore((s) => s.activeSprint);

  const { data: sprintIssues = [], isLoading: issuesLoading } = useSprintIssues(
    slug,
    id,
    activeSprint?._id ?? '',
  );

  const [createOpen, setCreateOpen] = useState(false);

  const grouped = useMemo(() => groupIssuesByStatus(sprintIssues), [sprintIssues]);

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
        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
          {activeSprint ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
              <span className="font-medium text-blue-800 truncate max-w-[160px]">{activeSprint.name}</span>
              <Link
                to={`/org/${slug}/projects/${id}/backlog`}
                className="text-blue-600 hover:text-blue-800 text-xs font-medium flex-shrink-0"
              >
                View backlog
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
              No active sprint —{' '}
              <Link
                to={`/org/${slug}/projects/${id}/backlog`}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                start one in backlog
              </Link>
            </div>
          )}
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

      {!activeSprint ? (
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
          <div className="text-4xl mb-3">🏃</div>
          <h3 className="text-base font-semibold text-gray-800 mb-1">No active sprint</h3>
          <p className="text-sm text-gray-500 mb-4">Start a sprint from the backlog to see issues on the board.</p>
          <Link
            to={`/org/${slug}/projects/${id}/backlog`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Go to backlog
          </Link>
        </div>
      ) : (
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
              <div className="flex-1 p-2">
                {grouped[status].length === 0 ? (
                  <div className="flex items-center justify-center h-full min-h-[120px]">
                    <p className="text-xs text-gray-400">No issues</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {grouped[status].map((issue) => (
                      <IssueCard key={issue._id} issue={issue} />
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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
