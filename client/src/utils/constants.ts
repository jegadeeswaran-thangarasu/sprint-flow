export const QUERY_KEYS = {
  PROJECTS: ['projects'],
  ISSUES: (projectId: string) => ['issues', projectId],
  SPRINTS: (projectId: string) => ['sprints', projectId],
} as const;
