
'use client';

import { useMemo } from 'react';
import type { WasteLog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { subDays, isAfter, startOfDay, differenceInDays, parseISO } from 'date-fns';
import { useAnalytics } from '@/hooks/use-analytics';
import { useIsMobile } from '@/hooks/use-mobile';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Info } from 'lucide-react';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
            <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                    <span>This Week's Waste</span>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="w-3 h-3 cursor-pointer" />
                            </TooltipTrigger>
                            <TooltipContent className="w-56 text-center">
                                <p>Total estimated peso value of all food logged as waste in the last 7 days.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
                <div className="text-xl font-bold">
                    ₱{stats.thisWeekWaste.toFixed(0)}
                </div>
                <TrendIndicator percentage={stats.wasteTrend} />
            </CardContent>
        </Card>,
        <Card key="co2" className="shadow-md h-32 flex flex-col justify-between">
            <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                   <span>CO₂e Impact</span>
                     <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="w-3 h-3 cursor-pointer" />
                            </TooltipTrigger>
                            <TooltipContent className="w-56 text-center">
                                <p>Total carbon dioxide equivalent emitted from this week's food waste.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
                <div className="text-xl font-bold">
                    {stats.thisWeekCO2.toFixed(1)}
                    <span className="text-sm font-medium text-muted-foreground ml-1">kg</span>
                </div>
                 <p className="text-xs text-muted-foreground mt-1.5">this week</p>
            </CardContent>
        </Card>,
        <Card key="streak" className="shadow-md h-32 flex flex-col justify-between">
            <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                    <span>Waste-Free Streak</span>
                     <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="w-3 h-3 cursor-pointer" />
                            </TooltipTrigger>
                            <TooltipContent className="w-56 text-center">
                                <p>The number of full days that have passed since your last recorded food waste.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
                <div className="text-xl font-bold">
                    {stats.daysSinceLastWaste !== -1 ? stats.daysSinceLastWaste : 'N/A'}
                    {stats.daysSinceLastWaste !== -1 && <span className="text-sm font-medium text-muted-foreground ml-1">days</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">{stats.daysSinceLastWaste === -1 ? 'Log waste to start' : 'since last log'}</p>
            </CardContent>
        </Card>,
        <Card key="rate" className="shadow-md h-32 flex flex-col justify-between">
            <CardHeader className="pb-2 pt-3 px-3">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                    <span>Food Success Rate</span>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="w-3 h-3 cursor-pointer" />
                            </TooltipTrigger>
                            <TooltipContent className="w-56 text-center">
                                <p>The percentage of items you have successfully used versus those that were wasted.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
                <div className="text-xl font-bold">
                    {stats.useRate.toFixed(0)}
                    <span className="text-sm font-medium text-muted-foreground ml-1">%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">of items used</p>
            </CardContent>
        </Card>
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {kpiCards}
        </div>
    );
}
