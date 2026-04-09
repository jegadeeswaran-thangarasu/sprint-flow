export const QUERY_KEYS = {
  ME: ['me'],
  PROJECTS: ['projects'],
  ISSUES: (projectId: string) => ['issues', projectId],
  SPRINTS: (projectId: string) => ['sprints', projectId],
  ORGANISATIONS: ['organisations'],
  ORGANISATION: (slug: string) => ['organisations', slug],
  ORG_MEMBERS: (slug: string) => ['organisations', slug, 'members'],
} as const;
