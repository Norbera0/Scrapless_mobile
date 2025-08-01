
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePantryLogStore } from '@/stores/pantry-store';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Search, ChevronLeft, RefreshCw } from 'lucide-react';
import type { PantryItem, Recipe, ItemInsights } from '@/types';
import { PantryItemCard } from '@/components/pantry/PantryItemCard';
import { PantryItemDetails } from '@/components/pantry/PantryItemDetails';
import { deletePantryItem, getSavedRecipes, saveRecipe, unsaveRecipe } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { getItemInsights } from '@/ai/flows/get-item-insights';
import { suggestRecipes } from '@/ai/flows/suggest-recipes';
import { PantryOverview } from '@/components/pantry/PantryOverview';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { RecipeCard } from '@/components/pantry/RecipeCard';


export default function PantryPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { liveItems, pantryInitialized } = usePantryLogStore();
    
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState<PantryItem | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);
    
    // Per-item state for AI insights
    const [itemInsights, setItemInsights] = useState<Map<string, ItemInsights>>(new Map());
    const [isFetchingInsights, setIsFetchingInsights] = useState<Set<string>>(new Set());

    // State for recipe generator
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [savedRecipeIds, setSavedRecipeIds] = useState<Set<string>>(new Set());
    const [isLoadingRecipes, setIsLoadingRecipes] = useState(true);
    const [recipeFilters, setRecipeFilters] = useState({ quickMeals: false, filipinoDishes: false });


    useEffect(() => {
        setIsClient(true);
    }, []);
    
    const pantryStats = useMemo(() => {
        const totalValue = liveItems.reduce((acc, item) => acc + (item.estimatedCost || 0), 0);
        const totalFootprint = liveItems.reduce((acc, item) => acc + (item.carbonFootprint || 0), 0);
        return { totalValue, totalFootprint };
    }, [liveItems]);

    const filteredItems = useMemo(() => {
        return liveItems
            .filter(item => {
                const lowerSearchTerm = searchTerm.toLowerCase();
                return item.name.toLowerCase().includes(lowerSearchTerm);
            })
            .filter(item => {
                if (filter === 'all') return true;
                return item.storageLocation?.toLowerCase() === filter;
            });
    }, [liveItems, searchTerm, filter]);

    const { urgentItems, freshItems } = useMemo(() => {
        const urgent: PantryItem[] = [];
        const fresh: PantryItem[] = [];
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        filteredItems.forEach(item => {
            const expiryDate = new Date(item.estimatedExpirationDate);
            expiryDate.setHours(0, 0, 0, 0);
            const diffDays = (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
            
            if (diffDays <= 2) {
                urgent.push(item);
            } else {
                fresh.push(item);
            }
        });
        
        urgent.sort((a,b) => new Date(a.estimatedExpirationDate).getTime() - new Date(b.estimatedExpirationDate).getTime());
        fresh.sort((a,b) => new Date(a.estimatedExpirationDate).getTime() - new Date(b.estimatedExpirationDate).getTime());
        
        return { urgentItems: urgent, freshItems: fresh };
    }, [filteredItems]);


    const handleDelete = async (itemId: string) => {
        if (!user) return;
        setIsDeleting(itemId);
        try {
            await deletePantryItem(user.uid, itemId);
            toast({ title: 'Success', description: 'Item deleted from pantry.' });
            if(selectedItem?.id === itemId) {
                setSelectedItem(null);
            }
        } catch(e) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete item.' });
        } finally {
            setIsDeleting(null);
        }
    }
    
    const handleGetInsights = useCallback(async (item: PantryItem) => {
        if (itemInsights.has(item.id)) return; // Already fetched

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
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch AI insights.' });
        } finally {
            setIsFetchingInsights(prev => {
                const newSet = new Set(prev);
                newSet.delete(item.id);
                return newSet;
            });
        }
    }, [itemInsights, toast]);

    const locationFilters = useMemo(() => {
        const locations = new Set(liveItems.map(i => i.storageLocation).filter(Boolean));
        return Array.from(locations);
    }, [liveItems]);

    // --- Recipe Generator Logic ---
    const fetchRecipes = useCallback(async (currentRecipes: Recipe[]) => {
        setIsLoadingRecipes(true);
        try {
            const pantryItemNames = liveItems.map((item) => item.name);
            if (pantryItemNames.length === 0) {
                setRecipes([]);
                return;
            }
            const result = await suggestRecipes({
                pantryItems: pantryItemNames,
                preferences: recipeFilters,
                history: currentRecipes.map(r => r.name),
            });
            const recipesWithIds = result.recipes.map(r => ({ ...r, id: crypto.randomUUID() }));
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
        if (pantryInitialized) {
            fetchRecipes([]); // Initial fetch
        }
    }, [pantryInitialized, recipeFilters, fetchRecipes]);
    
    useEffect(() => {
        const loadSaved = async () => {
            if(user) {
                const saved = await getSavedRecipes(user.uid);
                setSavedRecipeIds(new Set(saved.map(r => r.id)));
            }
        }
        loadSaved();
    }, [user]);
    
    const handleToggleRecipeFilter = (filter: 'quickMeals' | 'filipinoDishes') => {
        setRecipeFilters(prev => ({ ...prev, [filter]: !prev[filter] }));
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


    if (!isClient || !pantryInitialized) {
        return (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <>
            <div className="min-h-full relative pb-24">
                <header className="glass-card sticky top-0 z-40 px-4 md:px-6 py-4 rounded-b-2xl shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-2 md:space-x-4">
                            <Button variant="ghost" size="icon" onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                <ChevronLeft className="w-6 h-6 text-gray-600" />
                            </Button>
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Virtual Pantry</h1>
                                <p className="text-xs md:text-sm text-gray-500">{liveItems.length} items • ₱{pantryStats.totalValue.toFixed(2)} total value</p>
                            </div>
                        </div>
                        <Button onClick={() => router.push('/add-to-pantry')} className="gradient-bg text-white px-3 py-2 md:px-4 md:py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all">
                             <Plus className="w-5 h-5 md:inline md:mr-2" />
                            <span className='hidden md:inline'>Add Item</span>
                        </Button>
                    </div>

                    <PantryOverview stats={pantryStats} />

                     <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search your pantry..." 
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-0 rounded-xl focus:bg-white focus:outline-none transition-all search-focus"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </header>

                <main className="px-4 md:px-6 py-6 space-y-6">
                     <div className="flex space-x-2 overflow-x-auto pb-2">
                        <button onClick={() => setFilter('all')} className={`location-chip px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === 'all' ? 'bg-primary text-primary-foreground' : ''}`}>
                            All Items
                        </button>
                        {locationFilters.map(loc => (
                            <button key={loc} onClick={() => setFilter(loc!.toLowerCase())} className={`location-chip px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all capitalize ${filter === loc!.toLowerCase() ? 'bg-primary text-primary-foreground' : ''}`}>
                                {loc}
                            </button>
                        ))}
                    </div>
                    
                    {urgentItems.length > 0 && (
                        <section id="urgentSection" className="space-y-3">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                <span className="w-2 h-2 bg-red-500 rounded-full mr-3 animate-pulse"></span>
                                Use Soon ( expiring in ≤ 2 days )
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {urgentItems.map(item => (
                                    <PantryItemCard key={item.id} item={item} onSelect={setSelectedItem} isDeleting={isDeleting === item.id} onDelete={handleDelete} />
                                ))}
                            </div>
                        </section>
                    )}

                     {freshItems.length > 0 && (
                        <section id="freshSection" className="space-y-3">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                                Fresh & Good
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {freshItems.map(item => (
                                     <PantryItemCard key={item.id} item={item} onSelect={setSelectedItem} isDeleting={isDeleting === item.id} onDelete={handleDelete} />
                                ))}
                            </div>
                        </section>
                    )}
                    
                    {filteredItems.length === 0 && (
                        <div className='text-center py-10 text-gray-500'>
                            <p>No items found.</p>
                            <p className='text-sm'>Try adjusting your search or filters.</p>
                        </div>
                    )}
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>🍳 Recipe Ideas</CardTitle>
                            <CardDescription>AI-powered suggestions based on your pantry items.</CardDescription>
                            <div className="flex gap-2 pt-2">
                                <Button size="sm" variant={recipeFilters.quickMeals ? 'default' : 'outline'} onClick={() => handleToggleRecipeFilter('quickMeals')}>
                                    ⚡ Quick Meals
                                </Button>
                                <Button size="sm" variant={recipeFilters.filipinoDishes ? 'default' : 'outline'} onClick={() => handleToggleRecipeFilter('filipinoDishes')}>
                                    🇵🇭 Filipino
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => fetchRecipes(recipes)} disabled={isLoadingRecipes || liveItems.length === 0}>
                                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingRecipes ? 'animate-spin' : ''}`} />
                                    More Recipes
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoadingRecipes ? (
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

                </main>
            </div>
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
        </>
    );
}
