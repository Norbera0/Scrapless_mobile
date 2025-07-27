
'use client';

import { useState, useEffect, useCallback } from 'react';
import { suggestRecipes } from '@/ai/flows/suggest-recipes';
import { type PantryItem, type Recipe, type User } from '@/types';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';
import { RecipeCard } from './RecipeCard';
import { getSavedRecipes, saveRecipe, unsaveRecipe } from '@/lib/data';
import { onAuthStateChanged } from 'firebase/auth';

interface RecipeSuggestionsProps {
  pantryItems: PantryItem[];
}

export function RecipeSuggestions({ pantryItems }: RecipeSuggestionsProps) {
  const [user, setUser] = useState<User | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [savedRecipeIds, setSavedRecipeIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ quickMeals: false, filipinoDishes: false });
  const { toast } = useToast();
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        setUser(fbUser);
    });
    return () => unsubscribe();
  }, []);

  const fetchRecipes = useCallback(async (currentRecipes: Recipe[]) => {
    setIsLoading(true);
    try {
      const pantryItemNames = pantryItems.map((item) => item.name);
      const result = await suggestRecipes({
        pantryItems: pantryItemNames,
        preferences: filters,
        history: currentRecipes.map(r => r.name),
      });
      const recipesWithIds = result.recipes.map(r => ({...r, id: crypto.randomUUID()}));
      setRecipes(recipesWithIds);
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
      toast({
        variant: 'destructive',
        title: 'Could not get recipes',
        description: 'An error occurred while generating recipe ideas. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [pantryItems, filters, toast]);
  
  useEffect(() => {
    if (pantryItems.length > 0) {
      fetchRecipes([]); // Initial fetch with no history
    } else {
        setIsLoading(false);
        setRecipes([]);
    }
  }, [pantryItems, filters, fetchRecipes]);

  useEffect(() => {
    // Load saved recipes
    const loadSaved = async () => {
        if(user) {
            const saved = await getSavedRecipes(user.uid);
            setSavedRecipeIds(new Set(saved.map(r => r.id)));
        }
    }
    loadSaved();
  }, [user]);

  const handleToggleFilter = (filter: 'quickMeals' | 'filipinoDishes') => {
    setFilters(prev => ({...prev, [filter]: !prev[filter]}));
  }
  
  const handleToggleSave = async (recipe: Recipe) => {
    if (!user) return;
    const isSaved = savedRecipeIds.has(recipe.id);
    try {
        if (isSaved) {
            await unsaveRecipe(user.uid, recipe.id);
            setSavedRecipeIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(recipe.id);
                return newSet;
            });
            toast({ title: 'Recipe Unsaved' });
        } else {
            await saveRecipe(user.uid, recipe);
            setSavedRecipeIds(prev => new Set(prev).add(recipe.id));
            toast({ title: 'Recipe Saved!' });
        }
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not update saved recipes.' });
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>🍳 Recipe Ideas</CardTitle>
        <CardDescription>AI-powered suggestions based on your pantry items.</CardDescription>
        <div className="flex gap-2 pt-2">
            <Button size="sm" variant={filters.quickMeals ? 'default' : 'outline'} onClick={() => handleToggleFilter('quickMeals')}>
                ⚡ Quick Meals
            </Button>
            <Button size="sm" variant={filters.filipinoDishes ? 'default' : 'outline'} onClick={() => handleToggleFilter('filipinoDishes')}>
                🇵🇭 Filipino
            </Button>
            <Button size="sm" variant="outline" onClick={() => fetchRecipes(recipes)} disabled={isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                More Recipes
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : recipes.length > 0 ? (
          <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
             {recipes.map((recipe, index) => (
                <AccordionItem value={`item-${index}`} key={recipe.id}>
                    <AccordionTrigger className='font-semibold'>{recipe.name}</AccordionTrigger>
                    <AccordionContent>
                        <RecipeCard 
                            recipe={recipe} 
                            isSaved={savedRecipeIds.has(recipe.id)}
                            onToggleSave={handleToggleSave}
                        />
                    </AccordionContent>
                </AccordionItem>
             ))}
          </Accordion>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No recipe suggestions available. Try adding more items to your pantry!
          </p>
        )}
      </CardContent>
    </Card>
  );
}
