import { useQuery } from '@tanstack/react-query';
import { getBurndown, getIssueBreakdown, getSprintReport, getVelocity } from '@/api/reportApi';
import { QUERY_KEYS } from '@/utils/constants';

export const useBurndown = (orgSlug: string, projectId: string, sprintId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.BURNDOWN(orgSlug, projectId, sprintId),
    queryFn: () => getBurndown(orgSlug, projectId, sprintId),
    enabled: Boolean(orgSlug) && Boolean(projectId) && Boolean(sprintId),
  });
};

export const useVelocity = (orgSlug: string, projectId: string, limit = 6) => {
  return useQuery({
    queryKey: QUERY_KEYS.VELOCITY(orgSlug, projectId, limit),
    queryFn: () => getVelocity(orgSlug, projectId, limit),
    enabled: Boolean(orgSlug) && Boolean(projectId),
  });
};

export const useIssueBreakdown = (
  orgSlug: string,
  projectId: string,
  sprintId: string | undefined,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.BREAKDOWN(orgSlug, projectId, sprintId ?? null),
    queryFn: () => getIssueBreakdown(orgSlug, projectId, sprintId),
    enabled: Boolean(orgSlug) && Boolean(projectId),
  });
};

export const useSprintReport = (orgSlug: string, projectId: string, sprintId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.SPRINT_REPORT(orgSlug, projectId, sprintId),
    queryFn: () => getSprintReport(orgSlug, projectId, sprintId),
    enabled: Boolean(orgSlug) && Boolean(projectId) && Boolean(sprintId),
  });
};
