
'use client';

import { useMemo } from 'react';
import type { WasteLog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { subDays, isAfter, startOfDay, differenceInDays, parseISO } from 'date-fns';
import { useAnalytics } from '@/hooks/use-analytics';

const TrendIndicator = ({ percentage, inverse = false }: { percentage: number | null, inverse?: boolean }) => {
    if (percentage === null || isNaN(percentage) || !isFinite(percentage)) {
        return null;
    }
    const isUp = percentage > 0;
    const colorClass = (isUp && !inverse) || (!isUp && inverse) ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';
    return (
        <div className={`text-xs mt-1.5 py-0.5 px-1.5 rounded-md inline-block font-medium ${colorClass}`}>
            {isUp ? '↑' : '↓'} {Math.abs(percentage).toFixed(0)}%
        </div>
    );
};

export function TrendsKPI({ logs }: { logs: WasteLog[] }) {

    const analytics = useAnalytics();

    const stats = useMemo(() => {
        const now = new Date();
        const startOfThisWeek = startOfDay(subDays(now, 7));
        const startOfLastWeek = startOfDay(subDays(now, 14));

        const thisWeekLogs = logs.filter(log => isAfter(parseISO(log.date), startOfThisWeek));
        const lastWeekLogs = logs.filter(log => isAfter(parseISO(log.date), startOfLastWeek) && !isAfter(parseISO(log.date), startOfThisWeek));

        const thisWeekWaste = thisWeekLogs.reduce((acc, log) => acc + log.totalPesoValue, 0);
        const thisWeekCO2 = thisWeekLogs.reduce((acc, log) => acc + log.totalCarbonFootprint, 0);
        
        const lastWeekWaste = lastWeekLogs.reduce((acc, log) => acc + log.totalPesoValue, 0);

        const wasteTrend = lastWeekWaste > 0 ? ((thisWeekWaste - lastWeekWaste) / lastWeekWaste) * 100 : (thisWeekWaste > 0 ? 100 : 0);

        let daysSinceLastWaste = -1;
        if (logs.length > 0) {
            const lastLogDate = new Date(logs[0].date); // Assuming logs are sorted descending by date
            daysSinceLastWaste = differenceInDays(startOfDay(now), lastLogDate);
        }

        return {
            thisWeekWaste,
            thisWeekCO2,
            wasteTrend,
            daysSinceLastWaste,
            useRate: analytics?.useRate ?? 0,
        };
    }, [logs, analytics]);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="shadow-md">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">This Week's Waste</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₱{stats.thisWeekWaste.toFixed(0)}</div>
                    <TrendIndicator percentage={stats.wasteTrend} />
                </CardContent>
            </Card>
            <Card className="shadow-md">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">CO₂e Impact</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.thisWeekCO2.toFixed(1)}kg</div>
                     <p className="text-xs text-muted-foreground">this week</p>
                </CardContent>
            </Card>
             <Card className="shadow-md">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Waste-Free Streak</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.daysSinceLastWaste !== -1 ? stats.daysSinceLastWaste : 'N/A'}</div>
                    <p className="text-xs text-muted-foreground">{stats.daysSinceLastWaste !== -1 ? 'days' : 'Log waste to start'}</p>
                </CardContent>
            </Card>
            <Card className="shadow-md">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Food Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.useRate.toFixed(0)}%</div>
                    <p className="text-xs text-muted-foreground">of items used</p>
                </CardContent>
            </Card>
        </div>
    );
}
