import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useOrgStore from '@/store/orgStore';
import { useProject } from '@/hooks/useProject';
import { useFullIssue } from '@/hooks/useIssue';
import IssueDetailContent from '@/components/issues/IssueDetailContent';

const IssueDetailPage = () => {
  const { orgSlug, projectId, issueId } = useParams<{
    orgSlug: string;
    projectId: string;
    issueId: string;
  }>();
  const navigate = useNavigate();
  const currentOrg = useOrgStore((s) => s.currentOrg);

  const slug = orgSlug ?? '';
  const pid = projectId ?? '';
  const iid = issueId ?? '';

  const { data: project, isLoading: projectLoading } = useProject(slug, pid);
  const { data: full, isLoading: issueLoading, isError } = useFullIssue(slug, pid, iid);

  useEffect(() => {
    if (full) {
      document.title = `${full.key} · ${full.title}`;
    }
    return () => {
      document.title = 'SprintFlow';
    };
  }, [full]);

  const loading = projectLoading || issueLoading;

  if (!slug || !pid || !iid) {
    return (
      <div className="p-8 text-center text-sm text-gray-600">Invalid route.</div>
    );
  }

  if (loading && !full) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="h-8 w-8 animate-spin text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-sm text-gray-500">Loading issue…</p>
        </div>
      </div>
    );
  }

  if (isError || !full) {
    return (
      <div className="max-w-md mx-auto p-8 text-center">
        <p className="text-gray-700 mb-4">We couldn&apos;t load this issue.</p>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm font-medium text-blue-600 hover:text-blue-800"
        >
          Go back
        </button>
      </div>
    );
  }

  const orgName = currentOrg?.name ?? 'Organisation';
  const projectName = project?.name ?? 'Project';

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <header className="border-b border-gray-200/80 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <nav className="text-sm text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium text-gray-800 truncate max-w-[10rem]">{orgName}</span>
            <span aria-hidden className="text-gray-300">/</span>
            <Link
              to={`/org/${slug}/projects/${pid}/board`}
              className="hover:text-gray-900 truncate max-w-[12rem]"
            >
              {projectName}
            </Link>
            <span aria-hidden className="text-gray-300">/</span>
            <span className="font-mono text-gray-900 font-semibold">{full.key}</span>
          </nav>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="self-start sm:self-center inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm p-6 sm:p-8">
          <IssueDetailContent
            orgSlug={slug}
            projectId={pid}
            issueId={iid}
            fallbackIssue={full}
          />
        </div>
      </main>
    </div>
  );
};

export default IssueDetailPage;
