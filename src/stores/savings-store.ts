
import { create } from 'zustand';
import type { SavingsEvent } from '@/types';

interface SavingsState {
  savingsEvents: SavingsEvent[];
  savingsInitialized: boolean;
  setSavingsEvents: (events: SavingsEvent[]) => void;
  setSavingsInitialized: (initialized: boolean) => void;
}

export const useSavingsStore = create<SavingsState>()((set) => ({
  savingsEvents: [],
  savingsInitialized: false,
  setSavingsEvents: (events) => set({ savingsEvents: events }),
  setSavingsInitialized: (initialized) => set({ savingsInitialized: initialized }),
}));
