import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Recipe } from '@/types';

interface RecipeState {
  recipes: Recipe[];
  setRecipes: (recipes: Recipe[]) => void;
  updateRecipe: (recipeId: string, updates: Partial<Recipe>) => void;
  clearRecipes: () => void;
}

const isBrowser = typeof window !== 'undefined';

export const useRecipeStore = create<RecipeState>()(
  persist(
    (set) => ({
      recipes: [],
      setRecipes: (recipes) => set({ recipes }),
      updateRecipe: (recipeId, updates) =>
        set((state) => ({
          recipes: state.recipes.map((recipe) =>
            recipe.id === recipeId ? { ...recipe, ...updates } : recipe
          ),
        })),
      clearRecipes: () => set({ recipes: [] }),
    }),
    {
      name: 'scrapless-recipe-storage',
      storage: createJSONStorage(() => 
        isBrowser ? window.localStorage : undefined
      ),
      skipHydration: !isBrowser,
    }
  )
);
