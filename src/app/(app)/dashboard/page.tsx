
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, Mic } from 'lucide-react';
import type { User } from '@/types';
import { auth } from '@/lib/firebase';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { isToday } from 'date-fns';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const { logs, setLogs } = useWasteLogStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((fbUser) => {
      setUser(fbUser);
      setIsLoading(!fbUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // The listener in data.ts will populate the store.
    // We just need to know when to stop showing the loader.
    if (user && logs.length > 0) {
      setIsLoading(false);
    }
  }, [user, logs]);


  const todayStats = logs
    .filter(log => isToday(new Date(log.date)))
    .reduce((acc, log) => {
        acc.totalPesoValue += log.totalPesoValue;
        acc.totalCarbonFootprint += log.totalCarbonFootprint;
        return acc;
    }, { totalPesoValue: 0, totalCarbonFootprint: 0 });

  const userName = user?.displayName?.split(' ')[0] || 'there';

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {userName}!</h1>
        <p className="text-muted-foreground">
          Ready to make a difference? Let&apos;s track your food waste.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Impact</CardTitle>
          <CardDescription>Your contribution to a less wasteful world today.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-center">
            {isLoading && logs.length === 0 ? (
                <div className="col-span-2 flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    <div className="bg-secondary p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Peso Value Saved</p>
                        <p className="text-3xl font-bold">₱{todayStats.totalPesoValue.toFixed(2)}</p>
                    </div>
                    <div className="bg-secondary p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">CO₂e Reduced</p>
                        <p className="text-3xl font-bold">{todayStats.totalCarbonFootprint.toFixed(2)}<span className="text-base">kg</span></p>
                    </div>
                </>
            )}
        </CardContent>
      </Card>
        
      <div className="grid md:grid-cols-2 gap-4">
          <Button size="lg" className="h-24 text-lg" onClick={() => router.push('/log-waste?method=camera')}>
            <Camera className="mr-4 h-8 w-8" /> Log with Camera
          </Button>
          <Button size="lg" variant="outline" className="h-24 text-lg" onClick={() => router.push('/log-waste?method=voice')}>
            <Mic className="mr-4 h-8 w-8" /> Log with Voice
          </Button>
      </div>

    </div>
  );
}
