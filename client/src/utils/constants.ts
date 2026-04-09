export const QUERY_KEYS = {
  ME: ['me'],
  ISSUES: (projectId: string) => ['issues', projectId],
  BACKLOG_ISSUES: (projectId: string) => ['issues', projectId, 'backlog'],
  ISSUE: (issueId: string) => ['issues', issueId],
  SPRINTS: (projectId: string) => ['sprints', projectId],
  SPRINT: (sprintId: string) => ['sprints', sprintId],
  SPRINT_ISSUES: (sprintId: string) => ['sprints', sprintId, 'issues'],
  ORGANISATIONS: ['organisations'],
  ORGANISATION: (slug: string) => ['organisations', slug],
  ORG_MEMBERS: (slug: string) => ['organisations', slug, 'members'],
  PROJECTS: (orgSlug: string) => ['projects', orgSlug],
  PROJECT: (orgSlug: string, projectId: string) => ['projects', orgSlug, projectId],
} as const;
