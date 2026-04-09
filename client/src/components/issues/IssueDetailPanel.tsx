import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IIssue } from '@/types';
import IssueTypeIcon from '@/components/issues/IssueTypeIcon';
import IssueDetailContent from '@/components/issues/IssueDetailContent';

interface IssueDetailPanelProps {
  issue: IIssue;
  orgSlug: string;
  projectId: string;
  onClose: () => void;
  onUpdate?: (updated: IIssue) => void;
}

const IssueDetailPanel = ({ issue, orgSlug, projectId, onClose, onUpdate }: IssueDetailPanelProps) => {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20"
        aria-hidden
        onClick={onClose}
      />
      <aside
        className={[
          'fixed top-0 right-0 z-50 h-full w-full sm:max-w-[600px] bg-white shadow-2xl flex flex-col',
          'transform transition-transform duration-300 ease-out will-change-transform',
          entered ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        role="dialog"
        aria-modal
        aria-labelledby="issue-panel-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex-shrink-0 flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
          <div className="flex items-center gap-2 min-w-0" id="issue-panel-title">
            <IssueTypeIcon type={issue.type} />
            <span className="text-sm font-mono text-gray-500 truncate">{issue.key}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Link
              to={`/org/${orgSlug}/projects/${projectId}/issues/${issue._id}`}
              className="hidden sm:inline-flex px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              Open full page
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-6">
          <IssueDetailContent
            orgSlug={orgSlug}
            projectId={projectId}
            issueId={issue._id}
            fallbackIssue={issue}
            onIssueUpdated={onUpdate}
            hideHeader
          />
        </div>
      </aside>
    </>
  );
};

export default IssueDetailPanel;
