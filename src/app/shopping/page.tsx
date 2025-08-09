
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PackagePlus, Loader2, ShoppingCart, Leaf, Sparkles, BarChart, FileText, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { usePantryLogStore } from '@/stores/pantry-store';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { generateShoppingList } from '@/ai/flows/generate-shopping-list';
import { useShoppingListStore } from '@/stores/shopping-list-store';
import type { GenerateShoppingListOutput } from '@/ai/schemas';

export default function ShoppingHubPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { liveItems } = usePantryLogStore();
  const { logs } = useWasteLogStore();
  const { generatedList, setGeneratedList } = useShoppingListStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    useShoppingListStore.persist.rehydrate();
  }, []);

  const handleGenerateList = async () => {
    setIsLoading(true);
    try {
        const pantryData = liveItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            estimatedExpirationDate: item.estimatedExpirationDate,
        }));

        const result = await generateShoppingList({
            pantryItems: pantryData,
            wasteLogs: logs,
        });

        setGeneratedList(result);

      toast({
        title: 'Smart suggestions ready!',
        description: 'Your personalized shopping list has been created.',
      });
    } catch(err) {
        console.error("Shopping list generation failed", err);
        toast({
            variant: 'destructive',
            title: 'Generation Failed',
            description: 'Could not generate a shopping list at this time.'
        });
    } finally {
        setIsLoading(false);
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

  if (!isClient) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Shopping Hub</h1>
        <p className="text-muted-foreground">AI-powered suggestions to help you buy smarter.</p>
      </div>
      
      {!generatedList ? (
        <Card>
            <CardHeader>
                <CardTitle>Create This Week's List</CardTitle>
                <CardDescription>Analyze pantry gaps and waste to buy just what you need.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button className="w-full" onClick={handleGenerateList} disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing your habits...
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate Smart Shopping List
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
      ) : (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Your Smart Shopping List</CardTitle>
                    <CardDescription>
                        Total Estimated Cost: <span className='font-bold text-primary'>₱{generatedList.totalEstimatedCost.toFixed(2)}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {generatedList.items.map(item => (
                        <Card key={item.id} className="p-3">
                            <div className="flex items-center gap-4">
                               <div className="flex-1">
                                    <p className="font-semibold">{item.name} <span className="text-muted-foreground font-normal">({item.quantity})</span></p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                                        {getCategoryIcon(item.category)}
                                        {item.reasoning}
                                    </p>
                               </div>
                               <div className="text-right">
                                    <p className="font-semibold">₱{item.estimatedCost.toFixed(2)}</p>
                                    <p className="text-xs capitalize text-muted-foreground">{item.priority}</p>
                               </div>
                            </div>
                        </Card>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Generation Summary</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-2 bg-secondary rounded-md">
                        <p className="text-2xl font-bold">{generatedList.generationSource.pantryItemsConsidered}</p>
                        <p className="text-xs text-muted-foreground">Pantry Items</p>
                    </div>
                     <div className="p-2 bg-secondary rounded-md">
                        <p className="text-2xl font-bold">{generatedList.generationSource.wasteLogsAnalyzed}</p>
                        <p className="text-xs text-muted-foreground">Waste Logs</p>
                    </div>
                     <div className="p-2 bg-secondary rounded-md">
                        <p className="text-2xl font-bold">{generatedList.generationSource.stapleItemsIncluded}</p>
                        <p className="text-xs text-muted-foreground">Staples Added</p>
                    </div>
                     <div className="p-2 bg-secondary rounded-md">
                        <p className="text-2xl font-bold">{generatedList.generationSource.daysOfDataUsed}</p>
                        <p className="text-xs text-muted-foreground">Days Analyzed</p>
                    </div>
                </CardContent>
            </Card>

            <Button onClick={() => setGeneratedList(null)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Done Shopping
            </Button>
        </>
      )}
    </div>
  );
}
