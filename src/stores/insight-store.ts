
import { create } from 'zustand';
import type { Insight } from '@/types';

interface InsightState {
  insights: Insight[];
  insightsInitialized: boolean;
  setInsights: (insights: Insight[]) => void;
  addInsight: (insight: Insight) => void;
  setInsightStatus: (insightId: string, status: Insight['status']) => void;
  setInsightsInitialized: (initialized: boolean) => void;
}

export const useInsightStore = create<InsightState>()((set) => ({
  insights: [],
  insightsInitialized: false,
  setInsights: (insights) => set({ insights }),
  addInsight: (insight) => set(state => ({
    insights: [insight, ...state.insights]
  })),
  setInsightStatus: (insightId, status) => set(state => ({
    insights: state.insights.map(i => i.id === insightId ? { ...i, status } : i)
  })),
  setInsightsInitialized: (initialized) => set({ insightsInitialized: initialized }),
}));

    