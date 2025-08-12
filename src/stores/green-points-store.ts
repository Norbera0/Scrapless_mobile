
import { create } from 'zustand';
import type { GreenPointsEvent } from '@/types';

interface GreenPointsState {
  events: GreenPointsEvent[];
  pointsInitialized: boolean;
  setEvents: (events: GreenPointsEvent[]) => void;
  setPointsInitialized: (initialized: boolean) => void;
}

export const useGreenPointsStore = create<GreenPointsState>()((set) => ({
  events: [],
  pointsInitialized: false,
  setEvents: (events) => set({ events }),
  setPointsInitialized: (initialized) => set({ pointsInitialized: initialized }),
}));
