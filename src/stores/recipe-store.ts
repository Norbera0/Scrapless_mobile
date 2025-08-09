
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Recipe } from '@/types';

interface RecipeState {
  recipes: Recipe[];
  setRecipes: (recipes: Recipe[]) => void;
  clearRecipes: () => void;
}

// Helper function to check if running in a browser environment
const isBrowser = typeof window !== 'undefined';

export const useRecipeStore = create<RecipeState>()(
  persist(
    (set) => ({
      recipes: [],
      setRecipes: (recipes) => set({ recipes }),
      clearRecipes: () => set({ recipes: [] }),
    }),
    {
      name: 'scrapless-recipe-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => 
        // Use localStorage only in the browser
        isBrowser ? window.localStorage : undefined
      ),
      // Only run persistence logic in the browser
      skipHydration: !isBrowser, 
    }
  )
);
