
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useInsightStore } from '@/stores/insight-store';
import { Loader2, Lightbulb, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { useBpiTrackPlanStore } from '@/stores/bpiTrackPlanStore';
import { FinancialWellnessDashboard } from '@/components/insights/FinancialWellnessDashboard';
import { startOfMonth } from 'date-fns';
import type { WasteLog } from '@/types';


const calculateMonthlyWaste = (logs: WasteLog[]): number => {
    const startOfCurrentMonth = startOfMonth(new Date());
    return logs
        .filter(log => new Date(log.date) >= startOfCurrentMonth)
        .reduce((sum, log) => sum + log.totalPesoValue, 0);
};


export default function InsightsPage() {
    const router = useRouter();
    const { insights, insightsInitialized } = useInsightStore();
    const { logs, logsInitialized } = useWasteLogStore();
    const { isLinked: isBpiLinked, trackPlanData } = useBpiTrackPlanStore();

    const [isGenerating, setIsGenerating] = useState(false);

    const latestInsight = insights.length > 0 ? insights[0] : null;

    const monthlyWaste = useMemo(() => calculateMonthlyWaste(logs), [logs]);
    
    const bpiDiscretionarySpending = useMemo(() => {
        if (!isBpiLinked || !trackPlanData) return 0;
        return trackPlanData.spendingCategories.reduce((sum, cat) => sum + cat.amount, 0);
    }, [isBpiLinked, trackPlanData]);


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
                </div>
            </div>
            
             {isBpiLinked && (
                <FinancialWellnessDashboard 
                    monthlyWaste={monthlyWaste}
                    bpiDiscretionarySpending={bpiDiscretionarySpending}
                />
            )}


            {(!insightsInitialized || isGenerating || !logsInitialized) ? (
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
                            <p className="text-sm">You'll see AI-powered tips here once you've logged some data.</p>
                        </div>
                    </CardContent>
                 </Card>
            )}
        </div>
    );
}
