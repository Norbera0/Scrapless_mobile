
// New file: src/stores/bpiTrackPlanStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface TrackPlanData {
  spendingCategories: { category: string; amount: number; trend: string }[]; // e.g., { category: 'Groceries', amount: 2000, trend: 'Up 15%' }
  cashFlowAlert: string; // e.g., 'Extra ₱400 this week – save it!'
  unusualTransactions: string[]; // e.g., ['High veggie spend on Fridays']
}

interface BpiTrackPlanState {
  isLinked: boolean;
  trackPlanData: TrackPlanData | null;
  linkAccount: () => void; // Mock linking
  fetchMockData: () => void; // Simulate API pull
  unlinkAccount: () => void;
}

const isBrowser = typeof window !== 'undefined';

export const useBpiTrackPlanStore = create(
  persist<BpiTrackPlanState>(
    (set) => ({
      isLinked: false,
      trackPlanData: null,
      linkAccount: () => set({ isLinked: true }), // Simulate consent and linking
      fetchMockData: () => {
        // Hardcoded mock data (simulate BPI response)
        const mockData: TrackPlanData = {
          spendingCategories: [
            { category: 'Groceries', amount: 2500, trend: 'Up 10% from last month' },
            { category: 'Utilities', amount: 1500, trend: 'Stable' },
          ],
          cashFlowAlert: 'You have extra ₱500 cash flow – consider saving for green investments!',
          unusualTransactions: ['Unusual high spend on produce – potential overbuying'],
        };
        set({ trackPlanData: mockData });
      },
      unlinkAccount: () => set({ isLinked: false, trackPlanData: null }),
    }),
    { 
        name: 'bpi-track-plan-storage', // Persist in localStorage
        storage: createJSONStorage(() => 
            isBrowser ? window.localStorage : undefined
        ),
        skipHydration: !isBrowser, 
    }
  )
);
