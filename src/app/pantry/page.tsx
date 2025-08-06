
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePantryLogStore } from '@/stores/pantry-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
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
  Filter,
  Grid3X3,
  List,
  Loader2
} from 'lucide-react';
import type { PantryItem, Recipe, ItemInsights } from '@/types';
import { PantryItemCard } from '@/components/pantry/PantryItemCard';
import { PantryItemDetails } from '@/components/pantry/PantryItemDetails';
import { deletePantryItem, getSavedRecipes, saveRecipe, unsaveRecipe, updatePantryItemStatus } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { getItemInsights } from '@/ai/flows/get-item-insights';
import { suggestRecipes } from '@/ai/flows/suggest-recipes';
import { PantryOverview } from '@/components/pantry/PantryOverview';
import { RecipeCard } from '@/components/pantry/RecipeCard';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PantryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { liveItems, pantryInitialized } = usePantryLogStore();
  
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [selectedItem, setSelectedItem] = useState<PantryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  const [itemInsights, setItemInsights] = useState<Map<string, ItemInsights>>(new Map());
  const [isFetchingInsights, setIsFetchingInsights] = useState<Set<string>>(new Set());

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [savedRecipeIds, setSavedRecipeIds] = useState<Set<string>>(new Set());
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false);
  const [recipeFilters, setRecipeFilters] = useState({
    quickMeals: false,
    filipinoDishes: true,
    difficulty: 'Easy' as const,
  });

  useEffect(() => {
    setIsClient(true);
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
      const now = new Date();
      items = items.filter(item => {
        const expirationDate = new Date(item.estimatedExpirationDate);
        const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (filter) {
          case 'fresh':
            return daysUntilExpiration > 3;
          case 'expiring':
            return daysUntilExpiration >= 0 && daysUntilExpiration <= 3;
          case 'expired':
            return daysUntilExpiration < 0;
          default:
            return true;
        }
      });
    }
    
    return items;
  }, [liveItems, filter, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const fresh = liveItems.filter(item => {
      const daysUntilExpiration = Math.ceil((new Date(item.estimatedExpirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiration > 3;
    });
    
    const expiring = liveItems.filter(item => {
      const daysUntilExpiration = Math.ceil((new Date(item.estimatedExpirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiration >= 0 && daysUntilExpiration <= 3;
    });
    
    const expired = liveItems.filter(item => {
      const daysUntilExpiration = Math.ceil((new Date(item.estimatedExpirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiration < 0;
    });

    return {
      total: liveItems.length,
      fresh: fresh.length,
      expiring: expiring.length,
      expired: expired.length,
      healthPercentage: liveItems.length > 0 ? Math.round((fresh.length / liveItems.length) * 100) : 0
    };
  }, [liveItems]);

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
        estimatedAmount: item.estimatedAmount,
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

  const fetchRecipes = useCallback(async (currentRecipes: Recipe[]) => {
    if (liveItems.length === 0) {
      setRecipes([]);
      return;
    }

    setIsLoadingRecipes(true);
    try {
      const pantryItemNames = liveItems.map((item) => item.name);
      const result = await suggestRecipes({
        pantryItems: pantryItemNames,
        preferences: {
            quickMeals: recipeFilters.quickMeals,
            filipinoDishes: recipeFilters.filipinoDishes,
            difficulty: recipeFilters.difficulty as any,
        },
        history: currentRecipes.map(r => r.name),
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
  }, [liveItems, recipeFilters, toast]);


  useEffect(() => {
    if (pantryInitialized && recipes.length === 0) {
      fetchRecipes([]);
    }
  }, [pantryInitialized, recipes.length, fetchRecipes]);

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

  if (!isClient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-4xl font-semibold text-[#063627]">Your Pantry</h1>
                <Package className="w-8 h-8 text-[#227D53]" />
              </div>
              <p className="text-[#7C7C7C] text-lg">Manage your inventory and discover new recipes</p>
            </div>
            <Button 
              onClick={() => router.push('/add-to-pantry')}
              className="bg-gradient-to-r from-[#063627] to-[#227D53] hover:from-[#063627]/90 hover:to-[#227D53]/90 shadow-lg shadow-[#227D53]/25 h-12 px-6 text-lg font-semibold rounded-lg transition-all duration-200 hover:scale-[1.02]"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Items
            </Button>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7C7C7C] w-5 h-5" />
              <Input
                placeholder="Search your pantry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-white border-2 border-[#A3A9A7]/30 focus:border-[#227D53] rounded-lg text-lg"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full md:w-48 h-12 bg-white border-2 border-[#A3A9A7]/30 focus:border-[#227D53] rounded-lg">
                <SelectValue placeholder="Filter items" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="fresh">Fresh Items</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className="h-12 w-12"
              >
                <Grid3X3 className="w-5 h-5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
                className="h-12 w-12"
              >
                <List className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Items</p>
                  <p className="text-3xl font-semibold text-blue-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Fresh Items</p>
                  <p className="text-3xl font-semibold text-green-900">{stats.fresh}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700">Expiring Soon</p>
                  <p className="text-3xl font-semibold text-yellow-900">{stats.expiring}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">Expired</p>
                  <p className="text-3xl font-semibold text-red-900">{stats.expired}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pantry Health Score */}
        <Card className="mb-8 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#063627]">
              <TrendingUp className="w-6 h-6 text-[#227D53]" />
              Pantry Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#7C7C7C]">Overall Health</span>
                  <span className="font-semibold text-[#063627]">{stats.healthPercentage}%</span>
                </div>
                <Progress value={stats.healthPercentage} className="h-3 mb-4" />
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-[#7C7C7C]">{stats.fresh} Fresh</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-[#7C7C7C]">{stats.expiring} Expiring</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-[#7C7C7C]">{stats.expired} Expired</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pantry Items */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-[#063627]">Your Items</h2>
            <span className="text-[#7C7C7C]">{filteredItems.length} items</span>
          </div>

          {filteredItems.length === 0 ? (
            <Card className="border-2 border-dashed border-[#A3A9A7]/30">
              <CardContent className="p-12 text-center">
                <Package className="w-16 h-16 text-[#A3A9A7] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[#063627] mb-2">No items found</h3>
                <p className="text-[#7C7C7C] mb-4">
                  {liveItems.length === 0 
                    ? "Your pantry is empty. Start by adding some items!"
                    : "No items match your current filters."
                  }
                </p>
                <Button 
                  onClick={() => router.push('/add-to-pantry')}
                  className="bg-gradient-to-r from-[#063627] to-[#227D53]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Items
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
              : "space-y-4"
            }>
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold text-[#063627]">Recipe Suggestions</h2>
              <Sparkles className="w-6 h-6 text-[#FFDD00]" />
            </div>
            <Button
              onClick={() => fetchRecipes(recipes)}
              disabled={isLoadingRecipes}
              variant="outline"
              className="border-[#227D53] text-[#227D53] hover:bg-[#227D53]/10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingRecipes ? 'animate-spin' : ''}`} />
              Refresh Recipes
            </Button>
          </div>
          {recipes.length > 0 ? (
            <Carousel opts={{ align: "start", loop: true }} className="w-full">
              <CarouselContent>
                {recipes.map((recipe) => (
                  <CarouselItem key={recipe.id} className="md:basis-1/2 lg:basis-1/3">
                    <RecipeCard
                      recipe={recipe}
                      isSaved={savedRecipeIds.has(recipe.id)}
                      onToggleSave={handleToggleSave}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          ) : isLoadingRecipes ? (
             <div className="text-center py-10">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                <p className="mt-2 text-muted-foreground">Finding delicious recipes...</p>
            </div>
          ) : (
             <Card className="border-2 border-dashed border-[#A3A9A7]/30">
                <CardContent className="p-12 text-center">
                    <BookOpen className="w-16 h-16 text-[#A3A9A7] mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-[#063627] mb-2">No Recipes Found</h3>
                    <p className="text-[#7C7C7C] mb-4">
                        We couldn't find any recipes. Try adding more items to your pantry or refreshing.
                    </p>
                    <Button onClick={() => fetchRecipes([])}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                    </Button>
                </CardContent>
            </Card>
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
