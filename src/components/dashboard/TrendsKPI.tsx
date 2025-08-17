
'use client';

import { useMemo } from 'react';
import type { WasteLog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { subDays, isAfter, startOfDay, differenceInDays, parseISO } from 'date-fns';
import { useAnalytics } from '@/hooks/use-analytics';
import { useIsMobile } from '@/hooks/use-mobile';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';

const TrendIndicator = ({ percentage, inverse = false }: { percentage: number | null, inverse?: boolean }) => {
    if (percentage === null || isNaN(percentage) || !isFinite(percentage)) {
        return null;
    }
    const isUp = percentage > 0;
    const colorClass = (isUp && !inverse) || (!isUp && inverse) ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';
    return (
        <div className={`text-xs mt-1 py-0.5 px-1.5 rounded-md inline-block font-medium ${colorClass}`}>
            {isUp ? '↑' : '↓'} {Math.abs(percentage).toFixed(0)}%
        </div>
    );
};

export function TrendsKPI({ logs }: { logs: WasteLog[] }) {

    const analytics = useAnalytics();
    const isMobile = useIsMobile();

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

    const kpiCards = [
        <Card key="waste" className="shadow-md h-32 flex flex-col justify-between">
            <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">This Week's Waste</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
                <div className="text-xl font-bold">
                    {stats.thisWeekWaste.toFixed(0)}
                    <span className="text-sm font-medium text-muted-foreground ml-1">Peso</span>
                </div>
                <TrendIndicator percentage={stats.wasteTrend} />
            </CardContent>
        </Card>,
        <Card key="co2" className="shadow-md h-32 flex flex-col justify-between">
            <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">CO₂e Impact</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
                <div className="text-xl font-bold">
                    {stats.thisWeekCO2.toFixed(1)}
                    <span className="text-sm font-medium text-muted-foreground ml-1">kg</span>
                </div>
                 <p className="text-xs text-muted-foreground mt-1.5">this week</p>
            </CardContent>
        </Card>,
        <Card key="streak" className="shadow-md h-32 flex flex-col justify-between">
            <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">Waste-Free Streak</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
                <div className="text-xl font-bold">
                    {stats.daysSinceLastWaste !== -1 ? stats.daysSinceLastWaste : 'N/A'}
                    {stats.daysSinceLastWaste !== -1 && <span className="text-sm font-medium text-muted-foreground ml-1">days</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">{stats.daysSinceLastWaste === -1 ? 'Log waste to start' : 'since last log'}</p>
            </CardContent>
        </Card>,
        <Card key="rate" className="shadow-md h-32 flex flex-col justify-between">
            <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">Food Success Rate</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
                <div className="text-xl font-bold">
                    {stats.useRate.toFixed(0)}
                    <span className="text-sm font-medium text-muted-foreground ml-1">%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">of items used</p>
            </CardContent>
        </Card>
    ];

    if (isMobile) {
        return (
            <Carousel opts={{ align: "start" }} className="w-full">
                <CarouselContent className="-ml-2">
                    {kpiCards.map((card, index) => (
                        <CarouselItem key={index} className="basis-1/3 pl-2">
                           {card}
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {kpiCards}
        </div>
    );
}
