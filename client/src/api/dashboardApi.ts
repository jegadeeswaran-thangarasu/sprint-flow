import apiClient from '@/api/client';
import { IDashboardData, ISearchResults, TApiResponse } from '@/types';

export const getDashboard = async (orgSlug: string): Promise<IDashboardData> => {
  const { data } = await apiClient.get<TApiResponse<IDashboardData>>(
    `/organisations/${orgSlug}/dashboard`,
  );
  return data.data;
};

export const search = async (orgSlug: string, query: string): Promise<ISearchResults> => {
  const { data } = await apiClient.get<TApiResponse<ISearchResults>>(
    `/organisations/${orgSlug}/dashboard/search`,
    { params: { q: query } },
  );
  return data.data;
};
