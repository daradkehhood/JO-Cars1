import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Car } from '../types';

const COMPARE_KEY = 'jocars_compare';

interface CompareState {
  cars: Car[];
  addCar: (car: Car) => Promise<void>;
  removeCar: (carId: string) => Promise<void>;
  clearCars: () => Promise<void>;
  isInCompare: (carId: string) => boolean;
  hydrate: () => Promise<void>;
}

export const useCompareStore = create<CompareState>((set, get) => ({
  cars: [],

  addCar: async (car: Car) => {
    const { cars } = get();
    if (cars.length >= 3) return;
    if (cars.find(c => c.id === car.id)) return;
    const updated = [...cars, car];
    set({ cars: updated });
    await AsyncStorage.setItem(COMPARE_KEY, JSON.stringify(updated.map(c => c.id)));
  },

  removeCar: async (carId: string) => {
    const { cars } = get();
    const updated = cars.filter(c => c.id !== carId);
    set({ cars: updated });
    await AsyncStorage.setItem(COMPARE_KEY, JSON.stringify(updated.map(c => c.id)));
  },

  clearCars: async () => {
    set({ cars: [] });
    await AsyncStorage.removeItem(COMPARE_KEY);
  },

  isInCompare: (carId: string) => {
    return get().cars.some(c => c.id === carId);
  },

  hydrate: async () => {
    try {
      const data = await AsyncStorage.getItem(COMPARE_KEY);
      if (data) {
        const ids = JSON.parse(data);
        set({ cars: ids.map((id: string) => ({ id } as Car)) });
      }
    } catch {}
  },
}));
