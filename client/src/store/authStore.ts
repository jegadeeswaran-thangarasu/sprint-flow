import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IUser, TAuthState } from '@/types';

interface TAuthActions {
  setAuth: (user: IUser, accessToken: string) => void;
  clearAuth: () => void;
  getAccessToken: () => string | null;
}

type TAuthStore = TAuthState & TAuthActions;

const useAuthStore = create<TAuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
      clearAuth: () => set({ user: null, accessToken: null, isAuthenticated: false }),
      getAccessToken: () => get().accessToken,
    }),
    {
      name: 'sprintflow-auth',
      // Only persist user identity and auth flag — never the access token (security)
      // accessToken lives in memory only; restored via /auth/refresh on page load
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export const getAccessToken = (): string | null => useAuthStore.getState().accessToken;

export default useAuthStore;
