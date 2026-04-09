import apiClient from '@/api/client';
import { IOrganisation, IOrgMember, OrgRole, TApiResponse } from '@/types';

export const createOrganisation = async (
  name: string,
  description?: string,
): Promise<IOrganisation> => {
  const { data } = await apiClient.post<TApiResponse<IOrganisation>>('/organisations', {
    name,
    description,
  });
  return data.data;
};

export const getMyOrganisations = async (): Promise<IOrganisation[]> => {
  const { data } = await apiClient.get<TApiResponse<IOrganisation[]>>('/organisations/mine');
  return data.data;
};

export const getOrganisationBySlug = async (slug: string): Promise<IOrganisation> => {
  const { data } = await apiClient.get<TApiResponse<IOrganisation>>(`/organisations/${slug}`);
  return data.data;
};

export const updateOrganisation = async (
  slug: string,
  payload: Partial<Pick<IOrganisation, 'name' | 'description' | 'logo'>>,
): Promise<IOrganisation> => {
  const { data } = await apiClient.patch<TApiResponse<IOrganisation>>(
    `/organisations/${slug}`,
    payload,
  );
  return data.data;
};

export const deleteOrganisation = async (slug: string): Promise<void> => {
  await apiClient.delete(`/organisations/${slug}`);
};

export const inviteMember = async (
  slug: string,
  email: string,
  role: OrgRole,
): Promise<{ inviteToken: string; inviteLink: string }> => {
  const { data } = await apiClient.post<
    TApiResponse<{ inviteToken: string; inviteLink: string }>
  >(`/organisations/${slug}/members/invite`, { email, role });
  return data.data;
};

export const acceptInvite = async (token: string): Promise<IOrganisation> => {
  const { data } = await apiClient.post<TApiResponse<IOrganisation>>(`/organisations/invite/accept`, {
    token,
  });
  return data.data;
};

export const getOrgMembers = async (slug: string): Promise<IOrgMember[]> => {
  const { data } = await apiClient.get<TApiResponse<IOrgMember[]>>(
    `/organisations/${slug}/members`,
  );
  return data.data;
};

export const updateMemberRole = async (
  slug: string,
  userId: string,
  role: OrgRole,
): Promise<IOrgMember> => {
  const { data } = await apiClient.patch<TApiResponse<IOrgMember>>(
    `/organisations/${slug}/members/${userId}/role`,
    { role },
  );
  return data.data;
};

export const removeMember = async (slug: string, userId: string): Promise<void> => {
  await apiClient.delete(`/organisations/${slug}/members/${userId}`);
};

export const transferOwnership = async (slug: string, newOwnerId: string): Promise<void> => {
  await apiClient.post(`/organisations/${slug}/members/transfer-ownership`, { newOwnerId });
};
