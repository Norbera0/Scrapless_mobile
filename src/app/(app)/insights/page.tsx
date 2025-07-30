
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInsightStore } from '@/stores/insight-store';
import { type Insight } from '@/types';
import InsightDetailPage from './[id]/page';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function InsightsPage() {
    const router = useRouter();
    const { insights, insightsInitialized } = useInsightStore();
    const [latestInsight, setLatestInsight] = useState<Insight | null>(null);

    useEffect(() => {
        if (insightsInitialized) {
            if (insights.length > 0) {
                // The main /insights page should show the latest one.
                // We can achieve this by replacing the URL without adding to history.
                // The actual rendering will be handled by the [id] page component.
                router.replace(`/insights/${insights[0].id}`);
            } else {
                setLatestInsight(null); // Explicitly set to null if no insights
            }
        }
    }, [insights, insightsInitialized, router]);

    // While waiting for initialization or redirection
    if (!insightsInitialized) {
        return (
            <div className="flex h-full w-full items-center justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    // If initialized but there are no insights, show an empty state.
    if (insightsInitialized && insights.length === 0) {
         return (
            <div className="flex flex-col gap-6 p-4 md:p-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
                    <p className="text-muted-foreground">
                        Your hub for AI-powered analysis and recommendations.
                    </p>
                </div>
                 <Card>
                    <CardContent className="pt-6">
                        <div className="text-center text-muted-foreground py-10">
                            <p>You don't have any insights yet.</p>
                            <p className="text-sm">Log your waste and pantry items to generate your first one!</p>
                             <Button onClick={() => router.push('/log-waste?method=camera')} className="mt-4">
                                Log Waste
                            </Button>
                        </div>
                    </CardContent>
                 </Card>
            </div>
        )
    }

    // This will be shown briefly while the router.replace() is happening.
    // Or if something goes wrong with the redirection logic.
    return (
        <div className="flex h-full w-full items-center justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
}
