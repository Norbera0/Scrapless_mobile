
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, Lightbulb, AlertTriangle } from 'lucide-react';
import { deleteWasteLog } from '@/lib/data';
import type { User, WasteLog } from '@/types';
import { format, subDays, startOfDay, isAfter, endOfDay, eachDayOfInterval, parseISO } from 'date-fns';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { useInsightStore } from '@/stores/insight-store';
import { TrendsKPI } from './TrendsKPI';
import { PantryHealthScore } from './PantryHealthScore';

type ChartTimeframe = '7d' | '30d' | '90d';

export function TrendsDashboard() {
  const { user } = useAuth();
  const { logs, logsInitialized } = useWasteLogStore();
  const { insights, insightsInitialized } = useInsightStore();
  const { toast } = useToast();
  const [timeframe, setTimeframe] = useState<ChartTimeframe>('7d');

  const handleDelete = async (logId: string) => {
    if(!user) return;
    try {
        await deleteWasteLog(user.uid, logId);
        toast({ title: 'Success', description: 'Log deleted successfully.' });
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete log.' });
    }
  }
  
  const getDaysFromTimeframe = (tf: ChartTimeframe) => {
      switch(tf) {
          case '30d': return 30;
          case '90d': return 90;
          default: return 7;
      }
  }

  const chartData = useMemo(() => {
    const days = getDaysFromTimeframe(timeframe);
    const startDate = startOfDay(subDays(new Date(), days - 1));
    const endDate = endOfDay(new Date());

    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

    const dailyData = dateRange.map(date => ({
      date: format(date, 'MMM d'),
      totalPesoValue: 0,
    }));

    logs.forEach(log => {
      const logDate = parseISO(log.date);
      if (isAfter(logDate, startDate) || format(logDate, 'yyyy-MM-dd') === format(startDate, 'yyyy-MM-dd')) {
        const formattedDate = format(logDate, 'MMM d');
        const dayData = dailyData.find(d => d.date === formattedDate);
        if (dayData) {
          dayData.totalPesoValue += log.totalPesoValue;
        }
      }
    });

    return dailyData;
  }, [logs, timeframe]);
  
  const chartConfig = {
    totalPesoValue: {
      label: "Peso Value (₱)",
      color: "hsl(var(--destructive))",
    },
  }
  
  const latestInsight = insights.length > 0 ? insights[0] : null;

  if (!logsInitialized || !insightsInitialized) {
      return (
        <div className="flex h-64 w-full items-center justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )
  }

  return (
    <div className="grid gap-6">
        <TrendsKPI logs={logs} />
    
      <Card>
        <CardHeader>
          <CardTitle>Waste Value Trends</CardTitle>
          <CardDescription>Daily peso value of wasted food</CardDescription>
        </CardHeader>
        <CardContent>
            <div className='flex gap-2 mb-4'>
                 <Button size="sm" variant={timeframe === '7d' ? 'default' : 'outline'} onClick={() => setTimeframe('7d')}>7 Days</Button>
                 <Button size="sm" variant={timeframe === '30d' ? 'default' : 'outline'} onClick={() => setTimeframe('30d')}>30 Days</Button>
                 <Button size="sm" variant={timeframe === '90d' ? 'default' : 'outline'} onClick={() => setTimeframe('90d')}>3 Months</Button>
            </div>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <LineChart accessibilityLayer data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="date"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                    />
                    <YAxis
                        tickFormatter={(value) => `₱${value}`}
                    />
                    <Tooltip
                        content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Line dataKey="totalPesoValue" type="monotone" stroke="var(--color-totalPesoValue)" strokeWidth={3} dot={{r: 6, fill: 'var(--color-totalPesoValue)'}} fill="var(--color-totalPesoValue)" />
                </LineChart>
            </ChartContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>AI Insights & Predictions</CardTitle>
            <CardDescription>Smart patterns & predictions from your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {latestInsight ? (
                <>
                    {latestInsight.predictionAlertBody && (
                         <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5"/>
                                <div>
                                    <h3 className="font-semibold text-blue-800">Prediction Alert</h3>
                                    <p className="text-sm text-blue-700">{latestInsight.predictionAlertBody}</p>
                                </div>
                            </div>
                        </div>
                    )}
                     <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-lg">
                         <div className="flex items-start gap-3">
                            <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5"/>
                            <div>
                                <h3 className="font-semibold text-amber-800">Pattern Detected</h3>
                                <p className="text-sm text-amber-700">{latestInsight.patternAlert}</p>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <p className="text-center text-muted-foreground py-4">No insights generated yet. Keep logging to see AI-powered tips!</p>
            )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Waste Logs</h2>
        <div className="space-y-3">
          {logs.length > 0 ? (
            logs.slice(0, 5).map(log => (
              <Card key={log.id} className="overflow-hidden">
                <div className="flex items-center p-4">
                    {log.photoDataUri ? (
                         <Image src={log.photoDataUri} alt="Wasted food" width={48} height={48} className="rounded-lg mr-4 object-cover" data-ai-hint="food waste" />
                    ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xl mr-4">
                            <span>{log.items[0]?.name.charAt(0) || '📝'}</span>
                        </div>
                    )}
                    <div className="flex-1">
                        <p className="font-semibold truncate">{log.items.map(i => i.name).join(', ')}</p>
                        <p className="text-sm text-muted-foreground">{format(new Date(log.date), 'MMM d, h:mm a')} • {log.sessionWasteReason}</p>
                    </div>
                    <div className='text-right ml-4'>
                        <p className="font-bold text-destructive">₱{log.totalPesoValue.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{log.totalCarbonFootprint.toFixed(2)}kg CO₂e</p>
                    </div>
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-8">No waste logs yet. Go to the "Log Waste" page to add your first entry.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
