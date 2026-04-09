import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  createOrganisation,
  getMyOrganisations,
  getOrganisationBySlug,
  inviteMember,
  acceptInvite,
  getOrgMembers,
  updateMemberRole,
  removeMember,
  updateOrganisation,
} from '@/api/organisationApi';
import useOrgStore from '@/store/orgStore';
import { QUERY_KEYS } from '@/utils/constants';
import { OrgRole } from '@/types';

export const useMyOrganisations = () => {
  const setMyOrgs = useOrgStore((state) => state.setMyOrgs);

  return useQuery({
    queryKey: QUERY_KEYS.ORGANISATIONS,
    queryFn: async () => {
      const orgs = await getMyOrganisations();
      setMyOrgs(orgs);
      return orgs;
    },
  });
};

export const useOrganisation = (slug: string) => {
  const setCurrentOrg = useOrgStore((state) => state.setCurrentOrg);

  return useQuery({
    queryKey: QUERY_KEYS.ORGANISATION(slug),
    queryFn: async () => {
      const org = await getOrganisationBySlug(slug);
      setCurrentOrg(org);
      return org;
    },
    enabled: Boolean(slug),
  });
};

export const useCreateOrganisation = () => {
  const addOrg = useOrgStore((state) => state.addOrg);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      createOrganisation(name, description),
    onSuccess: (org) => {
      addOrg(org);
      navigate(`/org/${org.slug}/projects`);
    },
  });
};

export const useUpdateOrganisation = (slug: string) => {
  const updateOrg = useOrgStore((state) => state.updateOrg);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Pick<import('@/types').IOrganisation, 'name' | 'description' | 'logo'>>) =>
      updateOrganisation(slug, data),
    onSuccess: (org) => {
      updateOrg(org);
      queryClient.setQueryData(QUERY_KEYS.ORGANISATION(slug), org);
    },
  });
};

export const useInviteMember = (slug: string) => {
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: OrgRole }) =>
      inviteMember(slug, email, role),
  });
};

export const useAcceptInvite = () => {
  const addOrg = useOrgStore((state) => state.addOrg);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (token: string) => acceptInvite(token),
    onSuccess: (org) => {
      addOrg(org);
      navigate(`/org/${org.slug}/projects`);
    },
  });
};

export const useOrgMembers = (slug: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.ORG_MEMBERS(slug),
    queryFn: () => getOrgMembers(slug),
    enabled: Boolean(slug),
  });
};

export const useUpdateMemberRole = (slug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: OrgRole }) =>
      updateMemberRole(slug, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORG_MEMBERS(slug) });
    },
  });
};

export const useRemoveMember = (slug: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => removeMember(slug, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ORG_MEMBERS(slug) });
    },
  });
};
