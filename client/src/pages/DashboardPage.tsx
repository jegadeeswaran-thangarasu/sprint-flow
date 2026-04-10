import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useAuthStore from '@/store/authStore';
import { useDashboard } from '@/hooks/useDashboard';
import IssueDetailPanel from '@/components/issues/IssueDetailPanel';
import IssueTypeIcon from '@/components/issues/IssueTypeIcon';
import PriorityIcon from '@/components/issues/PriorityIcon';
import ProjectCard from '@/components/projects/ProjectCard';
import { IDashboardMyIssue, IIssue } from '@/types';

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function mondayOfWeek(containing: Date): Date {
  const c = new Date(containing);
  const day = c.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  c.setDate(c.getDate() + diff);
  return startOfLocalDay(c);
}

function sundayEndOfWeek(containing: Date): Date {
  const mon = mondayOfWeek(containing);
  const s = new Date(mon);
  s.setDate(s.getDate() + 6);
  s.setHours(23, 59, 59, 999);
  return s;
}

function parseDue(iso: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDueLabel(iso: string | null): string {
  const d = parseDue(iso);
  if (!d) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function normalizeIssueForPanel(issue: IDashboardMyIssue): IIssue {
  return {
    ...issue,
    description: issue.description ?? '',
    project: issue.project._id,
    sprint: issue.sprint ? issue.sprint._id : null,
  };
}

const DashboardPage = () => {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const slug = orgSlug ?? '';
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError } = useDashboard(slug);
  const [panelIssue, setPanelIssue] = useState<IDashboardMyIssue | null>(null);

  useEffect(() => {
    if (window.location.hash === '#assigned-to-me') {
      requestAnimationFrame(() =>
        document.getElementById('assigned-to-me')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      );
    }
  }, [data]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const dateSubtext = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    [],
  );

  const myIssues = data?.myIssues ?? [];
  const displayIssues = myIssues.slice(0, 8);
  const issueStats = data?.issueStats;
  const sprintProgress = data?.sprintProgress ?? [];
  const recentProjects = (data?.recentProjects ?? []).slice(0, 4);

  const myOpenCountLabel = myIssues.length === 10 ? '10+' : String(myIssues.length);

  const inProgressOrg = issueStats?.byStatus.inprogress ?? 0;

  const sprintTotals = useMemo(() => {
    const total = sprintProgress.reduce((acc, p) => acc + p.total, 0);
    const done = sprintProgress.reduce((acc, p) => acc + p.done, 0);
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, pct };
  }, [sprintProgress]);

  const { dueThisWeekCount, hasOverdue } = useMemo(() => {
    const now = new Date();
    const start = mondayOfWeek(now);
    const end = sundayEndOfWeek(now);
    const todayStart = startOfLocalDay(now);
    let dueWeek = 0;
    let overdue = false;
    for (const issue of myIssues) {
      const due = parseDue(issue.dueDate);
      if (!due) continue;
      if (due < todayStart) {
        overdue = true;
      }
      if (due.getTime() >= start.getTime() && due.getTime() <= end.getTime()) {
        dueWeek += 1;
      }
    }
    return { dueThisWeekCount: dueWeek, hasOverdue: overdue };
  }, [myIssues]);

  const scrollToAssigned = () => {
    navigate(`/org/${slug}/dashboard#assigned-to-me`);
    requestAnimationFrame(() =>
      document.getElementById('assigned-to-me')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg
          className="h-8 w-8 animate-spin text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2 text-center">
        <p className="text-sm text-red-600 font-medium">Could not load dashboard</p>
        <p className="text-xs text-gray-500">Please refresh and try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">
          {greeting}, {user?.name?.split(' ')[0] ?? 'there'}
        </h1>
        <p className="text-sm text-gray-500">{dateSubtext}</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={scrollToAssigned}
          className="text-left rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-blue-200 hover:shadow transition-all"
        >
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span className="text-xs font-medium uppercase tracking-wide">You</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 tabular-nums">{myOpenCountLabel}</p>
          <p className="text-sm text-gray-500 mt-1">Open issues</p>
        </button>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-xs font-medium uppercase tracking-wide">Org</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 tabular-nums">{inProgressOrg}</p>
          <p className="text-sm text-gray-500 mt-1">Issues in progress</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs font-medium uppercase tracking-wide">Sprints</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {sprintTotals.done}/{sprintTotals.total} done
          </p>
          <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${sprintTotals.pct}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">Active sprint progress</p>
        </div>

        <div
          className={[
            'rounded-xl border p-4 shadow-sm',
            hasOverdue ? 'border-red-200 bg-red-50/80' : 'border-gray-200 bg-white',
          ].join(' ')}
        >
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium uppercase tracking-wide">Due</span>
          </div>
          <p className={['text-3xl font-bold tabular-nums', hasOverdue ? 'text-red-700' : 'text-gray-900'].join(' ')}>
            {dueThisWeekCount}
          </p>
          <p className={['text-sm mt-1', hasOverdue ? 'text-red-600 font-medium' : 'text-gray-500'].join(' ')}>
            {hasOverdue ? 'Overdue items in your list' : 'Due this week'}
          </p>
        </div>
      </section>

      <section id="assigned-to-me" className="scroll-mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Assigned to me</h2>
          <Link
            to={`/org/${slug}/projects`}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View all
          </Link>
        </div>

        {displayIssues.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-12 text-center text-sm text-gray-500">
            No issues assigned to you
          </div>
        ) : (
          <ul className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
            {displayIssues.map((issue) => {
              const due = parseDue(issue.dueDate);
              const todayStart = startOfLocalDay(new Date());
              const overdue = due !== null && due < todayStart;
              return (
                <li key={issue._id}>
                  <button
                    type="button"
                    onClick={() => setPanelIssue(issue)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <IssueTypeIcon type={issue.type} />
                    <span className="font-mono text-xs text-gray-500 w-16 flex-shrink-0">{issue.key}</span>
                    <span className="flex-1 min-w-0 text-sm font-medium text-gray-900 truncate">{issue.title}</span>
                    <span
                      className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium flex-shrink-0 max-w-[100px] truncate"
                      style={{
                        backgroundColor: `${issue.project.color || '#6366f1'}18`,
                        color: '#374151',
                      }}
                      title={issue.project.name}
                    >
                      {issue.project.key}
                    </span>
                    <PriorityIcon priority={issue.priority} />
                    {issue.dueDate && (
                      <span
                        className={[
                          'text-xs tabular-nums flex-shrink-0 w-[72px] text-right',
                          overdue ? 'text-red-600 font-semibold' : 'text-gray-500',
                        ].join(' ')}
                      >
                        {formatDueLabel(issue.dueDate)}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Active sprints</h2>
        {sprintProgress.length === 0 ? (
          <p className="text-sm text-gray-500">No active sprints in your projects.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sprintProgress.map((row) => {
              const color = row.project.color || '#6366f1';
              const start = row.sprint.startDate
                ? new Date(row.sprint.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                : '—';
              const end = row.sprint.endDate
                ? new Date(row.sprint.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                : '—';
              return (
                <div
                  key={row.sprint._id}
                  className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{row.project.name}</p>
                      <p className="text-sm font-medium text-gray-800 truncate">{row.sprint.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {start} – {end}
                      </p>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{row.percentage}% complete</span>
                      <span>
                        {row.done} of {row.total} issues complete
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${row.percentage}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                  <Link
                    to={`/org/${slug}/projects/${row.project._id}/board`}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                  >
                    View board
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent projects</h2>
        {recentProjects.length === 0 ? (
          <p className="text-sm text-gray-500">No projects yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentProjects.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
                orgSlug={slug}
                onArchive={() => undefined}
                isArchiving={false}
              />
            ))}
          </div>
        )}
      </section>

      {panelIssue && (
        <IssueDetailPanel
          issue={normalizeIssueForPanel(panelIssue)}
          orgSlug={slug}
          projectId={panelIssue.project._id}
          onClose={() => setPanelIssue(null)}
        />
      )}
    </div>
  );
};

export default DashboardPage;
