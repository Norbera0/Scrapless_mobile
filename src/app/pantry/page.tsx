
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePantryLogStore } from '@/stores/pantry-store';
import { useRecipeStore } from '@/stores/recipe-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Search, 
  RefreshCw, 
  BookOpen, 
  Package, 
  Clock, 
  TrendingUp,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ListFilter,
  PackageCheck,
  Soup,
  Leaf,
  Camera,
  Mic,
  Type
} from 'lucide-react';
import type { PantryItem, Recipe, ItemInsights } from '@/types';
import { PantryItemCard } from '@/components/pantry/PantryItemCard';
import { PantryItemDetails } from '@/components/pantry/PantryItemDetails';
import { deletePantryItem, getSavedRecipes, saveRecipe, unsaveRecipe, updatePantryItemStatus } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { getItemInsights } from '@/ai/flows/get-item-insights';
import { getRecipeSuggestions } from '@/app/actions';
import { RecipeCard } from '@/components/pantry/RecipeCard';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { differenceInDays, startOfToday } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

const filterOptions = [
    { value: 'all', label: 'All Items' },
    { value: 'expiring', label: 'Expiring Soon' },
    { value: 'fresh', label: 'Fresh' },
];

export default function PantryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { liveItems, pantryInitialized } = usePantryLogStore();
  const { recipes, setRecipes, clearRecipes } = useRecipeStore();
  
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedItem, setSelectedItem] = useState<PantryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  const [itemInsights, setItemInsights] = useState<Map<string, ItemInsights>>(new Map());
  const [isFetchingInsights, setIsFetchingInsights] = useState<Set<string>>(new Set());

  const [savedRecipeIds, setSavedRecipeIds] = useState<Set<string>>(new Set());
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [recipeFilters, setRecipeFilters] = useState({
    quickMeals: false,
    filipinoDishes: true,
  });
  const [isAddMethodOpen, setIsAddMethodOpen] = useState(false);


  useEffect(() => {
    setIsClient(true);
  }, []);

  const getStatus = useCallback((expirationDate: string) => {
    const today = startOfToday();
    const expiry = new Date(expirationDate);
    const daysLeft = differenceInDays(expiry, today);

    if (daysLeft < 0) return 'expired';
    if (daysLeft <= 3) return 'expiring';
    return 'fresh';
  }, []);


  // Filter and search items
  const filteredItems = useMemo(() => {
    let items = liveItems;
    
    // Apply search filter
    if (searchQuery) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply category filter
    if (filter !== 'all') {
      items = items.filter(item => getStatus(item.estimatedExpirationDate) === filter);
    }
    
    return items.sort((a,b) => new Date(a.estimatedExpirationDate).getTime() - new Date(b.estimatedExpirationDate).getTime());
  }, [liveItems, filter, searchQuery, getStatus]);

  const handleDelete = async (itemId: string) => {
    if (!user) return;
    setIsDeleting(itemId);
    try {
      await deletePantryItem(user.uid, itemId);
      toast({ title: 'Success', description: 'Item deleted from pantry.' });
      if (selectedItem?.id === itemId) {
        setSelectedItem(null);
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete item.' });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleGetInsights = useCallback(async (item: PantryItem) => {
    if (itemInsights.has(item.id)) return;

    setIsFetchingInsights(prev => new Set(prev).add(item.id));
    try {
      const result = await getItemInsights({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        estimatedExpirationDate: item.estimatedExpirationDate,
        estimatedCost: item.estimatedCost,
      });
      setItemInsights(prev => new Map(prev).set(item.id, result));
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Failed to get insights',
        description: 'Could not fetch insights for this item.',
      });
    } finally {
      setIsFetchingInsights(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  }, [itemInsights, toast]);

  const fetchRecipes = useCallback(async (isNewRequest: boolean) => {
    if (liveItems.length === 0) {
      setRecipes([]);
      return;
    }
    if(isNewRequest) {
        clearRecipes();
    }

    setIsLoadingRecipes(true);
    try {
      const pantryItemNames = liveItems.map((item) => item.name);
      const result = await getRecipeSuggestions({
        pantryItems: pantryItemNames,
        preferences: {
            quickMeals: recipeFilters.quickMeals,
            filipinoDishes: recipeFilters.filipinoDishes,
        },
      });
      const recipesWithIds = result.recipes.map(r => ({ ...r, id: r.id || crypto.randomUUID() }));
      setRecipes(recipesWithIds);
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
      toast({
        variant: 'destructive',
        title: 'Could not get recipes',
        description: 'An error occurred while generating recipe ideas. Please try again.',
      });
    } finally {
      setIsLoadingRecipes(false);
    }
  }, [liveItems, recipeFilters, toast, setRecipes, clearRecipes]);


  useEffect(() => {
    if (pantryInitialized && isClient && useRecipeStore.getState().recipes.length === 0 && liveItems.length > 0) {
        fetchRecipes(false);
    }
  }, [pantryInitialized, liveItems.length, fetchRecipes, isClient]);


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
      if (savedRecipeIds.has(recipe.id)) {
        await unsaveRecipe(user.uid, recipe.id);
        setSavedRecipeIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(recipe.id);
          return newSet;
        });
        toast({ title: 'Recipe unsaved', description: `"${recipe.name}" removed from your saves.` });
      } else {
        await saveRecipe(user.uid, recipe);
        setSavedRecipeIds(prev => new Set(prev).add(recipe.id));
        toast({ title: 'Recipe saved', description: `"${recipe.name}" added to your saves.` });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save recipe. Please try again.',
      });
    }
  };

  const handleMethodSelect = (method: 'camera' | 'voice' | 'text') => {
    setIsAddMethodOpen(false);
    router.push(`/add-to-pantry?method=${method}`);
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">🥗 My Pantry</h1>
            <Popover open={isAddMethodOpen} onOpenChange={setIsAddMethodOpen}>
              <PopoverTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 h-11 px-4 md:h-12 md:px-6 rounded-lg text-sm md:text-base">
                  <span>Add Items</span>
                  <Plus className="w-5 h-5 ml-2" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-primary">
                <div className="flex flex-col">
                  <Button variant="ghost" className="justify-start text-primary-foreground hover:bg-white/20" onClick={() => handleMethodSelect('camera')}>
                    <Camera className="w-4 h-4 mr-2" /> Scan with Camera
                  </Button>
                  <Separator className="my-1 bg-white/20" />
                  <Button variant="ghost" className="justify-start text-primary-foreground hover:bg-white/20" onClick={() => handleMethodSelect('voice')}>
                    <Mic className="w-4 h-4 mr-2" /> Use Voice Log
                  </Button>
                  <Separator className="my-1 bg-white/20" />
                  <Button variant="ghost" className="justify-start text-primary-foreground hover:bg-white/20" onClick={() => handleMethodSelect('text')}>
                    <Type className="w-4 h-4 mr-2" /> Type Manually
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Search and Filter Bar */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search your pantry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 text-base bg-white border-gray-200 focus:border-primary focus:ring-primary/20"
              />
            </div>
             <div className="flex gap-2 items-center overflow-x-auto pb-2 scrollbar-hide">
                {filterOptions.map(opt => (
                    <Button 
                        key={opt.value}
                        variant="outline"
                        size="sm"
                        onClick={() => setFilter(opt.value)}
                        className={cn(
                            "rounded-full border-gray-300 transition-all duration-200 whitespace-nowrap h-9",
                            filter === opt.value 
                                ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90" 
                                : "bg-white hover:border-primary hover:text-primary"
                        )}
                    >
                        {opt.label}
                    </Button>
                ))}
            </div>
          </div>
        </div>

        {/* Pantry Items */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Your Items</h2>
            <span className="text-sm text-gray-500">{filteredItems.length} items found</span>
          </div>

          {!pantryInitialized ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Card key={i} className='h-32 animate-pulse bg-gray-100'></Card>
                ))}
             </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No items found</h3>
                <p className="text-gray-500 mb-4 px-4">
                  {liveItems.length === 0 
                    ? "Your pantry is empty. Let's add some groceries!"
                    : "Clear your search or filters to see all items."
                  }
                </p>
                <Button onClick={() => router.push('/add-to-pantry')} className="h-11 text-base">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Groceries
                </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
              {filteredItems.map((item) => (
                <PantryItemCard
                  key={item.id}
                  item={item}
                  onSelect={setSelectedItem}
                  onDelete={handleDelete}
                  isDeleting={isDeleting === item.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recipe Suggestions */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-800">Recipe Suggestions</h2>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <Button
              onClick={() => fetchRecipes(true)}
              disabled={isLoadingRecipes}
              variant="outline"
              size="sm"
              className="h-9"
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isLoadingRecipes && 'animate-spin')} />
              New Ideas
            </Button>
          </div>
          {isLoadingRecipes && recipes.length === 0 ? (
             <div className="text-center py-10">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                <p className="mt-2 text-gray-500">Finding delicious recipes...</p>
            </div>
          ) : recipes.length > 0 ? (
            <Carousel opts={{ align: "start" }} className="w-full">
              <CarouselContent className="-ml-4">
                {recipes.map((recipe) => (
                  <CarouselItem key={recipe.id} className="sm:basis-1/2 lg:basis-1/3 pl-4">
                    <RecipeCard
                      recipe={recipe}
                      isSaved={savedRecipeIds.has(recipe.id)}
                      onToggleSave={handleToggleSave}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          ) : (
            <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Recipes Found</h3>
                <p className="text-gray-500 mb-4 px-4">
                    We couldn't find any recipes. Try adding more items to your pantry or refreshing.
                </p>
                <Button onClick={() => fetchRecipes(true)} className="h-11 text-base">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                </Button>
            </div>
          )}
        </div>

        {/* Item Details Modal */}
        {selectedItem && (
          <PantryItemDetails
            item={selectedItem}
            isOpen={!!selectedItem}
            onClose={() => setSelectedItem(null)}
            onDelete={handleDelete}
            onGetInsights={handleGetInsights}
            isFetchingInsights={isFetchingInsights.has(selectedItem.id)}
            insights={itemInsights.get(selectedItem.id) || null}
          />
        )}
      </div>
    </div>
  );
}
