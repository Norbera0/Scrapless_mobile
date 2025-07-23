
'use client';

import { useWasteLogStore } from '@/stores/waste-log-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getImpact, saveWasteLog } from '@/lib/data';
import type { FoodItem, User, WasteLog } from '@/types';
import { Loader2, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import Image from 'next/image';

export function WasteSummary() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [isLoading, setIsLoading] = useState(false);
  const { items, photoDataUri, reset } = useWasteLogStore();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((fbUser) => {
        setUser(fbUser);
    });

    if (items.length === 0) {
        // If there's no data, redirect to start the flow.
        router.replace('/log-waste?method=camera');
    }

    return () => unsubscribe();
  }, [items, router]);

  const impactData = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        const { peso, co2e } = getImpact(item.name);
        // For simplicity, we assume the AI gives a reasonable unit and we calculate per unit.
        // A more complex implementation might parse the amount string.
        acc.totalPesoValue += peso;
        acc.totalCarbonFootprint += co2e;
        return acc;
      },
      { totalPesoValue: 0, totalCarbonFootprint: 0 }
    );
  }, [items]);

  const handleSaveLog = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to save.' });
      return;
    }
    setIsLoading(true);

    const finalItems: FoodItem[] = items.map(item => {
        const { peso, co2e } = getImpact(item.name);
        return {
            ...item,
            pesoValue: peso,
            carbonFootprint: co2e,
        }
    });

    try {
        const logData: Omit<WasteLog, 'id'> = {
          date: new Date().toISOString(),
          userId: user.uid,
          items: finalItems,
          totalPesoValue: impactData.totalPesoValue,
          totalCarbonFootprint: impactData.totalCarbonFootprint,
        };

        if (photoDataUri) {
          logData.photoDataUri = photoDataUri;
        }
        
        await saveWasteLog(logData);

        toast({ title: 'Log saved!', description: 'Your food waste has been successfully logged.' });
        reset(); // Clear the store
        router.push('/trends');
    } catch(e) {
        toast({ variant: 'destructive', title: 'Save failed', description: 'Could not save your log. Please try again.' });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Your Impact</CardTitle>
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
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveLog} className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" /> Save Log & Finish
        </Button>
      </CardFooter>
    </Card>
  );
}
