
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePantryLogStore } from '@/stores/pantry-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress, type ProgressSegment } from '@/components/ui/progress';
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
  Leaf
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
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const filterOptions = [
    { value: 'all', label: 'All Items' },
    { value: 'expiring', label: 'Expiring Soon' },
    { value: 'fresh', label: 'Fresh' },
    { value: 'expired', label: 'Expired' },
];

export default function PantryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { liveItems, pantryInitialized } = usePantryLogStore();
  
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
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
  });

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

  // Calculate statistics
  const stats = useMemo(() => {
    const fresh = liveItems.filter(item => getStatus(item.estimatedExpirationDate) === 'fresh');
    const expiring = liveItems.filter(item => getStatus(item.estimatedExpirationDate) === 'expiring');
    const expired = liveItems.filter(item => getStatus(item.estimatedExpirationDate) === 'expired');

    const healthScore = liveItems.length > 0 
      ? Math.round(
          ((fresh.length * 100) + (expiring.length * 50) + (expired.length * 0)) / liveItems.length
        )
      : 100;
    
    const total = liveItems.length;
    const segments: ProgressSegment[] = total > 0 ? [
        { value: fresh.length, color: '#10B981', label: 'Fresh' },
        { value: expiring.length, color: '#F59E0B', label: 'Expiring Soon' },
        { value: expired.length, color: '#EF4444', label: 'Expired' },
    ] : [];

    return {
      total: liveItems.length,
      fresh: fresh.length,
      expiring: expiring.length,
      expired: expired.length,
      healthScore,
      segments
    };
  }, [liveItems, getStatus]);

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
      const result = await getRecipeSuggestions({
        pantryItems: pantryItemNames,
        preferences: {
            quickMeals: recipeFilters.quickMeals,
            filipinoDishes: recipeFilters.filipinoDishes,
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
  
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-amber-600';
        return 'text-red-600';
    };

    const pieChartData = [
        { name: 'Health', value: stats.healthScore, color: '#059669' },
        { name: 'Remainder', value: 100 - stats.healthScore, color: '#F3F4F6' },
    ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className='flex items-center gap-3'>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">🥗 Your Pantry</h1>
              <div>
                <p className="text-gray-500 text-sm md:text-base hidden">Manage your inventory and discover new recipes</p>
              </div>
            </div>
            <Button 
              onClick={() => router.push('/add-to-pantry')}
              className="bg-primary hover:bg-primary/90 h-10 px-4 md:h-12 md:px-6 rounded-lg"
            >
              <Plus className="w-5 h-5 md:mr-2" />
              <span className='hidden md:inline'>Add Items</span>
            </Button>
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
                            "rounded-full border-gray-300 transition-all duration-200 whitespace-nowrap",
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

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 mb-8">
            <Card
                className="p-5 rounded-2xl shadow-sm border border-blue-200 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer"
                onClick={() => setFilter('all')}
            >
                <div className="w-11 h-11 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center mb-2">
                    <Package className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-blue-800">{stats.total}</p>
                <p className="text-sm font-medium text-blue-600">Total Items</p>
            </Card>
            <Card
                className="p-5 rounded-2xl shadow-sm border border-green-200 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer"
                onClick={() => setFilter('fresh')}
            >
                <div className="w-11 h-11 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center mb-2">
                    <Leaf className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-800">{stats.fresh}</p>
                <p className="text-sm font-medium text-green-600">Fresh Items</p>
            </Card>
            <Card
                className="p-5 rounded-2xl shadow-sm border border-amber-200 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer"
                onClick={() => setFilter('expiring')}
            >
                <div className="w-11 h-11 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center mb-2">
                    <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <p className="text-3xl font-bold text-amber-800">{stats.expiring}</p>
                <p className="text-sm font-medium text-amber-600">Expiring Soon</p>
            </Card>
            <Card
                className="p-5 rounded-2xl shadow-sm border border-red-200 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer"
                onClick={() => setFilter('expired')}
            >
                <div className="w-11 h-11 bg-gradient-to-br from-red-100 to-red-200 rounded-lg flex items-center justify-center mb-2">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-3xl font-bold text-red-800">{stats.expired}</p>
                <p className="text-sm font-medium text-red-600">Expired</p>
            </Card>
        </div>


        {/* Pantry Health Score */}
        <Card className="mb-8 rounded-2xl shadow-sm border-gray-200 transition-shadow hover:shadow-md">
            <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                📊 Pantry Health Score
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center gap-8 p-6">
                <div className="relative w-32 h-32 md:w-36 md:h-36">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius="70%"
                                outerRadius="100%"
                                startAngle={90}
                                endAngle={450}
                                dataKey="value"
                                stroke="none"
                            >
                                {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-3xl font-bold ${getScoreColor(stats.healthScore)}`}>
                            {stats.healthScore}%
                        </span>
                        <span className="text-xs text-gray-500">Health Score</span>
                    </div>
                </div>

                <div className="flex-1 w-full">
                    <Progress value={stats.healthScore} segments={stats.segments} className="h-3 mb-4 rounded-full" />
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-[#10B981] rounded-full"></div>
                            <div>
                                <p className="font-bold text-lg text-gray-800">{stats.fresh}</p>
                                <p className="text-gray-500">Fresh</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-[#F59E0B] rounded-full"></div>
                             <div>
                                <p className="font-bold text-lg text-gray-800">{stats.expiring}</p>
                                <p className="text-gray-500">Expiring</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-3 h-3 bg-[#EF4444] rounded-full"></div>
                             <div>
                                <p className="font-bold text-lg text-gray-800">{stats.expired}</p>
                                <p className="text-gray-500">Expired</p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>


        {/* Pantry Items */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Your Items</h2>
            <span className="text-sm text-gray-500">{filteredItems.length} items found</span>
          </div>

          {!pantryInitialized ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Card key={i} className='h-32 animate-pulse bg-gray-100'></Card>
                ))}
             </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No items found</h3>
                <p className="text-gray-500 mb-4">
                  {liveItems.length === 0 
                    ? "Your pantry is empty. Let's add some groceries!"
                    : "Clear your search or filters to see all items."
                  }
                </p>
                <Button onClick={() => router.push('/add-to-pantry')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Groceries
                </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
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
              onClick={() => fetchRecipes(recipes)}
              disabled={isLoadingRecipes}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isLoadingRecipes && 'animate-spin')} />
              New Ideas
            </Button>
          </div>
          {isLoadingRecipes ? (
             <div className="text-center py-10">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                <p className="mt-2 text-gray-500">Finding delicious recipes...</p>
            </div>
          ) : recipes.length > 0 ? (
            <Carousel opts={{ align: "start" }} className="w-full">
              <CarouselContent className="-ml-4">
                {recipes.map((recipe) => (
                  <CarouselItem key={recipe.id} className="md:basis-1/2 lg:basis-1/3 pl-4">
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
                <p className="text-gray-500 mb-4">
                    We couldn't find any recipes. Try adding more items to your pantry or refreshing.
                </p>
                <Button onClick={() => fetchRecipes([])}>
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
