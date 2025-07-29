
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, Mic, Sparkles, AlertTriangle, Lightbulb } from 'lucide-react';
import type { User } from '@/types';
import { auth } from '@/lib/firebase';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { usePantryLogStore } from '@/stores/pantry-store';
import { isToday } from 'date-fns';
import { analyzeConsumptionPatterns } from '@/ai/flows/analyze-consumption-patterns';
import { type AnalyzeConsumptionPatternsOutput } from '@/ai/schemas';

function AiInsightCard() {
    const [insight, setInsight] = useState<AnalyzeConsumptionPatternsOutput | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = auth;
    const { logs } = useWasteLogStore();
    const { liveItems } = usePantryLogStore();

    useEffect(() => {
        const fetchInsights = async () => {
            if (user) {
                try {
                    const result = await analyzeConsumptionPatterns({
                        userName: user.displayName?.split(' ')[0] || 'User',
                        pantryItems: liveItems.map(item => ({
                            name: item.name,
                            estimatedExpirationDate: item.estimatedExpirationDate,
                            estimatedAmount: item.estimatedAmount
                        })),
                        wasteLogs: logs,
                    });
                    setInsight(result);
                } catch (error) {
                    console.error("Failed to fetch AI insights:", error);
                    setInsight(null); // Clear insight on error
                } finally {
                    setIsLoading(false);
                }
            }
        };
        // Fetch insights only when there's a user and some data to analyze
        if(user && (logs.length > 0 || liveItems.length > 0)) {
            fetchInsights();
        } else if (user) {
            // Handle case for new user with no data yet
            setIsLoading(false);
            setInsight({
                keyObservation: "Welcome to your AI-powered dashboard!",
                patternAlert: "Start by adding items to your pantry or logging waste.",
                smartTip: "The more you log, the smarter your insights will become!",
            });
        }
    }, [user, logs, liveItems]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-primary" />
                    This Week's Insights
                </CardTitle>
                <CardDescription>AI-powered tips to help you reduce waste.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : insight ? (
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 flex-shrink-0">
                                <Sparkles className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">{insight.keyObservation}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-1 flex-shrink-0">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">Pattern Alert</p>
                                <p className="text-sm text-muted-foreground">{insight.patternAlert}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-1 flex-shrink-0">
                                <Lightbulb className="h-5 w-5 text-yellow-500" />
                            </div>
                            <div>
                                <p className="font-semibold text-foreground">Smart Tip</p>
                                <p className="text-sm text-muted-foreground">{insight.smartTip}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground p-4">
                        Could not load insights at the moment.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}


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

      <AiInsightCard />

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
