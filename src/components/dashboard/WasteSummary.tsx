
'use client';

import { useWasteLogStore } from '@/stores/waste-log-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { saveWasteLog } from '@/lib/data';
import type { FoodItem, User, WasteLog } from '@/types';
import { Save, Loader2, Lightbulb } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import Image from 'next/image';
import { FOOD_DATA_MAP } from '@/lib/food-data';
import { getDisposalTip } from '@/ai/flows/get-disposal-tip';

export function WasteSummary() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const { items, photoDataUri, reset } = useWasteLogStore();
  const [isFetchingTip, setIsFetchingTip] = useState(true);
  const [disposalTip, setDisposalTip] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((fbUser) => {
        setUser(fbUser);
    });

    if (items.length === 0) {
        router.replace('/log-waste?method=camera');
    } else {
        const fetchTip = async () => {
            try {
                const result = await getDisposalTip({ items });
                setDisposalTip(result.tip);
            } catch (error) {
                console.error("Failed to get disposal tip:", error);
                setDisposalTip("Properly segregate your waste. Check with your local barangay for composting programs.");
            } finally {
                setIsFetchingTip(false);
            }
        };
        fetchTip();
    }

    return () => unsubscribe();
  }, [items, router]);
  
  const getImpact = (itemName: string): { peso: number; co2e: number, shelfLifeDays: number } => {
    const lowerCaseItem = itemName.toLowerCase();
    for (const key in FOOD_DATA_MAP) {
      if (lowerCaseItem.includes(key)) {
        return FOOD_DATA_MAP[key];
      }
    }
    return { peso: 5, co2e: 0.1, shelfLifeDays: 7 }; // Default for unrecognized items
  }

  const impactData = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const { peso, co2e } = getImpact(item.name);
        acc.totalPesoValue += peso;
        acc.totalCarbonFootprint += co2e;
        return acc;
      },
      { totalPesoValue: 0, totalCarbonFootprint: 0 }
    );
  }, [items]);

  const handleFinish = () => {
    reset();
    router.push('/analytics');
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Log Saved!</CardTitle>
        <CardDescription>Based on the items you logged, here is the estimated impact.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {photoDataUri && (
          <div className="overflow-hidden rounded-lg">
            <Image src={photoDataUri} alt="Logged food waste" width={600} height={400} className="object-cover w-full" />
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-secondary p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">Estimated Peso Value</p>
            <p className="text-3xl font-bold">₱{impactData.totalPesoValue.toFixed(2)}</p>
          </div>
          <div className="bg-secondary p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">CO₂e Footprint</p>
            <p className="text-3xl font-bold">{impactData.totalCarbonFootprint.toFixed(2)}<span className="text-base">kg</span></p>
          </div>
        </div>

        <div>
            <h3 className="font-semibold mb-2">Logged Items:</h3>
            <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
                {items.map(item => (
                    <li key={item.id}>
                        {item.estimatedAmount} {item.name}
                    </li>
                ))}
            </ul>
        </div>

        <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold">Disposal Tip</h3>
            </CardHeader>
            <CardContent>
                {isFetchingTip ? (
                    <div className="flex items-center text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating a smart tip for you...
                    </div>
                ) : (
                    <p className="text-sm">{disposalTip}</p>
                )}
            </CardContent>
        </Card>

      </CardContent>
      <CardFooter>
        <Button onClick={handleFinish} className="w-full">
            Done
        </Button>
      </CardFooter>
    </Card>
  );
}
