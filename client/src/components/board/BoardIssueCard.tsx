import { DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import { IIssue, IssuePriority } from '@/types';
import IssueTypeIcon from '@/components/issues/IssueTypeIcon';

const PRIORITY_DOT: Record<IssuePriority, string> = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-400',
  low: 'bg-gray-300',
};

interface BoardIssueCardProps {
  issue: IIssue;
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
  onClick: () => void;
}

const Assignee = ({ name, avatar }: { name: string; avatar: string }) => {
  const initial = name[0]?.toUpperCase() ?? '?';
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        title={name}
        className="h-6 w-6 rounded-full object-cover border border-gray-200 flex-shrink-0"
      />
    );
  }
  return (
    <div
      title={name}
      className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-600 flex-shrink-0"
    >
      {initial}
    </div>
  );
};

const BoardIssueCard = ({ issue, provided, snapshot, onClick }: BoardIssueCardProps) => {
  const visibleLabels = issue.labels.slice(0, 2);
  const extraLabels = issue.labels.length - 2;

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      onClick={onClick}
      className={[
        'bg-white rounded-lg border p-3 cursor-grab active:cursor-grabbing select-none',
        'transition-all duration-150',
        snapshot.isDragging
          ? 'shadow-lg rotate-1 opacity-95 border-blue-400 ring-1 ring-blue-300'
          : 'border-gray-200 shadow-sm hover:border-blue-300 hover:shadow-md',
      ].join(' ')}
    >
      {/* Top row: type icon + key + priority dot */}
      <div className="flex items-center gap-1.5 mb-2">
        <IssueTypeIcon type={issue.type} size="sm" />
        <span className="text-xs font-mono text-gray-400 truncate flex-1 min-w-0">{issue.key}</span>
        <span
          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[issue.priority]}`}
          title={issue.priority}
        />
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug mb-2">
        {issue.title}
      </p>

      {/* Labels */}
      {issue.labels.length > 0 && (
        <div className="flex items-center gap-1 mb-2 flex-wrap">
          {visibleLabels.map((label) => (
            <span
              key={label}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600"
            >
              {label}
            </span>
          ))}
          {extraLabels > 0 && (
            <span className="text-[10px] text-gray-400">+{extraLabels} more</span>
          )}
        </div>
      )}

      {/* Bottom row: epic + story points + assignee */}
      <div className="flex items-center gap-1.5">
        {issue.epic && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 truncate max-w-[72px]">
            {issue.epic.key}
          </span>
        )}
        {issue.storyPoints != null && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
            {issue.storyPoints}
          </span>
        )}
        <div className="flex-1" />
        {issue.assignee && (
          <Assignee name={issue.assignee.name} avatar={issue.assignee.avatar} />
        )}
      </div>
    </div>
  );
};

export default BoardIssueCard;
