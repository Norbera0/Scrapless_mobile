
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { KitchenCoachOutput, GetCoachSolutionsOutput } from '@/ai/schemas';

interface CoachState {
  analysis: KitchenCoachOutput | null;
  solutions: GetCoachSolutionsOutput | null;
  isGenerating: boolean;
  setAnalysis: (analysis: KitchenCoachOutput | null) => void;
  setSolutions: (solutions: GetCoachSolutionsOutput | null) => void;
  setIsGenerating: (generating: boolean) => void;
}

const isBrowser = typeof window !== 'undefined';

export const useCoachStore = create<CoachState>()(
  persist(
    (set) => ({
      analysis: null,
      solutions: null,
      isGenerating: false,
      setAnalysis: (analysis) => set({ analysis }),
      setSolutions: (solutions) => set({ solutions }),
      setIsGenerating: (generating) => set({ isGenerating: generating }),
    }),
    {
      name: 'scrapless-coach-storage',
      storage: createJSONStorage(() => (isBrowser ? localStorage : undefined)),
      skipHydration: !isBrowser,
    }
  )
);
