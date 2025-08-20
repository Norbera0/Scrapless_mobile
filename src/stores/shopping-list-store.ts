
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { GenerateShoppingListOutput } from '@/ai/schemas';

interface ShoppingListState {
  generatedList: GenerateShoppingListOutput | null;
  setGeneratedList: (list: GenerateShoppingListOutput | null) => void;
  toggleItemChecked: (itemId: string) => void;
}

const isBrowser = typeof window !== 'undefined';

export const useShoppingListStore = create<ShoppingListState>()(
  persist(
    (set, get) => ({
      generatedList: null,
      setGeneratedList: (list) => set({ generatedList: list }),
      toggleItemChecked: (itemId: string) => {
        const currentList = get().generatedList;
        if (!currentList) return;

        const updatedItems = currentList.items.map(item => {
          if (item.id === itemId) {
            const isChecked = !item.isChecked;
            // Also mark as purchased if it's being checked off
            return { ...item, isChecked: isChecked, isPurchased: isChecked };
          }
          return item;
        });
        
        set({ generatedList: { ...currentList, items: updatedItems }});
      }
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
