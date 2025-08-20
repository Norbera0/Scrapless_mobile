
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Recipe } from '@/types';

interface RecipeState {
  recipes: Recipe[];
  setRecipes: (recipes: Recipe[]) => void;
  clearRecipes: () => void;
}

const isBrowser = typeof window !== 'undefined';

export const useRecipeStore = create<RecipeState>()(
  persist(
    (set) => ({
      recipes: [],
      setRecipes: (recipes) => set({ recipes }),
      clearRecipes: () => set({ recipes: [] }),
    }),
    {
      name: 'scrapless-recipe-storage', // The key used in localStorage
      storage: createJSONStorage(() => 
        isBrowser ? window.localStorage : undefined
      ),
      skipHydration: !isBrowser,
    }
  )
);
