
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { GetItemInsightsOutput } from '@/ai/schemas';

interface ItemInsightState {
  insights: Record<string, GetItemInsightsOutput>;
  isGenerating: Record<string, boolean>;
  setInsight: (itemId: string, insight: GetItemInsightsOutput) => void;
  setIsGenerating: (itemId: string, status: boolean) => void;
  clearInsights: () => void;
}

const isBrowser = typeof window !== 'undefined';

export const useItemInsightStore = create<ItemInsightState>()(
  persist(
    (set) => ({
      insights: {},
      isGenerating: {},
      setInsight: (itemId, insight) => set((state) => ({
        insights: { ...state.insights, [itemId]: insight },
      })),
      setIsGenerating: (itemId, status) => set((state) => ({
        isGenerating: { ...state.isGenerating, [itemId]: status },
      })),
      clearInsights: () => set({ insights: {}, isGenerating: {} }),
    }),
    {
      name: 'scrapless-item-insight-storage',
      storage: createJSONStorage(() => 
        isBrowser ? window.sessionStorage : undefined // Use sessionStorage to persist for the session only
      ),
      skipHydration: !isBrowser,
    }
  )
);
