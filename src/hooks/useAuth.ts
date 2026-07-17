'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    image?: string | null;
    phone?: string | null;
    whatsapp?: string | null;
    whatsappNotifications?: boolean;
    dealerName?: string | null;
    bio?: string | null;
    dealerDescription?: string | null;
    dealerAddress?: string | null;
    rating?: number;
    ratingCount?: number;
  } | null;
  token: string | null;
  isAuthenticated: boolean;
  _hydrated: boolean;
  _refreshing: boolean;
  login: (user: AuthState['user'], token: string) => void;
  logout: () => void;
  updateUser: (data: Partial<AuthState['user']>) => void;
  refreshProfile: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hydrated: false,
      _refreshing: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        try { localStorage.removeItem('jo-cars-auth'); } catch {}
      },
      updateUser: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
      refreshProfile: async () => {
        const { token, _refreshing } = get();
        if (!token || _refreshing) return;
        set({ _refreshing: true });
        try {
          const res = await fetch('/api/auth/profile', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const d = await res.json();
          if (d.success && d.data) {
            set({
              user: {
                id: d.data.id,
                name: d.data.name,
                email: d.data.email,
                role: d.data.role,
                image: d.data.image,
                phone: d.data.phone,
                dealerName: d.data.dealerName,
              },
              isAuthenticated: true,
            });
          }
        } catch {
          // ignore
        }
        set({ _refreshing: false });
      },
    }),
    {
      name: 'jo-cars-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state._hydrated = true;
      },
    }
  )
);
