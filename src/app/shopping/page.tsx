
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PackagePlus, Loader2, ShoppingCart, Leaf, Sparkles, BarChart, FileText, CheckCircle, Trash2 } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { usePantryLogStore } from '@/stores/pantry-store';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { generateShoppingList } from '@/ai/flows/generate-shopping-list';
import { useShoppingListStore } from '@/stores/shopping-list-store';
import type { GenerateShoppingListOutput } from '@/ai/schemas';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export default function ShoppingHubPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { liveItems } = usePantryLogStore();
  const { logs } = useWasteLogStore();
  const { generatedList, setGeneratedList, toggleItemChecked } = useShoppingListStore();
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

  const checkedItemsCost = useMemo(() => {
    if (!generatedList) return 0;
    return generatedList.items
      .filter(item => item.isChecked)
      .reduce((total, item) => total + item.estimatedCost, 0);
  }, [generatedList]);

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
                        Check off items as you shop.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {generatedList.items.map(item => (
                        <div key={item.id} className={cn("flex items-start gap-4 p-4 rounded-lg transition-colors", item.isChecked && "bg-green-50")}>
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
                    ))}
                </CardContent>
                <CardFooter className="flex-col items-stretch gap-4">
                  <Separator />
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Selected Total:</span>
                    <span className="text-primary">₱{checkedItemsCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">List Total:</span>
                    <span className="font-medium">₱{generatedList.totalEstimatedCost.toFixed(2)}</span>
                  </div>
                </CardFooter>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => handleGenerateList()} disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Regenerate
              </Button>
              <Button onClick={() => setGeneratedList(null)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear List
              </Button>
            </div>
        </>
      )}
    </div>
  );
}
