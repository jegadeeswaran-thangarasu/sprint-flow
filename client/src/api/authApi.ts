import apiClient from '@/api/client';
import { IUser, TApiResponse, TAuthResponse } from '@/types';

export const register = async (
  name: string,
  email: string,
  password: string,
): Promise<TAuthResponse> => {
  const { data } = await apiClient.post<TApiResponse<TAuthResponse>>('/auth/register', {
    name,
    email,
    password,
  });
  return data.data;
};

export const login = async (email: string, password: string): Promise<TAuthResponse> => {
  const { data } = await apiClient.post<TApiResponse<TAuthResponse>>('/auth/login', {
    email,
    password,
  });
  return data.data;
};

export const logout = async (): Promise<void> => {
  await apiClient.post('/auth/logout');
};

export const getMe = async (): Promise<IUser> => {
  const { data } = await apiClient.get<TApiResponse<IUser>>('/auth/me');
  return data.data;
};

export const refreshToken = async (): Promise<{ accessToken: string }> => {
  const { data } = await apiClient.post<TApiResponse<{ accessToken: string }>>('/auth/refresh');
  return data.data;
};
