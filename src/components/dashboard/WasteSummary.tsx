
'use client';

import { useWasteLogStore } from '@/stores/waste-log-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { saveWasteLog } from '@/lib/data';
import type { FoodItem, User, WasteLog } from '@/types';
import { Save, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import Image from 'next/image';
import { FOOD_DATA_MAP } from '@/lib/food-data';

export function WasteSummary() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [isSaving, setIsSaving] = useState(false);
  const { items, photoDataUri, reset } = useWasteLogStore();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((fbUser) => {
        setUser(fbUser);
    });

    if (items.length === 0) {
        router.replace('/log-waste?method=camera');
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
    router.push('/my-waste');
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
      </CardContent>
      <CardFooter>
        <Button onClick={handleFinish} className="w-full">
            Done
        </Button>
      </CardFooter>
    </Card>
  );
}
