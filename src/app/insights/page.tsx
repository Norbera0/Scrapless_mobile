
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInsightStore } from '@/stores/insight-store';
import type { Insight, User } from '@/types';
import { Loader2, Lightbulb, History, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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


    useEffect(() => {
        // This effect redirects to the latest insight if one exists.
        // It no longer shows a loading spinner for the whole page.
        // The page will render its content, and then redirect if needed.
        if (insightsInitialized && insights.length > 0) {
            // Check to avoid redirect loop if already on a detail page that this hub might render behind
            if (!window.location.pathname.startsWith('/insights/')) {
                 router.replace(`/insights/${insights[0].id}`);
            }
        }
    }, [insights, insightsInitialized, router]);

    // This is the content shown when no insights exist OR while the initial check is happening.
    // The redirect effect above will handle navigation if an insight is found.
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
                <div className="flex h-full w-full items-center justify-center p-4">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : insights.length === 0 ? (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center text-muted-foreground py-10">
                            <Lightbulb className="w-12 h-12 mx-auto mb-4 text-primary/30" />
                            <h3 className="text-lg font-semibold">No insights yet</h3>
                            <p className="text-sm">Log your waste and pantry items to generate your first one!</p>
                             <Button onClick={() => router.push('/log-waste?method=camera')} className="mt-4">
                                Log Waste
                            </Button>
                        </div>
                    </CardContent>
                 </Card>
            ) : (
                // When an insight exists, the user will be redirected by the useEffect.
                // This content is a fallback while redirecting.
                <div className="flex h-full w-full items-center justify-center p-4">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="ml-2">Loading your latest insight...</p>
                </div>
            )}
        </div>
    );
}
