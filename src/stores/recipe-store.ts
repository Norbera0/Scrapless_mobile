import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Recipe } from '@/types';

interface RecipeState {
  recipes: Recipe[];
  plannedRecipes: Recipe[];
  setRecipes: (recipes: Recipe[]) => void;
  setPlannedRecipes: (recipes: Recipe[]) => void;
  addPlannedRecipe: (recipe: Recipe) => void;
  updatePlannedRecipe: (recipeId: string, updates: Partial<Recipe>) => void;
  removePlannedRecipe: (recipeId: string) => void;
  updateRecipe: (recipeId: string, updates: Partial<Recipe>) => void;
  clearRecipes: () => void;
}

const isBrowser = typeof window !== 'undefined';

export const useRecipeStore = create<RecipeState>()(
  persist(
    (set) => ({
      recipes: [],
      plannedRecipes: [],
      setRecipes: (recipes) => set({ recipes }),
      setPlannedRecipes: (recipes) => set({ plannedRecipes: recipes }),
      addPlannedRecipe: (recipe) =>
        set((state) => ({
          plannedRecipes: [...state.plannedRecipes, recipe].sort(
            (a, b) => new Date(a.scheduledDate || 0).getTime() - new Date(b.scheduledDate || 0).getTime()
          ),
        })),
      updatePlannedRecipe: (recipeId, updates) =>
        set((state) => ({
          plannedRecipes: state.plannedRecipes.map((recipe) =>
            recipe.id === recipeId ? { ...recipe, ...updates } : recipe
          ),
        })),
      removePlannedRecipe: (recipeId) =>
        set((state) => ({
          plannedRecipes: state.plannedRecipes.filter(
            (recipe) => recipe.id !== recipeId
          ),
        })),
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
