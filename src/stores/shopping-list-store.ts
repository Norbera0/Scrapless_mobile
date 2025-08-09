
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { GenerateShoppingListOutput } from '@/ai/schemas';

interface ShoppingListState {
  generatedList: GenerateShoppingListOutput | null;
  setGeneratedList: (list: GenerateShoppingListOutput | null) => void;
}

const isBrowser = typeof window !== 'undefined';

export const useShoppingListStore = create<ShoppingListState>()(
  persist(
    (set) => ({
      generatedList: null,
      setGeneratedList: (list) => set({ generatedList: list }),
    }),
    {
      name: 'scrapless-shopping-list-storage',
      storage: createJSONStorage(() => 
        isBrowser ? window.localStorage : undefined
      ),
      skipHydration: !isBrowser,
    }
  )
);
