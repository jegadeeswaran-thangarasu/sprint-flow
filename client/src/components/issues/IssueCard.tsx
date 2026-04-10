import { IIssue } from '@/types';
import IssueTypeIcon from '@/components/issues/IssueTypeIcon';
import PriorityIcon from '@/components/issues/PriorityIcon';

interface IssueCardProps {
  issue: IIssue;
  onClick?: () => void;
  draggable?: boolean;
}

const UserAvatar = ({ name, avatar }: { name: string; avatar?: string }) => {
  const initial = name[0]?.toUpperCase() ?? '?';
  if (avatar) {
    return (
      <img
        src={avatar}
        alt=""
        className="h-6 w-6 rounded-full object-cover border border-gray-200 flex-shrink-0"
      />
    );
  }
  return (
    <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-600 flex-shrink-0">
      {initial}
    </div>
  );
};

const IssueCard = ({ issue, onClick, draggable = false }: IssueCardProps) => {
  const labelPreview = issue.labels.slice(0, 2);
  const more = issue.labels.length > 2 ? issue.labels.length - 2 : 0;

  return (
    <div
      role="button"
      tabIndex={0}
      draggable={draggable}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className="w-full text-left rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-colors hover:border-blue-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
    >
      <div className="flex items-center gap-2 mb-2">
        <IssueTypeIcon type={issue.type} size="sm" />
        <span className="text-xs font-mono text-gray-400 truncate">{issue.key}</span>
      </div>
      <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-3">{issue.title}</p>
      <div className="flex items-center justify-between gap-2">
        <div className="flex-shrink-0">
          <PriorityIcon priority={issue.priority} />
        </div>
        <div className="flex-1 min-w-0 flex items-center justify-center gap-1 flex-wrap">
          {labelPreview.map((label) => (
            <span
              key={label}
              className="inline-flex max-w-[5rem] truncate px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600"
            >
              {label}
            </span>
          ))}
          {more > 0 && (
            <span className="text-[10px] font-medium text-gray-400">+{more}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {issue.storyPoints != null && (
            <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1 rounded-md bg-gray-100 text-xs font-semibold text-gray-700">
              {issue.storyPoints}
            </span>
          )}
          {issue.assignee ? (
            <UserAvatar name={issue.assignee.name} avatar={issue.assignee.avatar} />
          ) : (
            <div
              className="h-6 w-6 rounded-full border-2 border-dashed border-gray-300 flex-shrink-0"
              aria-label="Unassigned"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default IssueCard;
