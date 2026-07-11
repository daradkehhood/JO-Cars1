'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Car, SearchFilters } from '@/types';

interface CompareStore {
  cars: Car[];
  addCar: (car: Car) => void;
  removeCar: (carId: string) => void;
  clearAll: () => void;
  isInCompare: (carId: string) => boolean;
}

export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      cars: [],
      addCar: (car) =>
        set((state) => {
          if (state.cars.length >= 3) return state;
          if (state.cars.find((c) => c.id === car.id)) return state;
          return { cars: [...state.cars, car] };
        }),
      removeCar: (carId) =>
        set((state) => ({ cars: state.cars.filter((c) => c.id !== carId) })),
      clearAll: () => set({ cars: [] }),
      isInCompare: (carId) => get().cars.some((c) => c.id === carId),
    }),
    { name: 'jo-cars-compare' }
  )
);

interface FilterStore {
  filters: SearchFilters;
  setFilter: (key: keyof SearchFilters, value: unknown) => void;
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
}

const defaultFilters: SearchFilters = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export const useFilterStore = create<FilterStore>((set) => ({
  filters: defaultFilters,
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: defaultFilters }),
}));

interface UIStore {
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  searchOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  mobileMenuOpen: false,
  searchOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  setSearchOpen: (open) => set({ searchOpen: open }),
}));

interface NotificationStore {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  decrement: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  decrement: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
}));
