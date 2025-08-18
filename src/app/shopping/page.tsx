
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PackagePlus, Loader2, ShoppingCart, Leaf, Sparkles, BarChart, FileText, CheckCircle, Trash2, Banknote, Heart } from 'lucide-react';
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
import Image from 'next/image';

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
                         <Heart className="w-4 h-4 text-white" />
                    </div>
                ) : dealIcon && (
                    <Image src={dealIcon} alt={`${deal.icon} logo`} width={24} height={24} className="rounded-md bg-white p-0.5" />
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

  const { checkedItemsCost, totalSavingsFromDeals } = useMemo(() => {
    if (!generatedList) return { checkedItemsCost: 0, totalSavingsFromDeals: 0 };
    
    let cost = 0;
    let savings = 0;

    generatedList.items.forEach(item => {
        if (item.isChecked) {
            cost += item.estimatedCost;
            if (item.deal?.dealType === 'cashback' || item.deal?.dealType === 'bogo') {
                const savingAmount = parseFloat(item.deal.estimatedSavings.replace(/[^0-9.-]+/g,""));
                if(!isNaN(savingAmount)) {
                    savings += savingAmount;
                }
            }
        }
    });

    return { checkedItemsCost: cost, totalSavingsFromDeals: savings };
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
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingCart className="w-8 h-8" />
            Shopping Hub
        </h1>
        <p className="text-muted-foreground text-sm">AI-powered suggestions to help you buy smarter and save more with BPI.</p>
      </div>
      
      {!generatedList ? (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Create This Week's List</CardTitle>
                <CardDescription className="text-sm">Analyze pantry gaps and waste to buy just what you need.</CardDescription>
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
                    <CardTitle className="text-lg">Your Smart Shopping List</CardTitle>
                    <CardDescription className="text-sm">
                        Check off items as you shop to see your total.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
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
                </CardContent>
                <CardFooter className="flex-col items-stretch gap-4 pt-4">
                  <Separator />
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Selected Total:</span>
                    <span className="text-primary">₱{checkedItemsCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">List Total:</span>
                    <span className="font-medium">₱{generatedList.totalEstimatedCost.toFixed(2)}</span>
                  </div>
                   {totalSavingsFromDeals > 0 && (
                     <div className="flex justify-between items-center text-sm text-green-600 font-medium p-2 bg-green-100 rounded-md">
                        <span>Est. BPI Deal Savings:</span>
                        <span>- ₱{totalSavingsFromDeals.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                     <Button>
                        <Image src="/bpi-logo.png" alt="BPI Logo" width={20} height={20} className="mr-2 rounded-sm bg-white p-0.5" />
                        Pay with BPI
                    </Button>
                    <Button variant="secondary">
                        <Image src="/vybe-logo-2 copy.png" alt="VYBE Logo" width={20} height={20} className="mr-2" />
                        Scan with VYBE
                    </Button>
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
