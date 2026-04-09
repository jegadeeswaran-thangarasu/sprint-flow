import { IssueType } from '@/types';
import { getTypeColor, getTypeIcon } from '@/utils/issueUtils';

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
} as const;

interface IssueTypeIconProps {
  type: IssueType;
  size?: keyof typeof sizeClasses;
}

const IssueTypeIcon = ({ type, size = 'md' }: IssueTypeIconProps) => {
  return (
    <span
      className={`inline-flex items-center justify-center leading-none ${sizeClasses[size]} ${getTypeColor(type)}`}
      title={type}
      aria-hidden
    >
      {getTypeIcon(type)}
    </span>
  );
};

export default IssueTypeIcon;
