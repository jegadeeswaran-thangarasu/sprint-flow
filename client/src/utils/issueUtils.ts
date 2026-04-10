import { IIssue, IssuePriority, IssueStatus, IssueType } from '@/types';

const STATUS_ORDER: IssueStatus[] = ['backlog', 'todo', 'inprogress', 'review', 'done'];

export const getStatusColor = (status: IssueStatus): string => {
  switch (status) {
    case 'backlog':
      return 'text-gray-500';
    case 'todo':
      return 'text-blue-600';
    case 'inprogress':
      return 'text-amber-600';
    case 'review':
      return 'text-purple-600';
    case 'done':
      return 'text-green-600';
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
};

export const getPriorityColor = (priority: IssuePriority): string => {
  switch (priority) {
    case 'urgent':
      return 'text-red-600';
    case 'high':
      return 'text-orange-600';
    case 'medium':
      return 'text-yellow-600';
    case 'low':
      return 'text-gray-400';
    default: {
      const _exhaustive: never = priority;
      return _exhaustive;
    }
  }
};

export const getPriorityIcon = (priority: IssuePriority): string => {
  switch (priority) {
    case 'urgent':
      return '↑↑';
    case 'high':
      return '↑';
    case 'medium':
      return '→';
    case 'low':
      return '↓';
    default: {
      const _exhaustive: never = priority;
      return _exhaustive;
    }
  }
};

export const getTypeIcon = (type: IssueType): string => {
  switch (type) {
    case 'story':
      return '📖';
    case 'task':
      return '✓';
    case 'bug':
      return '🐛';
    case 'epic':
      return '⚡';
    case 'subtask':
      return '↳';
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
};

export const getTypeColor = (type: IssueType): string => {
  switch (type) {
    case 'story':
      return 'text-blue-600';
    case 'task':
      return 'text-gray-500';
    case 'bug':
      return 'text-red-600';
    case 'epic':
      return 'text-purple-600';
    case 'subtask':
      return 'text-gray-500';
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
};

export const groupIssuesByStatus = (issues: IIssue[]): Record<IssueStatus, IIssue[]> => {
  const empty = (): Record<IssueStatus, IIssue[]> => ({
    backlog: [],
    todo: [],
    inprogress: [],
    review: [],
    done: [],
  });

  const result = empty();
  for (const issue of issues) {
    result[issue.status].push(issue);
  }
  for (const status of STATUS_ORDER) {
    result[status].sort((a, b) => a.order - b.order);
  }
  return result;
};
