
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInsightStore } from '@/stores/insight-store';
import type { User } from '@/types';
import { Loader2, Lightbulb, History, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateNewInsight } from '@/app/actions';
import { useAuth } from '@/hooks/use-auth';
import { usePantryLogStore } from '@/stores/pantry-store';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { useToast } from '@/hooks/use-toast';
import { useBpiTrackPlanStore } from '@/stores/bpiTrackPlanStore';


export default function InsightsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuth();
    const { insights, insightsInitialized } = useInsightStore();
    const { liveItems } = usePantryLogStore();
    const { logs } = useWasteLogStore();
    const { isLinked: isBpiLinked, trackPlanData } = useBpiTrackPlanStore();

    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateNew = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
            return;
        }

        setIsGenerating(true);
        try {
            const input = {
                pantryItems: liveItems,
                wasteLogs: logs,
                bpiTrackPlanData: isBpiLinked ? trackPlanData : undefined
            };

            const newInsightId = await generateNewInsight(user as User, input);
            
            toast({
                title: 'New Insight Generated!',
                description: "We've analyzed your latest data.",
            });
            router.push(`/insights/${newInsightId}`);

        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not generate a new insight. Please try again later.',
            });
        } finally {
            setIsGenerating(false);
        }
    };


    // This page is now a hub. It no longer redirects automatically.
    // The user can choose to view their latest insight or generate a new one.
    const latestInsight = insights.length > 0 ? insights[0] : null;

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
                    <p className="text-muted-foreground">
                        Your hub for AI-powered analysis and recommendations.
                    </p>
                </div>
                <div className="flex gap-2">
                     <Button variant="outline" onClick={() => router.push('/insights/history')}>
                        <History className="w-4 h-4 mr-2" />
                        View History
                    </Button>
                    <Button onClick={handleGenerateNew} disabled={isGenerating}>
                        {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                        {isGenerating ? 'Analyzing...' : 'Generate New Insight'}
                    </Button>
                </div>
            </div>

            {(!insightsInitialized || isGenerating) ? (
                <div className="flex h-64 w-full items-center justify-center p-4">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : latestInsight ? (
                 <Card 
                    className="bg-primary/10 border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => router.push(`/insights/${latestInsight.id}`)}
                >
                    <CardHeader>
                        <CardTitle>Latest Insight</CardTitle>
                        <CardDescription>{new Date(latestInsight.date).toLocaleString()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="font-semibold">{latestInsight.patternAlert}</p>
                        <p className="text-sm text-muted-foreground mt-2">{latestInsight.smartTip}</p>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center text-muted-foreground py-10">
                            <Lightbulb className="w-12 h-12 mx-auto mb-4 text-primary/30" />
                            <h3 className="text-lg font-semibold">No insights yet</h3>
                            <p className="text-sm">Click 'Generate New Insight' to get started!</p>
                        </div>
                    </CardContent>
                 </Card>
            )}
        </div>
    );
}
