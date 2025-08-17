
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { useSavingsStore } from '@/stores/savings-store';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { saveSavingsEvent } from '@/lib/data';
import { isAfter, startOfWeek, subWeeks, parseISO, endOfWeek } from 'date-fns';
import { TrendingDown, TrendingUp, CheckCircle, Plus, Gift, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPeso } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function WeeklyPerformancePanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logs } = useWasteLogStore();
  const { savingsEvents, setSavingsEvents } = useSavingsStore();

  const [isClaimed, setIsClaimed] = useState(false);

  const weeklyData = useMemo(() => {
    const now = new Date();
    const startOfThisWeek = startOfWeek(now, { weekStartsOn: 1 });
    const endOfThisWeek = endOfWeek(now, { weekStartsOn: 1 });
    const startOfLastWeek = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const endOfLastWeek = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

    const thisWeekLogs = logs.filter(log => {
      const logDate = parseISO(log.date);
      return isAfter(logDate, startOfThisWeek) && isAfter(endOfThisWeek, logDate);
    });

    const lastWeekLogs = logs.filter(log => {
      const logDate = parseISO(log.date);
      return isAfter(logDate, startOfLastWeek) && isAfter(endOfLastWeek, logDate);
    });
    
    const thisWeekWaste = thisWeekLogs.reduce((acc, log) => acc + log.totalPesoValue, 0);
    const lastWeekWaste = lastWeekLogs.reduce((acc, log) => acc + log.totalPesoValue, 0);

    const difference = lastWeekWaste - thisWeekWaste;
    const percentageChange = lastWeekWaste > 0 ? (difference / lastWeekWaste) * 100 : (difference > 0 ? 100 : 0);

    return {
      thisWeekWaste,
      lastWeekWaste,
      difference,
      percentageChange: -percentageChange, // Invert for display (e.g., -21%)
      weekId: `${startOfThisWeek.getFullYear()}-W${startOfThisWeek.getWeek()}`
    };
  }, [logs]);

  useEffect(() => {
    const claimStatus = localStorage.getItem(`bonusClaimed_${weeklyData.weekId}`);
    if (claimStatus === 'true') {
      setIsClaimed(true);
    } else {
      setIsClaimed(false);
    }
  }, [weeklyData.weekId]);

  const handleClaimBonus = async () => {
    if (!user || weeklyData.difference <= 0) return;

    const newEvent = {
      userId: user.uid,
      date: new Date().toISOString(),
      type: 'waste_reduction' as const,
      amount: weeklyData.difference,
      description: `Bonus for reducing waste by ${formatPeso(weeklyData.difference)} this week.`,
      calculationMethod: `Last Week (₱${weeklyData.lastWeekWaste.toFixed(2)}) - This Week (₱${weeklyData.thisWeekWaste.toFixed(2)})`,
      transferredToBank: false,
    };
    
    try {
      const newId = await saveSavingsEvent(user.uid, newEvent);
      // Manually update local store to reflect change immediately
      setSavingsEvents([...savingsEvents, { ...newEvent, id: newId }]);

      localStorage.setItem(`bonusClaimed_${weeklyData.weekId}`, 'true');
      setIsClaimed(true);
      toast({
        title: "Bonus Claimed!",
        description: `${formatPeso(weeklyData.difference)} has been added to your virtual savings.`,
      });
    } catch(err) {
      console.error("Failed to claim bonus", err);
      toast({ variant: "destructive", title: "Error", description: "Could not claim bonus." });
    }
  };

  const hasImprovement = weeklyData.difference > 0;
  const isWorse = weeklyData.difference < 0;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex justify-between items-center">
            <span>Waste vs Last Week</span>
             <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Compares Mon-Sun waste value.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
            <span className="text-lg font-medium text-muted-foreground">{formatPeso(weeklyData.lastWeekWaste)}</span>
            <span className="text-lg font-bold">▶▶▶</span>
            <span className="text-2xl font-bold">{formatPeso(weeklyData.thisWeekWaste)}</span>
        </div>
        <div className={cn(
            "text-lg font-bold flex items-center justify-center gap-1",
            hasImprovement && 'text-green-600',
            isWorse && 'text-red-600'
        )}>
            {hasImprovement && <TrendingDown />}
            {isWorse && <TrendingUp />}
            <span>({weeklyData.percentageChange > 0 ? '+' : ''}{weeklyData.percentageChange.toFixed(0)}%)</span>
        </div>
        
        <div className="pt-2">
            {hasImprovement ? (
                isClaimed ? (
                    <div className="text-center text-green-700 bg-green-100 p-3 rounded-lg">
                        <p className="font-bold flex items-center justify-center gap-2"><CheckCircle /> {formatPeso(weeklyData.difference)} bonus claimed!</p>
                        <p className="text-xs">Added to your virtual savings.</p>
                    </div>
                ) : (
                    <div className="text-center bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                        <p className="font-bold flex items-center justify-center gap-2 text-yellow-800"><Gift /> Improvement Bonus: {formatPeso(weeklyData.difference)}</p>
                        <Button className="mt-2 w-full" onClick={handleClaimBonus}>
                            <Plus className="mr-2 h-4 w-4" /> Add to Virtual Savings
                        </Button>
                    </div>
                )
            ) : (
                 <p className="text-muted-foreground text-sm font-medium">No bonus this week - let's get back on track! 💪</p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}

// Add getWeek to Date prototype for this component
declare global {
    interface Date {
        getWeek(): number;
    }
}

Date.prototype.getWeek = function() {
    var date = new Date(this.getTime());
    date.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year.
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    // January 4 is always in week 1.
    var week1 = new Date(date.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}
