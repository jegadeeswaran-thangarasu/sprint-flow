import { IssuePriority } from '@/types';
import { getPriorityColor, getPriorityIcon } from '@/utils/issueUtils';

const priorityLabel: Record<IssuePriority, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

interface PriorityIconProps {
  priority: IssuePriority;
  showLabel?: boolean;
}

const PriorityIcon = ({ priority, showLabel = false }: PriorityIconProps) => {
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium tabular-nums ${getPriorityColor(priority)}`}
      title={priorityLabel[priority]}
    >
      <span aria-hidden>{getPriorityIcon(priority)}</span>
      {showLabel && <span className="text-xs font-medium">{priorityLabel[priority]}</span>}
    </span>
  );
};

export default PriorityIcon;
