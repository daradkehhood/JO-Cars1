import { create } from 'zustand';
import { getAuthData, setAuthData, clearAuthData, AuthData } from '../lib/auth';
import { api } from '../lib/api';
import { registerSocket, disconnectSocket } from '../lib/socket';

interface AuthState {
  user: AuthData['user'] | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  hydrate: () => Promise<void>;
  updateUser: (data: Partial<AuthData['user']>) => void;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isHydrated: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const res = await api.login(email, password);
      const authData: AuthData = {
        token: res.token,
        user: res.user,
      };
      await setAuthData(authData);
      registerSocket(res.user.id);
      set({
        user: res.user,
        token: res.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data: any) => {
    set({ isLoading: true });
    try {
      const res = await api.register(data);
      const authData: AuthData = {
        token: res.token,
        user: res.user,
      };
      await setAuthData(authData);
      registerSocket(res.user.id);
      set({
        user: res.user,
        token: res.token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    disconnectSocket();
    await clearAuthData();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  hydrate: async () => {
    try {
      const data = await getAuthData();
      if (data) {
        try { registerSocket(data.user.id); } catch (e) { console.warn('Socket error:', e); }
        set({
          user: data.user,
          token: data.token,
          isAuthenticated: true,
          isHydrated: true,
        });
      } else {
        set({ isHydrated: true });
      }
    } catch (e) {
      console.warn('Hydrate error:', e);
      set({ isHydrated: true });
    }
  },

  updateUser: (userData) => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, ...userData } });
    }
  },

  refreshProfile: async () => {
    try {
      const res = await api.getProfile();
      const { token } = get();
      if (token) {
        const authData: AuthData = { token, user: res.user || res };
        await setAuthData(authData);
        set({ user: authData.user });
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  },
}));
