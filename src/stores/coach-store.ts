
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { KitchenCoachOutput, GetCoachSolutionsOutput } from '@/ai/schemas';

interface CoachState {
  analysis: KitchenCoachOutput | null;
  solutions: GetCoachSolutionsOutput | null;
  isGenerating: boolean;
  lastGenerated: string | null;
  hasUnseenAnalysis: boolean;
  setAnalysis: (analysis: KitchenCoachOutput | null) => void;
  setSolutions: (solutions: GetCoachSolutionsOutput | null) => void;
  setIsGenerating: (generating: boolean) => void;
  markAnalysisAsSeen: () => void;
}

const isBrowser = typeof window !== 'undefined';

export const useCoachStore = create<CoachState>()(
  persist(
    (set) => ({
      analysis: null,
      solutions: null,
      isGenerating: false,
      lastGenerated: null,
      hasUnseenAnalysis: false,
      setAnalysis: (analysis) => set({ 
        analysis: analysis, 
        lastGenerated: new Date().toISOString(),
        hasUnseenAnalysis: !!analysis, // Set to true if there's a new analysis
      }),
      setSolutions: (solutions) => set({ solutions }),
      setIsGenerating: (generating) => set({ isGenerating: generating }),
      markAnalysisAsSeen: () => set({ hasUnseenAnalysis: false }),
    }),
    {
      name: 'scrapless-coach-storage',
      storage: createJSONStorage(() => (isBrowser ? localStorage : undefined)),
      skipHydration: !isBrowser,
    }
  )
);
