
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PackagePlus, Loader2, ShoppingCart, Leaf, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { usePantryLogStore } from '@/stores/pantry-store';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { add, isBefore } from 'date-fns';
import { formatPeso } from '@/lib/utils';

export default function ShoppingHubPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { liveItems } = usePantryLogStore();
  const { logs } = useWasteLogStore();

  const smartSuggestions = useMemo(() => {
    // Identify items commonly wasted and items running low/expiring soon
    const now = new Date();
    const soon = add(now, { days: 3 });

    const expiringSoon = liveItems.filter(i => {
      const expiry = new Date(i.estimatedExpirationDate);
      return isBefore(expiry, soon) && expiry >= now;
    }).map(i => i.name.toLowerCase());

    const frequentlyWasted: Record<string, { count: number; peso: number }> = {};
    logs.forEach(l => {
      l.items.forEach(it => {
        const key = it.name.toLowerCase();
        frequentlyWasted[key] = frequentlyWasted[key] || { count: 0, peso: 0 };
        frequentlyWasted[key].count += 1;
        frequentlyWasted[key].peso += (it as any).pesoValue || 0;
      });
    });

    const topWasted = Object.entries(frequentlyWasted)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3)
      .map(([name, stats]) => ({ name, estimatedMonthlyLoss: stats.peso }));

    return {
      expiringSoon: Array.from(new Set(expiringSoon)).slice(0, 6),
      topWasted,
    };
  }, [liveItems, logs]);

  const handleGenerateList = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: 'Smart suggestions ready',
        description: 'Tailored to pantry gaps and your waste patterns.',
      });
    }, 900);
  };


  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Shopping Hub</h1>
        <p className="text-muted-foreground">AI-powered suggestions tied to pantry gaps and waste patterns.</p>
      </div>
      
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
                        Generating...
                    </>
                ) : (
                    <>
                        <PackagePlus className="mr-2 h-4 w-4" />
                        Generate Shopping Suggestions
                    </>
                )}
            </Button>
        </CardContent>
    </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Pantry Watchouts</CardTitle>
            <CardDescription>Buy only what you’ll use before it expires.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {smartSuggestions.expiringSoon.length === 0 ? (
              <p className="text-sm text-muted-foreground">No items expiring in the next 3 days.</p>
            ) : (
              smartSuggestions.expiringSoon.map((name) => (
                <div key={name} className="text-sm">• {name}</div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Leaf className="h-4 w-4" /> Green Alternatives</CardTitle>
            <CardDescription>Lower-impact swaps and ways to save.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {smartSuggestions.topWasted.length === 0 ? (
              <p className="text-sm text-muted-foreground">No frequent waste patterns yet. Keep logging.</p>
            ) : (
              smartSuggestions.topWasted.map(item => (
                <div key={item.name} className="text-sm">
                  • Consider buying smaller portions of “{item.name}” or frozen variants. Est. loss last logs: {formatPeso(item.estimatedMonthlyLoss)}
                </div>
              ))
            )}
            <div className="text-xs text-muted-foreground">Partner offers and BPI perks can appear here.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
