import { IIssue } from '@/types';
import IssueTypeIcon from '@/components/issues/IssueTypeIcon';
import PriorityIcon from '@/components/issues/PriorityIcon';

interface IssueDetailPanelProps {
  issue: IIssue;
  onClose: () => void;
}

const IssueDetailPanel = ({ issue, onClose }: IssueDetailPanelProps) => {
  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/20"
        aria-label="Close panel"
        onClick={onClose}
      />
      <aside className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl border-l border-gray-200 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 min-w-0">
            <IssueTypeIcon type={issue.type} />
            <span className="text-xs font-mono text-gray-400 truncate">{issue.key}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 leading-snug">{issue.title}</h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Priority</span>
            <PriorityIcon priority={issue.priority} showLabel />
          </div>
          {issue.description ? (
            <div
              className="text-sm text-gray-600 [&_a]:text-blue-600 [&_a]:underline break-words"
              dangerouslySetInnerHTML={{ __html: issue.description }}
            />
          ) : (
            <p className="text-sm text-gray-400 italic">No description</p>
          )}
          <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Full issue view with comments, activity, and links is planned for a later phase.
          </div>
        </div>
      </aside>
    </>
  );
};

export default IssueDetailPanel;
