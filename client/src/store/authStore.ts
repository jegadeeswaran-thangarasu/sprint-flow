import { create } from 'zustand';
import { IUser, TAuthState } from '@/types';

interface TAuthActions {
  setAuth: (user: IUser, accessToken: string) => void;
  clearAuth: () => void;
}

type TAuthStore = TAuthState & TAuthActions;

const useAuthStore = create<TAuthStore>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
  clearAuth: () => set({ user: null, accessToken: null, isAuthenticated: false }),
}));

export const getAccessToken = (): string | null => useAuthStore.getState().accessToken;

export default useAuthStore;
