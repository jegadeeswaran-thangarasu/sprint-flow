import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { IIssueBreakdown, IssuePriority, IssueStatus, IUser } from '@/types';

interface IssueBreakdownChartProps {
  data: IIssueBreakdown;
}

const STATUS_ORDER: IssueStatus[] = ['todo', 'inprogress', 'review', 'done'];
const STATUS_COLORS: Record<string, string> = {
  todo: '#3b82f6',
  inprogress: '#f59e0b',
  review: '#a855f7',
  done: '#22c55e',
  backlog: '#9ca3af',
};

const PRIORITY_ORDER: IssuePriority[] = ['urgent', 'high', 'medium', 'low'];
const PRIORITY_COLORS: Record<IssuePriority, string> = {
  urgent: '#dc2626',
  high: '#ea580c',
  medium: '#eab308',
  low: '#9ca3af',
};

const STATUS_LABEL: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'To do',
  inprogress: 'In progress',
  review: 'Review',
  done: 'Done',
};

const PRIORITY_LABEL: Record<IssuePriority, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const PieTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { pct: number } }>;
}) => {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-gray-900">{p.name}</p>
      <p className="text-gray-600">
        {p.value} ({p.payload.pct}%)
      </p>
    </div>
  );
};

const Avatar = ({ user }: { user: IUser }) => {
  const initial = user.name?.[0]?.toUpperCase() ?? '?';
  if (user.avatar) {
    return (
      <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
    );
  }
  return (
    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-blue-700">
      {initial}
    </div>
  );
};

const IssueBreakdownChart = ({ data }: IssueBreakdownChartProps) => {
  const statusSlices = STATUS_ORDER.filter((s) => (data.byStatus[s] ?? 0) > 0).map((s) => ({
    name: STATUS_LABEL[s] ?? s,
    value: data.byStatus[s] ?? 0,
    key: s,
  }));
  const statusTotal = statusSlices.reduce((a, b) => a + b.value, 0);
  const pieData = statusSlices.map((s) => ({
    ...s,
    pct: statusTotal > 0 ? Math.round((s.value / statusTotal) * 100) : 0,
  }));

  const priorityRows = PRIORITY_ORDER.map((p) => ({
    name: PRIORITY_LABEL[p],
    key: p,
    value: data.byPriority[p] ?? 0,
  }));

  const maxAssigneeCount = Math.max(1, ...data.byAssignee.slice(0, 5).map((a) => a.count));

  return (
    <div className="space-y-10">
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">By status</h3>
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="w-full sm:w-52 flex-shrink-0" style={{ height: 200 }}>
            {pieData.length === 0 ? (
              <p className="text-sm text-gray-500 py-12 text-center">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={2}
                    label={false}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.key} fill={STATUS_COLORS[entry.key] ?? '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <ul className="text-xs text-gray-600 space-y-1 flex-1">
            {pieData.map((s) => (
              <li key={s.key} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: STATUS_COLORS[s.key] ?? '#94a3b8' }}
                />
                <span>
                  {s.name}: {s.value} ({s.pct}%)
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">By priority</h3>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={priorityRows}
              margin={{ top: 4, right: 16, left: 72, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={68} />
              <Tooltip
                formatter={(value: number) => [`${value} issues`, 'Count']}
                contentStyle={{ borderRadius: 8 }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {priorityRows.map((row) => (
                  <Cell key={row.key} fill={PRIORITY_COLORS[row.key]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">By assignee (top 5)</h3>
        {data.byAssignee.length === 0 ? (
          <p className="text-sm text-gray-500">No assignees</p>
        ) : (
          <ul className="space-y-3">
            {data.byAssignee.slice(0, 5).map(({ user, count }) => (
              <li key={user._id} className="flex items-center gap-3">
                <Avatar user={user} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="font-medium text-gray-900 truncate">{user.name}</span>
                    <span className="text-gray-500 tabular-nums flex-shrink-0">{count}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${(count / maxAssigneeCount) * 100}%` }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default IssueBreakdownChart;
