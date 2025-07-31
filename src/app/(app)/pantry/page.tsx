
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePantryLogStore } from '@/stores/pantry-store';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Search, ChevronLeft } from 'lucide-react';
import type { PantryItem, Recipe } from '@/types';
import { PantryItemCard } from '@/components/pantry/PantryItemCard';
import { PantryItemDetails } from '@/components/pantry/PantryItemDetails';
import { deletePantryItem } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { suggestRecipes } from '@/ai/flows/suggest-recipes';
import { PantryOverview } from '@/components/pantry/PantryOverview';


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
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isFetchingRecipes, setIsFetchingRecipes] = useState(false);

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
    
    const handleGetRecipes = async (item: PantryItem) => {
        if (!pantryInitialized) return;
        setIsFetchingRecipes(true);
        try {
            const result = await suggestRecipes({
                pantryItems: [item.name, ...liveItems.filter(i => i.id !== item.id).slice(0,4).map(i => i.name)],
                preferences: { filipinoDishes: true },
                history: [],
            });
            const recipesWithIds = result.recipes.map(r => ({...r, id: crypto.randomUUID()}));
            setRecipes(recipesWithIds);
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch recipe ideas.' });
        } finally {
            setIsFetchingRecipes(false);
        }
    }

    const locationFilters = useMemo(() => {
        const locations = new Set(liveItems.map(i => i.storageLocation).filter(Boolean));
        return Array.from(locations);
    }, [liveItems]);


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
                </main>
            </div>
            {selectedItem && (
                 <PantryItemDetails 
                    item={selectedItem} 
                    isOpen={!!selectedItem}
                    onClose={() => setSelectedItem(null)}
                    onDelete={handleDelete}
                    onGetRecipes={handleGetRecipes}
                    isFetchingRecipes={isFetchingRecipes}
                    recipes={recipes}
                />
            )}
        </>
    );
}
