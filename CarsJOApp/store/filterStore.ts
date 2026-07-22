import { create } from 'zustand';
import { CarFilters } from '../types';

interface FilterState {
  filters: CarFilters;
  setFilter: (key: keyof CarFilters, value: any) => void;
  setFilters: (filters: Partial<CarFilters>) => void;
  resetFilters: () => void;
}

const defaultFilters: CarFilters = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export const useFilterStore = create<FilterState>((set) => ({
  filters: { ...defaultFilters },

  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value, page: 1 },
    }));
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters, page: 1 },
    }));
  },

  resetFilters: () => {
    set({ filters: { ...defaultFilters } });
  },
}));
