import { Link, useParams } from 'react-router-dom';
import { useProject } from '@/hooks/useProject';

const BoardPage = () => {
  const { orgSlug, projectId } = useParams<{ orgSlug: string; projectId: string }>();
  const slug = orgSlug ?? '';
  const id = projectId ?? '';

  const { data: project, isLoading } = useProject(slug, id);

  if (isLoading) {
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
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3 min-w-0">
          {project?.icon && (
            <span className="text-2xl leading-none flex-shrink-0">{project.icon}</span>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                {project?.name ?? 'Board'}
              </h1>
              {project?.key && (
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs font-mono rounded flex-shrink-0">
                  {project.key}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-0.5">Kanban board</p>
          </div>
        </div>

        <Link
          to={`/org/${slug}/projects`}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          All projects
        </Link>
      </div>

      {/* Placeholder */}
      <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
        <div className="text-5xl mb-4 select-none">🗂️</div>
        <h2 className="text-base font-semibold text-gray-700 mb-2">Kanban board coming soon</h2>
        <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
          The interactive kanban board will be built in the next phase. Stay tuned!
        </p>
      </div>
    </>
  );
};

export default BoardPage;
