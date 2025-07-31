
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Bookmark, Utensils, Lightbulb, ShoppingCart, History } from 'lucide-react';
import { getSavedRecipes } from '@/lib/data';
import { auth } from '@/lib/firebase';
import type { Recipe, User } from '@/types';
import { RecipeCard } from '@/components/pantry/RecipeCard';
import { useToast } from '@/hooks/use-toast';
import { unsaveRecipe } from '@/lib/data';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';


export default function SavedItemsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        loadSavedRecipes(fbUser.uid);
      } else {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadSavedRecipes = async (uid: string) => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
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

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Bookmark className="h-8 w-8"/> My Saves</h1>
        <p className="text-muted-foreground">
          Your personal collection of recipes, insights, and tips.
        </p>
      </div>
      
       <Accordion type="multiple" defaultValue={['recipes']} className="w-full space-y-4">
        {/* Saved Recipes Section */}
        <AccordionItem value="recipes" className="border-none">
          <Card>
             <AccordionTrigger className="p-6 border-b hover:no-underline">
                <CardHeader className="p-0 text-left">
                  <CardTitle className="flex items-center gap-2"><Utensils /> Saved Recipes ({savedRecipes.length})</CardTitle>
                  <CardDescription>Recipes you've bookmarked to try.</CardDescription>
                </CardHeader>
              </AccordionTrigger>
              <AccordionContent>
                <CardContent className="pt-6">
                    {isLoading ? (
                        <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : savedRecipes.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                            {savedRecipes.map((recipe, index) => (
                                <AccordionItem value={`item-${index}`} key={recipe.id}>
                                    <AccordionTrigger className='font-semibold'>{recipe.name}</AccordionTrigger>
                                    <AccordionContent>
                                        <RecipeCard 
                                            recipe={recipe} 
                                            isSaved={true} // Always saved on this page
                                            onToggleSave={handleToggleSave}
                                        />
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <div className="text-center text-muted-foreground py-10">
                            <p>You haven't saved any recipes yet.</p>
                            <p className="text-sm">Find recipe ideas in your Pantry.</p>
                        </div>
                    )}
                </CardContent>
              </AccordionContent>
          </Card>
        </AccordionItem>
        
        {/* Placeholder for Solutions */}
         <AccordionItem value="solutions" className="border-none">
             <Card>
                <AccordionTrigger className="p-6 border-b hover:no-underline" disabled>
                  <CardHeader className="p-0 text-left">
                    <CardTitle className="flex items-center gap-2 text-muted-foreground"><Lightbulb /> Solutions I'm Trying (0)</CardTitle>
                    <CardDescription>Solutions you've committed to from your insights.</CardDescription>
                  </CardHeader>
                </AccordionTrigger>
             </Card>
        </AccordionItem>

        {/* Placeholder for Shopping Tips */}
        <AccordionItem value="shopping-tips" className="border-none">
             <Card>
                <AccordionTrigger className="p-6 border-b hover:no-underline" disabled>
                  <CardHeader className="p-0 text-left">
                    <CardTitle className="flex items-center gap-2 text-muted-foreground"><ShoppingCart /> Shopping Tips I'm Trying (0)</CardTitle>
                    <CardDescription>Shopping recommendations you are actively implementing.</CardDescription>
                  </CardHeader>
                </AccordionTrigger>
             </Card>
        </AccordionItem>
        
        {/* Placeholder for Insights History */}
        <AccordionItem value="insights-history" className="border-none">
             <Card>
                <AccordionTrigger className="p-6 border-b hover:no-underline" disabled>
                  <CardHeader className="p-0 text-left">
                    <CardTitle className="flex items-center gap-2 text-muted-foreground"><History /> My Insights History (0)</CardTitle>
                    <CardDescription>Your log of all past AI-powered insights.</CardDescription>
                  </CardHeader>
                </AccordionTrigger>
             </Card>
        </AccordionItem>

      </Accordion>
    </div>
  );
}
