
// Updated file: src/stores/bpiTrackPlanStore.ts
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
  syncCount: number; // Simulate "learning" over time (e.g., more details after 3 syncs)
  linkAccount: () => void;
  fetchMockData: () => void; // Simulate sync, evolving data
  unlinkAccount: () => void;
}

const isBrowser = typeof window !== 'undefined';


export const useBpiTrackPlanStore = create(
  persist<BpiTrackPlanState>(
    (set, get) => ({
      isLinked: false,
      trackPlanData: null,
      syncCount: 0,
      linkAccount: () => set({ isLinked: true }),
      fetchMockData: () => {
        const currentCount = get().syncCount + 1;
        set({ syncCount: currentCount });

        // Base mock data
        let mockData: TrackPlanData = {
          spendingCategories: [
            { category: 'Groceries', amount: 2500, trend: 'Up 10% from last month' },
            { category: 'Utilities', amount: 1500, trend: 'Stable' },
          ],
          cashFlowAlert: 'You have extra ₱500 cash flow – consider saving for green investments!',
          unusualTransactions: ['Unusual high spend on produce – potential overbuying'],
        };

        // Simulate "learning": Add more details after 3 syncs (per BPI FAQ)
        if (currentCount >= 3) {
          mockData = {
            ...mockData,
            cashFlowAlert: 'Your consistent saving has paid off! You have ₱1,200 in extra cash flow this month. Consider a BPI Green Saver Time Deposit.',
            unusualTransactions: [...mockData.unusualTransactions, 'Your Friday grocery spending pattern is consistent. Planning meals for the weekend could reduce this cost.'],
          };
        }

        set({ trackPlanData: mockData });
      },
      unlinkAccount: () => set({ isLinked: false, trackPlanData: null, syncCount: 0 }),
    }),
    { 
        name: 'bpi-track-plan-storage',
        storage: createJSONStorage(() => 
            isBrowser ? window.localStorage : undefined
        ),
        skipHydration: !isBrowser, 
    }
  )
);
