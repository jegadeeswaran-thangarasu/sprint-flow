export const QUERY_KEYS = {
  ME: ['me'],
  ISSUES: (projectId: string) => ['issues', projectId],
  BACKLOG_ISSUES: (projectId: string) => ['issues', projectId, 'backlog'],
  ISSUE: (issueId: string) => ['issues', issueId],
  COMMENTS: (issueId: string) => ['comments', issueId],
  ISSUE_ACTIVITY: (issueId: string) => ['activity', issueId],
  BOARD_ISSUES: (sprintId: string) => ['board', sprintId],
  SPRINTS: (projectId: string) => ['sprints', projectId],
  SPRINT: (sprintId: string) => ['sprints', sprintId],
  SPRINT_ISSUES: (sprintId: string) => ['sprints', sprintId, 'issues'],
  ORGANISATIONS: ['organisations'],
  ORGANISATION: (slug: string) => ['organisations', slug],
  ORG_MEMBERS: (slug: string) => ['organisations', slug, 'members'],
  PROJECTS: (orgSlug: string) => ['projects', orgSlug],
  PROJECT: (orgSlug: string, projectId: string) => ['projects', orgSlug, projectId],
  DASHBOARD: (orgSlug: string) => ['dashboard', orgSlug] as const,
  SEARCH: (orgSlug: string, query: string) => ['search', orgSlug, query] as const,
  BURNDOWN: (orgSlug: string, projectId: string, sprintId: string) =>
    ['burndown', orgSlug, projectId, sprintId] as const,
  VELOCITY: (orgSlug: string, projectId: string, limit: number) =>
    ['velocity', orgSlug, projectId, limit] as const,
  BREAKDOWN: (orgSlug: string, projectId: string, sprintId: string | null) =>
    ['breakdown', orgSlug, projectId, sprintId ?? 'all'] as const,
  SPRINT_REPORT: (orgSlug: string, projectId: string, sprintId: string) =>
    ['sprint-report', orgSlug, projectId, sprintId] as const,
} as const;
