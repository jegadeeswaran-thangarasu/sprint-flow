import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useOrgStore from '@/store/orgStore';
import { useProject } from '@/hooks/useProject';
import { useProjectSprints } from '@/hooks/useSprint';
import { useBurndown, useIssueBreakdown, useSprintReport, useVelocity } from '@/hooks/useReport';
import BurndownChart from '@/components/charts/BurndownChart';
import VelocityChart from '@/components/charts/VelocityChart';
import IssueBreakdownChart from '@/components/charts/IssueBreakdownChart';
import IssueTypeIcon from '@/components/issues/IssueTypeIcon';
import { IIssue, ISprint } from '@/types';

type TTab = 'burndown' | 'velocity' | 'breakdown' | 'sprint-report';

const tabs: { id: TTab; label: string }[] = [
  { id: 'burndown', label: 'Burndown' },
  { id: 'velocity', label: 'Velocity' },
  { id: 'breakdown', label: 'Breakdown' },
  { id: 'sprint-report', label: 'Sprint Report' },
];

function sprintDurationLabel(start: string | null, end: string | null): string | null {
  if (!start || !end) return null;
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  const days = Math.max(0, Math.round((b - a) / 86_400_000));
  return `${days} day${days === 1 ? '' : 's'}`;
}

function sortSelectableSprints(list: ISprint[]): ISprint[] {
  return [...list]
    .filter((s) => s.status === 'active' || s.status === 'completed')
    .sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (b.status === 'active' && a.status !== 'active') return 1;
      const ae = a.endDate ? new Date(a.endDate).getTime() : 0;
      const be = b.endDate ? new Date(b.endDate).getTime() : 0;
      return be - ae;
    });
}

const IssueRow = ({ issue }: { issue: IIssue }) => (
  <div className="flex items-center gap-3 px-3 py-2 border-b border-gray-100 last:border-0 text-sm">
    <IssueTypeIcon type={issue.type} size="sm" />
    <span className="font-mono text-xs text-gray-500 w-16 flex-shrink-0">{issue.key}</span>
    <span className="flex-1 truncate text-gray-900">{issue.title}</span>
    <span className="text-xs text-gray-500 capitalize flex-shrink-0">{issue.status}</span>
  </div>
);

const CollapsibleList = ({ title, issues }: { title: string; issues: IIssue[] }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-semibold text-gray-900 hover:bg-gray-50"
      >
        <span>
          {title}{' '}
          <span className="font-normal text-gray-500">({issues.length})</span>
        </span>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="max-h-72 overflow-y-auto border-t border-gray-100">
          {issues.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-500 text-center">None</p>
          ) : (
            issues.map((issue) => <IssueRow key={issue._id} issue={issue} />)
          )}
        </div>
      )}
    </div>
  );
};

const ReportsPage = () => {
  const { orgSlug, projectId } = useParams<{ orgSlug: string; projectId: string }>();
  const slug = orgSlug ?? '';
  const pid = projectId ?? '';
  const currentOrg = useOrgStore((s) => s.currentOrg);

  const { data: project, isLoading: projectLoading } = useProject(slug, pid);
  const { data: sprints = [], isLoading: sprintsLoading } = useProjectSprints(slug, pid);

  const selectable = useMemo(() => sortSelectableSprints(sprints), [sprints]);
  const [selectedSprintId, setSelectedSprintId] = useState('');
  const [tab, setTab] = useState<TTab>('burndown');
  const [velocityLimit, setVelocityLimit] = useState(6);
  const [breakdownSprintOnly, setBreakdownSprintOnly] = useState(false);

  useEffect(() => {
    if (selectable.length === 0) {
      setSelectedSprintId('');
      return;
    }
    setSelectedSprintId((current) => {
      if (current && selectable.some((s) => s._id === current)) return current;
      const active = selectable.find((s) => s.status === 'active');
      return (active ?? selectable[0])._id;
    });
  }, [pid, selectable]);

  const burndownQ = useBurndown(slug, pid, selectedSprintId);
  const velocityQ = useVelocity(slug, pid, velocityLimit);
  const breakdownQ = useIssueBreakdown(slug, pid, breakdownSprintOnly ? selectedSprintId : undefined);
  const reportQ = useSprintReport(slug, pid, selectedSprintId);

  const scheduleStatus = useMemo(() => {
    const rows = burndownQ.data?.data;
    if (!rows?.length) return null;
    const last = rows[rows.length - 1];
    return last.actual <= last.ideal ? 'On track' : 'Behind schedule';
  }, [burndownQ.data]);

  const avgVelocity = useMemo(() => {
    const rows = velocityQ.data;
    if (!rows?.length) return 0;
    const sum = rows.reduce((a, r) => a + r.completed, 0);
    return Math.round((sum / rows.length) * 10) / 10;
  }, [velocityQ.data]);

  if (projectLoading || !project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
        <Link to={`/org/${slug}/dashboard`} className="hover:text-blue-600 font-medium">
          {currentOrg?.name ?? 'Org'}
        </Link>
        <span aria-hidden>/</span>
        <Link to={`/org/${slug}/projects`} className="hover:text-blue-600">
          Projects
        </Link>
        <span aria-hidden>/</span>
        <Link to={`/org/${slug}/projects/${pid}/board`} className="hover:text-blue-600 truncate max-w-[200px]">
          {project.name}
        </Link>
        <span aria-hidden>/</span>
        <span className="text-gray-900 font-medium">Reports</span>
      </nav>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Sprint analytics and delivery insights</p>
        </div>
        <div className="flex flex-col gap-1 min-w-[220px]">
          <label htmlFor="sprint-select" className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Sprint
          </label>
          <select
            id="sprint-select"
            value={selectedSprintId}
            onChange={(e) => setSelectedSprintId(e.target.value)}
            disabled={sprintsLoading || selectable.length === 0}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {selectable.length === 0 ? (
              <option value="">No sprints available</option>
            ) : (
              selectable.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.status === 'active' ? 'Active' : 'Completed'})
                </option>
              ))
            )}
          </select>
        </div>
      </header>

      <div className="flex flex-wrap gap-1 border-b border-gray-200 pb-px">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={[
              'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
              tab === t.id
                ? 'bg-white text-blue-700 border border-gray-200 border-b-white -mb-px'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {tab === 'burndown' && (
          <div className="space-y-6">
            {!selectedSprintId ? (
              <p className="text-sm text-gray-500">Select a sprint to view burndown.</p>
            ) : burndownQ.isLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              </div>
            ) : burndownQ.isError ? (
              <p className="text-sm text-red-600">
                Could not load burndown. The sprint may need planned dates, or it hasn&apos;t started
                yet.
              </p>
            ) : burndownQ.data ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{burndownQ.data.sprintName}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {burndownQ.data.startDate && burndownQ.data.endDate
                        ? `${new Date(burndownQ.data.startDate).toLocaleDateString()} – ${new Date(burndownQ.data.endDate).toLocaleDateString()}`
                        : '—'}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      <span className="font-medium">Total scope:</span> {burndownQ.data.totalPoints} story points
                    </p>
                  </div>
                  {scheduleStatus && (
                    <span
                      className={[
                        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold',
                        scheduleStatus === 'On track'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-900',
                      ].join(' ')}
                    >
                      {scheduleStatus}
                    </span>
                  )}
                </div>
                <BurndownChart data={burndownQ.data} />
              </>
            ) : null}
          </div>
        )}

        {tab === 'velocity' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Average velocity</p>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">{avgVelocity}</p>
                <p className="text-xs text-gray-500 mt-0.5">Completed points / sprint (avg.)</p>
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="velocity-limit" className="text-xs font-medium text-gray-500">
                  Last N sprints
                </label>
                <select
                  id="velocity-limit"
                  value={velocityLimit}
                  onChange={(e) => setVelocityLimit(Number(e.target.value))}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                >
                  {[3, 4, 5, 6, 8, 10].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {velocityQ.isLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              </div>
            ) : velocityQ.data && velocityQ.data.length > 0 ? (
              <VelocityChart data={velocityQ.data} />
            ) : (
              <p className="text-sm text-gray-500">No completed sprints yet.</p>
            )}
          </div>
        )}

        {tab === 'breakdown' && (
          <div className="space-y-6">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={breakdownSprintOnly}
                onChange={(e) => setBreakdownSprintOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Filter by selected sprint</span>
            </label>
            {breakdownQ.isLoading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              </div>
            ) : breakdownQ.data ? (
              <IssueBreakdownChart data={breakdownQ.data} />
            ) : null}
          </div>
        )}

        {tab === 'sprint-report' && (
          <div className="space-y-8">
            {!selectedSprintId ? (
              <p className="text-sm text-gray-500">Select a sprint.</p>
            ) : reportQ.isLoading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              </div>
            ) : reportQ.isError ? (
              <p className="text-sm text-red-600">Could not load sprint report.</p>
            ) : reportQ.data ? (
              <>
                <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-slate-50 to-white p-5">
                  <h2 className="text-xl font-bold text-gray-900">{reportQ.data.sprint.name}</h2>
                  {reportQ.data.sprint.goal ? (
                    <p className="text-sm text-gray-600 mt-2">{reportQ.data.sprint.goal}</p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                    <span>
                      <span className="font-medium text-gray-700">Start:</span>{' '}
                      {reportQ.data.sprint.startDate
                        ? new Date(reportQ.data.sprint.startDate).toLocaleDateString()
                        : '—'}
                    </span>
                    <span>
                      <span className="font-medium text-gray-700">End:</span>{' '}
                      {reportQ.data.sprint.endDate
                        ? new Date(reportQ.data.sprint.endDate).toLocaleDateString()
                        : '—'}
                    </span>
                    <span>
                      <span className="font-medium text-gray-700">Duration:</span>{' '}
                      {sprintDurationLabel(reportQ.data.sprint.startDate, reportQ.data.sprint.endDate) ?? '—'}
                    </span>
                    <span>
                      <span className="font-medium text-gray-700">Velocity:</span>{' '}
                      {reportQ.data.velocityPoints} story points
                    </span>
                    <span>
                      <span className="font-medium text-gray-700">Added during sprint:</span>{' '}
                      {reportQ.data.addedDuringSprintCount}
                    </span>
                  </div>
                </div>

                <section>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Team contributions</h3>
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
                        <tr>
                          <th className="px-4 py-3">Member</th>
                          <th className="px-4 py-3 text-right">Issues done</th>
                          <th className="px-4 py-3 text-right">Points</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {reportQ.data.teamContributions.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                              No completed assignee data
                            </td>
                          </tr>
                        ) : (
                          reportQ.data.teamContributions.map((row) => {
                            const initial = row.user.name?.[0]?.toUpperCase() ?? '?';
                            return (
                              <tr key={row.user._id}>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    {row.user.avatar ? (
                                      <img
                                        src={row.user.avatar}
                                        alt=""
                                        className="h-8 w-8 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700">
                                        {initial}
                                      </div>
                                    )}
                                    <span className="font-medium text-gray-900">{row.user.name}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right tabular-nums">{row.issuesCompleted}</td>
                                <td className="px-4 py-3 text-right tabular-nums font-medium">{row.storyPoints}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <CollapsibleList title="Completed issues" issues={reportQ.data.completedIssues} />
                <CollapsibleList title="Incomplete issues" issues={reportQ.data.incompleteIssues} />
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
