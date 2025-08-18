
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Bookmark, Utensils, Lightbulb, ShoppingCart, History, ArrowRight, Archive } from 'lucide-react';
import { getSavedRecipes } from '@/lib/data';
import type { Recipe, User, PantryItem } from '@/types';
import { RecipeCard } from '@/components/pantry/RecipeCard';
import { useToast } from '@/hooks/use-toast';
import { unsaveRecipe } from '@/lib/data';
import { useAuth } from '@/hooks/use-auth';
import { usePantryLogStore } from '@/stores/pantry-store';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';


export default function SavedItemsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const { archivedItems, pantryInitialized } = usePantryLogStore();
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthLoading && pantryInitialized) {
      setIsLoading(false);
    }
  }, [isAuthLoading, pantryInitialized]);

  useEffect(() => {
    if (user) {
        loadSavedRecipes(user.uid);
    }
  }, [user]);


  const loadSavedRecipes = async (uid: string) => {
    try {
      const recipes = await getSavedRecipes(uid);
      setSavedRecipes(recipes);
    } catch (error) {
      console.error("Failed to load saved recipes", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not load your saved recipes.',
      });
    }
  };

  const handleToggleSave = async (recipe: Recipe) => {
    if (!user) return;
    try {
        await unsaveRecipe(user.uid, recipe.id);
        setSavedRecipes(prev => prev.filter(r => r.id !== recipe.id));
        toast({ title: 'Recipe Unsaved' });
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not update saved recipes.' });
    }
  };
  
  const usedItems = archivedItems.filter(i => i.status === 'used');

  if (isLoading) {
    return (
        <div className="flex justify-center items-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">🔖 My Saves</h1>
        <p className="text-muted-foreground text-sm">
          Your personal collection of recipes, insights, and tips.
        </p>
      </div>
      
       <div className="w-full space-y-4">
        {/* Saved Recipes Section */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">🍴 Saved Recipes ({savedRecipes.length})</CardTitle>
                <CardDescription className="text-sm">Recipes you've bookmarked to try.</CardDescription>
            </CardHeader>
            <CardContent>
                {savedRecipes.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {savedRecipes.map((recipe, index) => (
                            <RecipeCard 
                                key={recipe.id}
                                recipe={recipe} 
                                isSaved={true} // Always saved on this page
                                onToggleSave={handleToggleSave}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-10">
                        <p>You haven't saved any recipes yet.</p>
                        <p className="text-sm">Find recipe ideas in your Pantry.</p>
                    </div>
                )}
            </CardContent>
        </Card>
        
        {/* Used Food History */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">✅ Recently Used Items ({usedItems.length})</CardTitle>
                <CardDescription className="text-sm">A log of food you successfully used.</CardDescription>
            </CardHeader>
            <CardContent>
                {usedItems.length > 0 ? (
                    <div className="space-y-3">
                        {usedItems.map(item => (
                            <Card key={item.id}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Used on {item.usedDate ? format(parseISO(item.usedDate), 'MMMM d, yyyy') : 'N/A'}
                                        </p>
                                    </div>
                                    {item.estimatedCost && (
                                        <div className="text-right">
                                            <p className="font-semibold text-green-600">₱{item.estimatedCost.toFixed(2)}</p>
                                            <p className="text-xs text-muted-foreground">Value</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-10">
                        <p>You haven't marked any items as used yet.</p>
                        <p className="text-sm">Mark items as used from your Pantry to see them here.</p>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Placeholder for Shopping Tips */}
        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-lg text-muted-foreground">🛒 Shopping Tips I'm Trying</CardTitle>
                    <CardDescription className="text-sm">Shopping recommendations you are actively implementing.</CardDescription>
                </div>
                 <Button variant="outline" disabled>Coming Soon</Button>
            </CardHeader>
        </Card>
        
      </div>
    </div>
  );
}
