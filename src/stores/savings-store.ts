
import { create } from 'zustand';
import type { SavingsEvent } from '@/types';

interface SavingsState {
  savingsEvents: SavingsEvent[];
  totalSavings: number;
  savingsInitialized: boolean;
  setSavingsEvents: (events: SavingsEvent[]) => void;
  setSavingsInitialized: (initialized: boolean) => void;
}

export const useSavingsStore = create<SavingsState>()((set) => ({
  savingsEvents: [],
  totalSavings: 0,
  savingsInitialized: false,
  setSavingsEvents: (events) => set({ 
    savingsEvents: events,
    totalSavings: events.reduce((acc, event) => acc + event.amount, 0)
  }),
  setSavingsInitialized: (initialized) => set({ savingsInitialized: initialized }),
}));
