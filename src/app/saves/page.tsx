
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Bookmark, Utensils, Lightbulb, ShoppingCart, History, ArrowRight, Archive } from 'lucide-react';
import { getSavedRecipes } from '@/lib/data';
import type { Recipe, User, Insight, PantryItem } from '@/types';
import { RecipeCard } from '@/components/pantry/RecipeCard';
import { useToast } from '@/hooks/use-toast';
import { unsaveRecipe } from '@/lib/data';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { useAuth } from '@/hooks/use-auth';
import { useInsightStore } from '@/stores/insight-store';
import { usePantryLogStore } from '@/stores/pantry-store';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';


export default function SavedItemsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const { insights, insightsInitialized } = useInsightStore();
  const { archivedItems, pantryInitialized } = usePantryLogStore();
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthLoading && insightsInitialized && pantryInitialized) {
      setIsLoading(false);
    }
  }, [isAuthLoading, insightsInitialized, pantryInitialized]);

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
  
  const solutionsImTrying = insights.filter(i => i.status === 'acted_on');
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
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2"><Bookmark className="h-8 w-8"/> My Saves</h1>
        <p className="text-muted-foreground">
          Your personal collection of recipes, insights, and tips.
        </p>
      </div>
      
       <Accordion type="multiple" defaultValue={['recipes', 'used-items']} className="w-full space-y-4">
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
                    {savedRecipes.length > 0 ? (
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
        
        {/* Solutions I'm Trying */}
         <AccordionItem value="solutions" className="border-none">
             <Card>
                <AccordionTrigger className="p-6 border-b hover:no-underline">
                  <CardHeader className="p-0 text-left">
                    <CardTitle className="flex items-center gap-2"><Lightbulb /> Solutions I'm Trying ({solutionsImTrying.length})</CardTitle>
                    <CardDescription>Solutions you've committed to from your insights.</CardDescription>
                  </CardHeader>
                </AccordionTrigger>
                <AccordionContent>
                    <CardContent className="pt-6">
                        {solutionsImTrying.length > 0 ? (
                           <div className="space-y-3">
                                {solutionsImTrying.map(insight => (
                                    <Card 
                                        key={insight.id} 
                                        className="hover:bg-muted/50 transition-colors"
                                    >
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold">{insight.patternAlert}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Committed on {format(new Date(insight.date), 'MMMM d, yyyy')}
                                                </p>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => router.push(`/insights/${insight.id}`)}>
                                                View Details <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                           </div>
                        ) : (
                             <div className="text-center text-muted-foreground py-10">
                                <p>You aren't actively trying any solutions.</p>
                                <p className="text-sm">Visit the Insights page to commit to a new solution.</p>
                            </div>
                        )}
                    </CardContent>
                </AccordionContent>
             </Card>
        </AccordionItem>
        
        {/* Used Food History */}
        <AccordionItem value="used-items" className="border-none">
          <Card>
              <AccordionTrigger className="p-6 border-b hover:no-underline">
              <CardHeader className="p-0 text-left">
                  <CardTitle className="flex items-center gap-2"><Archive /> Recently Used Items ({usedItems.length})</CardTitle>
                  <CardDescription>A log of food you successfully used.</CardDescription>
              </CardHeader>
              </AccordionTrigger>
              <AccordionContent>
                  <CardContent className="pt-6">
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
              </AccordionContent>
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
                <AccordionTrigger className="p-6 border-b hover:no-underline" onClick={() => router.push('/insights/history')}>
                  <CardHeader className="p-0 text-left">
                    <CardTitle className="flex items-center gap-2"><History /> My Full Insights History</CardTitle>
                    <CardDescription>Review your log of all past AI-powered insights.</CardDescription>
                  </CardHeader>
                </AccordionTrigger>
             </Card>
        </AccordionItem>

      </Accordion>
    </div>
  );
}
