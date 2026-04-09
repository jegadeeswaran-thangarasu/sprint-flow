import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { register, login, logout, getMe } from '@/api/authApi';
import { getMyOrganisations } from '@/api/organisationApi';
import useAuthStore, { getAccessToken } from '@/store/authStore';
import useOrgStore from '@/store/orgStore';
import { QUERY_KEYS } from '@/utils/constants';
import { IOrganisation } from '@/types';

const navigateAfterAuth = (orgs: IOrganisation[], navigate: (path: string) => void) => {
  if (orgs.length === 0) {
    navigate('/onboarding');
  } else if (orgs.length === 1) {
    navigate(`/org/${orgs[0].slug}/dashboard`);
  } else {
    navigate('/select-org');
  }
};

export const useRegister = () => {
  const { setAuth } = useAuthStore();
  const { setMyOrgs } = useOrgStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ name, email, password }: { name: string; email: string; password: string }) =>
      register(name, email, password),
    onSuccess: async ({ user, accessToken }) => {
      setAuth(user, accessToken);
      try {
        const orgs = await getMyOrganisations();
        setMyOrgs(orgs);
        navigateAfterAuth(orgs, navigate);
      } catch {
        navigate('/onboarding');
      }
    },
  });
};

export const useLogin = () => {
  const { setAuth } = useAuthStore();
  const { setMyOrgs } = useOrgStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
    onSuccess: async ({ user, accessToken }) => {
      setAuth(user, accessToken);
      try {
        const orgs = await getMyOrganisations();
        setMyOrgs(orgs);
        navigateAfterAuth(orgs, navigate);
      } catch {
        navigate('/onboarding');
      }
    },
  });
};

export const useLogout = () => {
  const { clearAuth } = useAuthStore();
  const { setMyOrgs, setCurrentOrg } = useOrgStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      clearAuth();
      setMyOrgs([]);
      // setCurrentOrg expects IOrganisation but we need to clear it — cast via store directly
      useOrgStore.setState({ currentOrg: null });
      navigate('/login');
    },
    onError: () => {
      // Logout failed on server (e.g. token already invalid) — clear locally anyway
      clearAuth();
      useOrgStore.setState({ currentOrg: null, myOrgs: [] });
      navigate('/login');
    },
  });
};

export const useGetMe = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { setAuth } = useAuthStore();

  return useQuery({
    queryKey: QUERY_KEYS.ME,
    queryFn: async () => {
      const user = await getMe();
      const token = getAccessToken();
      if (token) {
        setAuth(user, token);
      }
      return user;
    },
    enabled: isAuthenticated,
  });
};
