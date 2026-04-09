import { useQuery } from '@tanstack/react-query';
import { getDashboard, search } from '@/api/dashboardApi';
import { QUERY_KEYS } from '@/utils/constants';

export const useDashboard = (orgSlug: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD(orgSlug),
    queryFn: () => getDashboard(orgSlug),
    enabled: Boolean(orgSlug),
    staleTime: 30_000,
  });
};

export const useSearch = (orgSlug: string, query: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.SEARCH(orgSlug, query),
    queryFn: () => search(orgSlug, query),
    enabled: Boolean(orgSlug) && query.length >= 2,
    staleTime: 10_000,
  });
};
