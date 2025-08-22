
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCoachStore } from '@/stores/coach-store';
import { useAnalytics } from '@/hooks/use-analytics';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Loader2, Sparkles, Lightbulb, ArrowRight, RefreshCw } from 'lucide-react';
import { getCoachAdvice } from '@/app/actions';
import type { KitchenCoachInput } from '@/ai/schemas';
import { useToast } from '@/hooks/use-toast';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { usePantryLogStore } from '@/stores/pantry-store';
import { useSavingsStore } from '@/stores/savings-store';
import { formatDistanceToNow, isBefore, parseISO } from 'date-fns';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export function KitchenCoachPanel() {
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const analytics = useAnalytics();
    
    // Data stores for AI context
    const { logs } = useWasteLogStore();
    const { liveItems, archivedItems } = usePantryLogStore();
    const { savingsEvents } = useSavingsStore();

    // Zustand store for coach state
    const {
        analysis: lastTip,
        lastGenerated,
        isGenerating,
        setAnalysis: setLastTip,
        setIsGenerating,
    } = useCoachStore();

    const handleGenerateTip = async () => {
        if (isGenerating || !user || !analytics) return;

        setIsGenerating(true);
        try {
            const input: KitchenCoachInput = {
                 summaryMetrics: {
                    pantryHealthScore: analytics.pantryHealthScore,
                    totalVirtualSavings: analytics.totalVirtualSavings,
                    totalWasteValue: analytics.totalWasteValue,
                    engagementScore: analytics.engagementScore,
                    weather: analytics.weather,
                    waste: analytics.waste,
                    pantry: analytics.pantry,
                    savings: {
                        useRate: analytics.useRate,
                        savingsPerWastePeso: analytics.savingsPerWastePeso,
                    }
                },
                rawData: {
                    recentWasteLogs: logs.slice(0, 10).map(l => ({ date: l.date, items: l.items.map(i => ({name: i.name, pesoValue: i.pesoValue})), sessionWasteReason: l.sessionWasteReason })),
                    recentPantryLogs: liveItems.slice(0,10).map(i => ({ date: i.addedDate, items: [{name: i.name, estimatedCost: i.estimatedCost }]})),
                    recentUsageLogs: archivedItems.filter(i => i.status === 'used').slice(0, 5).map(i => ({ name: i.name, dateAdded: i.addedDate, dateUsed: i.usedDate })),
                    recentSavingsEvents: savingsEvents.slice(0,5).map(e => ({ type: e.type, amount: e.amount, date: e.date, description: e.description })),
                }
            };

            const tip = await getCoachAdvice(input);
            setLastTip(tip);
            toast({ title: "Fresh tip from your coach!", description: "A new insight has been generated." });
        } catch (error) {
            console.error("Failed to get coach advice:", error);
            toast({ variant: 'destructive', title: "Coach is Busy", description: "Could not get advice right now. Please try again later." });
        } finally {
            setIsGenerating(false);
        }
    };
    
    useEffect(() => {
        // Automatically generate a tip on first load if none exists or if it's stale
        if (!lastTip && !isGenerating && analytics) {
            handleGenerateTip();
        }
    }, [analytics, lastTip, isGenerating]);

    const canRefresh = (() => {
        if (!lastGenerated) return true;
        const oneHourAgo = new Date(new Date().getTime() - 60 * 60 * 1000);
        return isBefore(parseISO(lastGenerated), oneHourAgo);
    })();

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <DotLottieReact
                      src="https://lottie.host/55c18eb1-89f2-4916-8211-c063d81a959d/Xf9C5RWU4z.lottie"
                      loop
                      autoplay
                      style={{ width: '50px', height: '50px' }}
                    />
                    Your Kitchen Coach
                </CardTitle>
                <CardDescription className="text-xs">
                    {lastGenerated && (
                        <span className="block text-xs mt-1">
                            Last updated: {formatDistanceToNow(new Date(lastGenerated), { addSuffix: true })}
                        </span>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent className="min-h-[150px]">
                {isGenerating && !lastTip ? (
                     <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-6">
                        <Loader2 className="w-10 h-10 mx-auto mb-3 animate-spin" />
                        <p className="font-semibold">Consulting your coach...</p>
                    </div>
                ) : lastTip ? (
                    <div className="space-y-4">
                        <div className="bg-secondary/50 rounded-xl p-4 border">
                            <p className="text-muted-foreground text-sm font-medium">{lastTip.title}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                             <Button 
                                variant="default"
                                className="h-11 flex-1"
                                onClick={() => router.push('/kitchen-coach')}
                            >
                                Get Full Advice
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                             <Button 
                                variant="outline"
                                className="h-11 flex-1"
                                onClick={handleGenerateTip}
                                disabled={!canRefresh || isGenerating}
                            >
                                {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                {canRefresh ? 'Refresh Tip' : 'Next tip soon'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-6">
                        <Lightbulb className="w-10 h-10 mx-auto mb-3" />
                        <p className="font-semibold">No tips available right now</p>
                        <p className="text-sm">Try adding items to your pantry or logging waste.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
