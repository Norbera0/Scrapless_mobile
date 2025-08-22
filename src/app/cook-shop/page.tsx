
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePantryLogStore } from '@/stores/pantry-store';
import { useRecipeStore } from '@/stores/recipe-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { 
  Package, 
  ShoppingCart,
  ChefHat,
  Loader2,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Info,
  Share2,
  Plus,
  Trash2,
  PackagePlus,
  BarChart,
  Leaf,
  CookingPot,
  Zap,
  Landmark
} from 'lucide-react';
import type { PantryItem, Recipe, WasteLog } from '@/types';
import { getSavedRecipes, saveRecipe, unsaveRecipe } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { getRecipeSuggestions } from '@/app/actions';
import { RecipeCard } from '@/components/pantry/RecipeCard';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { differenceInDays, startOfToday, format, parseISO, isSameDay, addDays, subDays, isAfter, startOfDay } from 'date-fns';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { generateShoppingList } from '@/ai/flows/generate-shopping-list';
import { useShoppingListStore } from '@/stores/shopping-list-store';
import type { GenerateShoppingListOutput } from '@/ai/schemas';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import { useSavingsStore } from '@/stores/savings-store';
import { Switch } from '@/components/ui/switch';

const DealCard = ({ deal }: { deal: NonNullable<GenerateShoppingListOutput['items'][0]['deal']> }) => {
    
    const getIcon = () => {
        switch(deal.icon) {
            case 'bpi': return '/bpi-logo-2.png';
            case 'vybe': return '/vybe-logo-2 copy.png';
            case 'green_partner': return null; // Use Lucide icon
            default: return null;
        }
    }
    
    const dealIcon = getIcon();

    return (
        <div className="mt-2 p-3 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-start gap-3">
                 {deal.icon === 'green_partner' ? (
                    <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                         <Leaf className="w-4 h-4 text-white" />
                    </div>
                ) : dealIcon && (
                    <Image src={dealIcon} alt={`${deal.icon} logo`} width={24} height={24} className="rounded-md" />
                )}
                <div className="flex-1">
                    <p className="font-bold text-sm text-green-800">{deal.title}</p>
                    <p className="text-sm text-gray-700">
                        <span className="font-semibold">{deal.description}</span> at {deal.merchant}.
                    </p>
                    {deal.terms && <p className="text-xs text-gray-500 mt-0.5">{deal.terms}</p>}
                    <p className="text-xs font-semibold text-green-700 bg-green-200 px-2 py-0.5 rounded-full inline-block mt-1">
                        Value: {deal.estimatedSavings}
                    </p>
                </div>
            </div>
        </div>
    );
};


export default function CookAndShopPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { liveItems, pantryInitialized } = usePantryLogStore();
  const { logs: wasteLogs } = useWasteLogStore();
  const { generatedList, setGeneratedList, toggleItemChecked } = useShoppingListStore();
  const { savingsEvents } = useSavingsStore();

  // Recipe State
  const { recipes, setRecipes, clearRecipes } = useRecipeStore();
  const [savedRecipeIds, setSavedRecipeIds] = useState<Set<string>>(new Set());
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  
  // Shopping List State
  const [isLoadingShoppingList, setIsLoadingShoppingList] = useState(false);
  const [isAutoBuyEnabled, setIsAutoBuyEnabled] = useState(true);

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    useShoppingListStore.persist.rehydrate();
    useRecipeStore.persist.rehydrate();
  }, []);

  // --- Recipe Logic ---
  const fetchRecipes = useCallback(async (isNewRequest: boolean) => {
    if (liveItems.length === 0) {
      setRecipes([]);
      return;
    }
    if (isNewRequest) {
        clearRecipes();
    }

    setIsLoadingRecipes(true);
    try {
      const pantryItemData = liveItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
      }));

      const result = await getRecipeSuggestions({
        pantryItems: pantryItemData,
        preferences: { filipinoDishes: true },
      });
      const recipesWithIds = result.recipes.map(r => ({ ...r, id: r.id || crypto.randomUUID() }));
      setRecipes(recipesWithIds);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Could not get recipes',
        description: 'An error occurred while generating recipe ideas. Please try again.',
      });
    } finally {
      setIsLoadingRecipes(false);
    }
  }, [liveItems, toast, setRecipes, clearRecipes]);

  useEffect(() => {
    if (pantryInitialized && isClient && recipes.length === 0 && liveItems.length > 0) {
        fetchRecipes(false);
    }
  }, [pantryInitialized, liveItems.length, fetchRecipes, isClient, recipes.length]);

  useEffect(() => {
    const loadSaved = async () => {
      if (user) {
        const saved = await getSavedRecipes(user.uid);
        setSavedRecipeIds(new Set(saved.map(r => r.id)));
      }
    };
    loadSaved();
  }, [user]);
  
  const handleToggleSave = async (recipe: Recipe) => {
    if (!user) return;
    
    try {
      const isCurrentlySaved = savedRecipeIds.has(recipe.id);
      if (isCurrentlySaved) {
        await unsaveRecipe(user.uid, recipe.id);
        setSavedRecipeIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(recipe.id);
          return newSet;
        });
        toast({ title: 'Recipe unsaved' });
      } else {
        await saveRecipe(user.uid, recipe);
        setSavedRecipeIds(prev => new Set(prev).add(recipe.id));
        toast({ title: 'Recipe saved!' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error saving recipe' });
    }
  };

  // --- Shopping List Logic ---
  const handleGenerateList = async () => {
    setIsLoadingShoppingList(true);
    try {
        const pantryData = liveItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            estimatedExpirationDate: item.estimatedExpirationDate,
        }));

        const result = await generateShoppingList({
            pantryItems: pantryData,
            wasteLogs: wasteLogs,
        });

        setGeneratedList(result);

      toast({
        title: 'Smart suggestions ready!',
        description: 'Your personalized shopping list has been created.',
      });
    } catch(err) {
        toast({
            variant: 'destructive',
            title: 'Generation Failed',
            description: 'Could not generate a shopping list at this time.'
        });
    } finally {
        setIsLoadingShoppingList(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
        case 'staple': return <Leaf className="h-4 w-4 text-green-600" />;
        case 'data_driven': return <BarChart className="h-4 w-4 text-blue-600" />;
        case 'low_stock': return <ShoppingCart className="h-4 w-4 text-yellow-600" />;
        case 'complementary': return <PackagePlus className="h-4 w-4 text-purple-600" />;
        default: return <Sparkles className="h-4 w-4 text-gray-600" />;
    }
  }

  // --- Combined Logic & Memoized Values ---
  const recipesCooked = useMemo(() => {
      return savingsEvents.filter(e => e.type === 'recipe_followed').length;
  }, [savingsEvents]);

  const itemsBought = useMemo(() => {
    return generatedList?.items.filter(item => item.isPurchased).length || 0;
  }, [generatedList]);

  if (!isClient) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <ChefHat className="w-8 h-8 text-primary" />
          Cook & Shop
        </h1>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Card className="flex items-center p-4 gap-3">
          <div className="p-2 bg-amber-100 rounded-lg"><CookingPot className="w-5 h-5 text-amber-600" /></div>
          <div>
            <p className="text-lg font-bold">{recipesCooked}</p>
            <p className="text-xs text-muted-foreground">Recipes Cooked</p>
          </div>
        </Card>
        <Card className="flex items-center p-4 gap-3">
          <div className="p-2 bg-blue-100 rounded-lg"><ShoppingCart className="w-5 h-5 text-blue-600" /></div>
          <div>
            <p className="text-lg font-bold">{itemsBought}</p>
            <p className="text-xs text-muted-foreground">Items Bought</p>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2"><ChefHat /> Recipe Suggestions</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => fetchRecipes(true)} disabled={isLoadingRecipes}>
              {isLoadingRecipes ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </Button>
          </div>
          <CardDescription className="flex items-center gap-2 text-amber-600"><AlertTriangle className="w-4 h-4" /> Using items expiring soon</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingRecipes ? (
            <div className="text-center p-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
          ) : recipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recipes.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} isSaved={savedRecipeIds.has(recipe.id)} onToggleSave={handleToggleSave} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No recipes could be generated with your current pantry.</div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-4 text-muted-foreground">
        <Separator className="flex-1" />
        <span className="font-semibold">OR</span>
        <Separator className="flex-1" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2"><ShoppingCart /> Smart Shopping List</CardTitle>
            {generatedList && (
                <Button variant="ghost" size="sm"><Share2 className="w-4 h-4 mr-2" /> Export List</Button>
            )}
          </div>
           <CardDescription className="flex items-center gap-2"><Info className="w-4 h-4" /> Based on your pantry & waste patterns</CardDescription>
        </CardHeader>
        <CardContent>
            {!generatedList ? (
                 <Button className="w-full" onClick={handleGenerateList} disabled={isLoadingShoppingList}>
                    {isLoadingShoppingList ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Generate Smart Shopping List
                </Button>
            ) : (
                <div className="space-y-4">
                    {generatedList.items.map(item => (
                        <div key={item.id} className={cn("flex flex-col gap-2 p-3 rounded-lg transition-colors", item.isChecked && "bg-green-50/50")}>
                            <div className="flex items-start gap-3">
                                <Checkbox 
                                    id={`item-${item.id}`}
                                    checked={item.isChecked}
                                    onCheckedChange={() => toggleItemChecked(item.id)}
                                    className="mt-1 h-5 w-5"
                                />
                                <Label htmlFor={`item-${item.id}`} className="flex-1 grid gap-1 cursor-pointer">
                                    <p className={cn("font-semibold leading-tight", item.isChecked && "line-through text-muted-foreground")}>{item.name} <span className="text-muted-foreground font-normal">({item.quantity})</span></p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        {getCategoryIcon(item.category)}
                                        {item.reasoning}
                                    </p>
                                </Label>
                                <div className="text-right">
                                    <p className={cn("font-semibold", item.isChecked && "line-through text-muted-foreground")}>₱{item.estimatedCost.toFixed(2)}</p>
                                    <p className="text-xs capitalize text-muted-foreground">{item.priority}</p>
                                </div>
                            </div>
                            {item.deal && <DealCard deal={item.deal} />}
                        </div>
                    ))}
                    <Button variant="outline" className="w-full border-dashed"><Plus className="w-4 h-4 mr-2" /> Add Custom Item</Button>
                </div>
            )}
        </CardContent>
        {generatedList && (
            <CardFooter className="flex-col items-stretch gap-4 pt-4 border-t">
                 <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" onClick={() => handleGenerateList()} disabled={isLoadingShoppingList}>
                        {isLoadingShoppingList ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Regenerate
                    </Button>
                    <Button variant="destructive" onClick={() => setGeneratedList(null)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear List
                    </Button>
                </div>
            </CardFooter>
        )}
      </Card>
      
      {generatedList && (
        <Card className="bg-gradient-to-br from-primary to-green-700 text-primary-foreground">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Zap /> One-Tap Restock</CardTitle>
                <CardDescription className="text-green-200">Automatically purchase your list via our partners.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <Button className="w-full bg-white text-primary hover:bg-white/90">
                    <Image src="/grabmart-logo.png" alt="GrabMart" width={20} height={20} className="mr-2" />
                     Auto-Buy with GrabMart
                 </Button>
                 <div className="flex items-center justify-between text-sm text-green-100">
                    <Label htmlFor="auto-buy-toggle" className="font-semibold">Enable Auto-Buy</Label>
                    <Switch 
                        id="auto-buy-toggle" 
                        checked={isAutoBuyEnabled}
                        onCheckedChange={setIsAutoBuyEnabled}
                        className="data-[state=checked]:bg-green-400"
                    />
                 </div>
                 {isAutoBuyEnabled && (
                    <p className="text-xs text-center text-green-200 bg-black/20 p-2 rounded-md">
                        Next delivery: Saturday, ~₱{generatedList.totalEstimatedCost.toFixed(2)} total, paid via BPI.
                    </p>
                 )}
            </CardContent>
        </Card>
      )}

    </div>
  );
}
