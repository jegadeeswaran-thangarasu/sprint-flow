export const QUERY_KEYS = {
  ME: ['me'],
  ISSUES: (projectId: string) => ['issues', projectId],
  SPRINTS: (projectId: string) => ['sprints', projectId],
  ORGANISATIONS: ['organisations'],
  ORGANISATION: (slug: string) => ['organisations', slug],
  ORG_MEMBERS: (slug: string) => ['organisations', slug, 'members'],
  PROJECTS: (orgSlug: string) => ['projects', orgSlug],
  PROJECT: (orgSlug: string, projectId: string) => ['projects', orgSlug, projectId],
} as const;
