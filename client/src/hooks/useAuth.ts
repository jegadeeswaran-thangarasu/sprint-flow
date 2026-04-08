import { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { register, login, logout, getMe } from '@/api/authApi';
import useAuthStore, { getAccessToken } from '@/store/authStore';
import { QUERY_KEYS } from '@/utils/constants';

export const useRegister = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ name, email, password }: { name: string; email: string; password: string }) =>
      register(name, email, password),
    onSuccess: ({ user, accessToken }) => {
      setAuth(user, accessToken);
      navigate('/projects');
    },
  });
};

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
    onSuccess: ({ user, accessToken }) => {
      setAuth(user, accessToken);
      navigate('/projects');
    },
  });
};

export const useLogout = () => {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      clearAuth();
      navigate('/login');
    },
  });
};

export const useGetMe = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setAuth = useAuthStore((state) => state.setAuth);

  const query = useQuery({
    queryKey: QUERY_KEYS.ME,
    queryFn: getMe,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (query.data) {
      const token = getAccessToken();
      if (token) {
        setAuth(query.data, token);
      }
    }
  }, [query.data, setAuth]);

  return query;
};
