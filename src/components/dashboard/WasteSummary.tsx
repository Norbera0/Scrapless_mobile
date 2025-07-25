
'use client';

import { useWasteLogStore } from '@/stores/waste-log-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getImpact, saveWasteLog } from '@/lib/data';
import type { FoodItem, User, WasteLog } from '@/types';
import { Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import Image from 'next/image';

export function WasteSummary() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(auth.currentUser);
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
        acc.totalPesoValue += peso;
        acc.totalCarbonFootprint += co2e;
        return acc;
      },
      { totalPesoValue: 0, totalCarbonFootprint: 0 }
    );
  }, [items]);

  const handleSaveLog = () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to save.' });
      return;
    }

    const finalItems: FoodItem[] = items.map(item => {
        const { peso, co2e } = getImpact(item.name);
        return {
            ...item,
            pesoValue: peso,
            carbonFootprint: co2e,
        }
    });

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
    
    // Optimistic UI: Redirect immediately.
    toast({ title: 'Log saved!', description: 'Your food waste has been successfully logged.' });
    reset(); // Clear the store for the next log
    router.push('/dashboard');
    
    // Save to Firestore in the background
    saveWasteLog(logData).catch(e => {
        console.error(e);
        toast({ variant: 'destructive', title: 'Sync failed', description: 'Could not save your log to the cloud. Please try again later.' });
    });
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
        <Button onClick={handleSaveLog} className="w-full">
            <Save className="mr-2 h-4 w-4" /> Save Log & Finish
        </Button>
      </CardFooter>
    </Card>
  );
}
