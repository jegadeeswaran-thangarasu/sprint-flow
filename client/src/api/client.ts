import axios, { InternalAxiosRequestConfig } from 'axios';
import { getAccessToken } from '@/store/authStore';
import useAuthStore from '@/store/authStore';

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (import.meta.env.DEV) {
    console.log(`API: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null): void => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh'];

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as RetryConfig | undefined;
    const status = error.response?.status;
    const isAuthPath = AUTH_PATHS.some((path) => originalRequest?.url?.includes(path));

    if (!error.response) {
      console.error('Network error — is the server running?');
      return Promise.reject(new Error('Cannot connect to server. Please check your connection.'));
    }

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthPath) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err: unknown) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post<{
          success: boolean;
          data: { accessToken: string };
          message: string;
        }>(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        const { accessToken } = response.data.data;
        const { user } = useAuthStore.getState();

        if (user) {
          useAuthStore.getState().setAuth(user, accessToken);
        }

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const message =
      (error.response?.data as { message?: string } | undefined)?.message ?? error.message;
    return Promise.reject(new Error(message));
  },
);

export default apiClient;
