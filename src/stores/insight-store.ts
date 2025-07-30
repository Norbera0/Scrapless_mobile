
import { create } from 'zustand';
import type { Insight } from '@/types';

interface InsightState {
  insights: Insight[];
  insightsInitialized: boolean;
  setInsights: (insights: Insight[]) => void;
  setInsightsInitialized: (initialized: boolean) => void;
}

export const useInsightStore = create<InsightState>()((set) => ({
  insights: [],
  insightsInitialized: false,
  setInsights: (insights) => set({ insights }),
  setInsightsInitialized: (initialized) => set({ insightsInitialized: initialized }),
}));
