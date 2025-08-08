
'use client';

import { useMemo } from 'react';
import type { WasteLog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { subMonths, isAfter, startOfMonth, differenceInDays, startOfToday } from 'date-fns';

interface TrendsKPIProps {
  logs: WasteLog[];
}

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

export function TrendsKPI({ logs }: TrendsKPIProps) {

    const stats = useMemo(() => {
        const now = new Date();
        const startOfThisMonth = startOfMonth(now);
        const startOfLastMonth = startOfMonth(subMonths(now, 1));

        const thisMonthLogs = logs.filter(log => isAfter(new Date(log.date), startOfThisMonth));
        const lastMonthLogs = logs.filter(log => isAfter(new Date(log.date), startOfLastMonth) && !isAfter(new Date(log.date), startOfThisMonth));

        const thisMonthWaste = thisMonthLogs.reduce((acc, log) => acc + log.totalPesoValue, 0);
        const thisMonthCO2 = thisMonthLogs.reduce((acc, log) => acc + log.totalCarbonFootprint, 0);
        
        const lastMonthWaste = lastMonthLogs.reduce((acc, log) => acc + log.totalPesoValue, 0);
        const lastMonthCO2 = lastMonthLogs.reduce((acc, log) => acc + log.totalCarbonFootprint, 0);
        
        const wasteTrend = lastMonthWaste > 0 ? ((thisMonthWaste - lastMonthWaste) / lastMonthWaste) * 100 : (thisMonthWaste > 0 ? 100 : 0);
        const co2Trend = lastMonthCO2 > 0 ? ((thisMonthCO2 - lastMonthCO2) / lastMonthCO2) * 100 : (thisMonthCO2 > 0 ? 100 : 0);
        
        const threeMonthsAgo = subMonths(now, 3);
        const startOfThreeMonthsAgo = startOfMonth(threeMonthsAgo);
        const last90DaysLogs = logs.filter(log => isAfter(new Date(log.date), threeMonthsAgo));
        const threeMonthsAgoLogs = logs.filter(log => isAfter(new Date(log.date), startOfThreeMonthsAgo) && !isAfter(new Date(log.date), startOfMonth(subMonths(now,2))));

        const wasteLast90Days = last90DaysLogs.reduce((acc, log) => acc + log.totalPesoValue, 0);
        const wasteThreeMonthsAgo = threeMonthsAgoLogs.reduce((acc, log) => acc + log.totalPesoValue, 0);
        const reductionVs90Days = wasteThreeMonthsAgo > 0 ? ((wasteLast90Days - wasteThreeMonthsAgo) / wasteThreeMonthsAgo) * 100 : null;


        let daysSinceLastWaste = -1;
        if (logs.length > 0) {
            const lastLogDate = new Date(logs[0].date); // Assuming logs are sorted descending by date
            daysSinceLastWaste = differenceInDays(startOfToday(), lastLogDate);
        }

        return {
            thisMonthWaste,
            thisMonthCO2,
            wasteTrend,
            co2Trend,
            reductionVs90Days,
            daysSinceLastWaste
        };
    }, [logs]);

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="shadow-md">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">This Month's Waste</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₱{stats.thisMonthWaste.toFixed(0)}</div>
                    <TrendIndicator percentage={stats.wasteTrend} />
                </CardContent>
            </Card>
            <Card className="shadow-md">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">CO₂e Impact</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.thisMonthCO2.toFixed(1)}kg</div>
                     <TrendIndicator percentage={stats.co2Trend} />
                </CardContent>
            </Card>
             <Card className="shadow-md">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Days Since Last Waste</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.daysSinceLastWaste !== -1 ? stats.daysSinceLastWaste : 'N/A'}</div>
                    <p className="text-xs text-muted-foreground">{stats.daysSinceLastWaste !== -1 ? 'Keep it up!' : 'Log waste to start'}</p>
                </CardContent>
            </Card>
            <Card className="shadow-md">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Waste Reduction</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.reductionVs90Days ? `${Math.abs(stats.reductionVs90Days).toFixed(0)}%` : 'N/A'}</div>
                    <p className="text-xs text-muted-foreground">vs 3 months ago</p>
                </CardContent>
            </Card>
        </div>
    );
}
