
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AnalyzeWastePatternsOutput } from '@/ai/schemas';

interface WasteInsightState {
  insight: AnalyzeWastePatternsOutput | null;
  setInsight: (insight: AnalyzeWastePatternsOutput | null) => void;
}

const isBrowser = typeof window !== 'undefined';

export const useWasteInsightStore = create<WasteInsightState>()(
  persist(
    (set) => ({
      insight: null,
      setInsight: (insight) => set({ insight }),
    }),
    {
      name: 'scrapless-waste-insight-storage',
      storage: createJSONStorage(() => 
        isBrowser ? window.localStorage : undefined
      ),
      skipHydration: !isBrowser,
    }
  )
);
