
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { KitchenCoachOutput } from '@/ai/schemas';
import { differenceInHours } from 'date-fns';

interface CoachState {
  lastTip: KitchenCoachOutput | null;
  lastGenerated: string | null; // ISO string
  isGenerating: boolean;
  setLastTip: (tip: KitchenCoachOutput, date: Date) => void;
  setIsGenerating: (generating: boolean) => void;
  isEligibleForRefresh: () => boolean;
}

const REFRESH_INTERVAL_HOURS = 6;
const isBrowser = typeof window !== 'undefined';

export const useCoachStore = create<CoachState>()(
  persist(
    (set, get) => ({
      lastTip: null,
      lastGenerated: null,
      isGenerating: false,
      setLastTip: (tip, date) => set({ lastTip: tip, lastGenerated: date.toISOString() }),
      setIsGenerating: (generating) => set({ isGenerating: generating }),
      isEligibleForRefresh: () => {
        const { lastGenerated } = get();
        if (!lastGenerated) {
          return true; // No tip ever generated
        }
        const hoursSinceLast = differenceInHours(new Date(), new Date(lastGenerated));
        return hoursSinceLast >= REFRESH_INTERVAL_HOURS;
      },
    }),
    {
      name: 'scrapless-coach-storage',
      storage: createJSONStorage(() => (isBrowser ? localStorage : undefined)),
      skipHydration: !isBrowser,
    }
  )
);
