import { ReactNode } from 'react';
import { IActivityLog, ActivityAction, IssueStatus } from '@/types';
import { formatRelativeTime } from '@/utils/formatTime';

const STATUS_BADGE: Record<IssueStatus, string> = {
  backlog: 'bg-slate-100 text-slate-800 border border-slate-200',
  todo: 'bg-blue-100 text-blue-900 border border-blue-200',
  inprogress: 'bg-amber-100 text-amber-900 border border-amber-200',
  review: 'bg-violet-100 text-violet-900 border border-violet-200',
  done: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
};

const STATUS_LABEL: Record<IssueStatus, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  inprogress: 'In Progress',
  review: 'In Review',
  done: 'Done',
};

function StatusBadge({ value }: { value: string }) {
  const status = value as IssueStatus;
  const cls = STATUS_BADGE[status] ?? 'bg-gray-100 text-gray-800 border border-gray-200';
  const label = STATUS_LABEL[status] ?? value;
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

function renderActivityText(activity: IActivityLog, displayNewValue?: string): ReactNode {
  const { action, actor, newValue } = activity;
  const name = actor.name;
  const shown = displayNewValue ?? newValue;

  switch (action as ActivityAction) {
    case 'created':
      return (
        <>
          <span className="font-medium text-gray-900">{name}</span> created this issue
        </>
      );
    case 'status_changed':
      return (
        <>
          <span className="font-medium text-gray-900">{name}</span> moved to{' '}
          {shown ? <StatusBadge value={shown} /> : <span className="text-gray-500">—</span>}
        </>
      );
    case 'priority_changed':
      return (
        <>
          <span className="font-medium text-gray-900">{name}</span> changed priority to{' '}
          <span className="font-medium capitalize text-gray-800">{shown ?? '—'}</span>
        </>
      );
    case 'assignee_changed':
      return (
        <>
          <span className="font-medium text-gray-900">{name}</span> assigned to{' '}
          <span className="font-medium text-gray-800">
            {shown === '' || shown === undefined ? 'Unassigned' : shown}
          </span>
        </>
      );
    case 'sprint_changed':
      return (
        <>
          <span className="font-medium text-gray-900">{name}</span> moved to{' '}
          <span className="font-medium text-gray-800">{shown || 'Backlog'}</span>
        </>
      );
    case 'comment_added':
      return (
        <>
          <span className="font-medium text-gray-900">{name}</span> added a comment
        </>
      );
    case 'comment_deleted':
      return (
        <>
          <span className="font-medium text-gray-900">{name}</span> deleted a comment
        </>
      );
    default:
      return (
        <>
          <span className="font-medium text-gray-900">{name}</span>{' '}
          <span className="text-gray-600">{action.replace(/_/g, ' ')}</span>
        </>
      );
  }
}

interface ActivityItemProps {
  activity: IActivityLog;
  /** When server stores ids (assignee/sprint), parent can pass a readable label */
  displayNewValue?: string;
}

const ActivityItem = ({ activity, displayNewValue }: ActivityItemProps) => {
  const iso = activity.createdAt;
  const relative = formatRelativeTime(iso);

  return (
    <div className="flex gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <div className="flex-shrink-0 pt-0.5">
        {activity.actor.avatar ? (
          <img
            src={activity.actor.avatar}
            alt=""
            className="h-7 w-7 rounded-full object-cover border border-gray-200"
          />
        ) : (
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-700">
            {activity.actor.name[0]?.toUpperCase() ?? '?'}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 text-sm text-gray-700 leading-snug">
        <p className="text-gray-700">{renderActivityText(activity, displayNewValue)}</p>
        <time
          className="mt-1 block text-xs text-gray-400"
          dateTime={iso}
          title={new Date(iso).toISOString()}
        >
          {relative}
        </time>
      </div>
    </div>
  );
};

export default ActivityItem;
