
'use client';

import { useMemo } from 'react';
import type { WasteLog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { subMonths, isAfter, startOfMonth } from 'date-fns';
import { usePantryLogStore } from '@/stores/pantry-store';

interface TrendsKPIProps {
  logs: WasteLog[];
}

const TrendIndicator = ({ percentage }: { percentage: number | null }) => {
    if (percentage === null || isNaN(percentage) || !isFinite(percentage)) {
        return null;
    }
    const isUp = percentage > 0;
    const colorClass = isUp ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';
    return (
        <div className={`text-xs mt-1.5 py-0.5 px-1.5 rounded-md inline-block font-medium ${colorClass}`}>
            {isUp ? '↑' : '↓'} {Math.abs(percentage).toFixed(0)}%
        </div>
    );
};

export function TrendsKPI({ logs }: TrendsKPIProps) {
    const { liveItems } = usePantryLogStore();

    const stats = useMemo(() => {
        const now = new Date();
        const startOfThisMonth = startOfMonth(now);
        const startOfLastMonth = startOfMonth(subMonths(now, 1));
        const startOfTwoMonthsAgo = startOfMonth(subMonths(now, 2));

        const thisMonthLogs = logs.filter(log => isAfter(new Date(log.date), startOfThisMonth));
        const lastMonthLogs = logs.filter(log => isAfter(new Date(log.date), startOfLastMonth) && !isAfter(new Date(log.date), startOfThisMonth));

        const thisMonthWaste = thisMonthLogs.reduce((acc, log) => acc + log.totalPesoValue, 0);
        const thisMonthCO2 = thisMonthLogs.reduce((acc, log) => acc + log.totalCarbonFootprint, 0);
        
        const lastMonthWaste = lastMonthLogs.reduce((acc, log) => acc + log.totalPesoValue, 0);
        const lastMonthCO2 = lastMonthLogs.reduce((acc, log) => acc + log.totalCarbonFootprint, 0);
        
        const wasteTrend = lastMonthWaste > 0 ? ((thisMonthWaste - lastMonthWaste) / lastMonthWaste) * 100 : null;
        const co2Trend = lastMonthCO2 > 0 ? ((thisMonthCO2 - lastMonthCO2) / lastMonthCO2) * 100 : null;
        
        const threeMonthsAgo = subMonths(now, 3);
        const last90DaysLogs = logs.filter(log => isAfter(new Date(log.date), threeMonthsAgo));
        const wasteLast90Days = last90DaysLogs.reduce((acc, log) => acc + log.totalPesoValue, 0);

        const highRiskItems = liveItems.filter(item => {
            const expiry = new Date(item.estimatedExpirationDate);
            const daysLeft = (expiry.getTime() - now.getTime()) / (1000 * 3600 * 24);
            return daysLeft >= 0 && daysLeft <= 3;
        }).length;

        return {
            thisMonthWaste,
            thisMonthCO2,
            wasteTrend,
            co2Trend,
            wasteLast90Days,
            highRiskItems
        };
    }, [logs, liveItems]);

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
                    <CardTitle className="text-sm font-medium text-muted-foreground">CO₂e Footprint</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.thisMonthCO2.toFixed(1)}kg</div>
                     <TrendIndicator percentage={stats.co2Trend} />
                </CardContent>
            </Card>
            <Card className="shadow-md">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">90-Day Waste</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₱{stats.wasteLast90Days.toFixed(0)}</div>
                    <p className="text-xs text-muted-foreground">Total over last 3 months</p>
                </CardContent>
            </Card>
            <Card className="shadow-md">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">High-Risk Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.highRiskItems}</div>
                    <p className="text-xs text-muted-foreground">Expiring in next 3 days</p>
                </CardContent>
            </Card>
        </div>
    );
}
