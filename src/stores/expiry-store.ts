
import { create } from 'zustand';
import type { PantryItem } from '@/types';

interface ExpiryState {
  expiredItemsToShow: PantryItem[];
  setExpiredItemsToShow: (items: PantryItem[]) => void;
  clearExpiredItems: () => void;
}

export const useExpiryStore = create<ExpiryState>()((set) => ({
  expiredItemsToShow: [],
  setExpiredItemsToShow: (items) => set({ expiredItemsToShow: items }),
  clearExpiredItems: () => set({ expiredItemsToShow: [] }),
}));
