
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, Tooltip, Pie, PieChart, Cell, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Lightbulb, AlertTriangle, TrendingUp, BarChart2, Brain, CalendarClock, Users, Soup, Bug } from 'lucide-react';
import type { WasteLog } from '@/types';
import { format, subDays, startOfDay, isAfter, endOfDay, eachDayOfInterval, parseISO } from 'date-fns';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { useInsightStore } from '@/stores/insight-store';
import { TrendsKPI } from './TrendsKPI';
import { cn } from '@/lib/utils';

type ChartTimeframe = '7d' | '30d' | '90d';
type ChartMetric = 'totalPesoValue' | 'totalCarbonFootprint';

const COLORS = ['#16a34a', '#f59e0b', '#3b82f6', '#8b5cf6', '#dc2626', '#ec4899'];

const getCategory = (itemName: string): string => {
    const lowerItem = itemName.toLowerCase();
    if (['lettuce', 'tomato', 'potato', 'onion', 'kangkong', 'pechay', 'carrots'].some(v => lowerItem.includes(v))) return 'Vegetables';
    if (['apple', 'banana', 'orange'].some(v => lowerItem.includes(v))) return 'Fruits';
    if (['milk', 'cheese', 'yogurt'].some(v => lowerItem.includes(v))) return 'Dairy';
    if (['bread', 'rice', 'pasta'].some(v => lowerItem.includes(v))) return 'Grains';
    if (['chicken', 'beef', 'pork', 'fish'].some(v => lowerItem.includes(v))) return 'Meat/Fish';
    return 'Other';
};

const reasonIconMap: { [key: string]: React.ElementType } = {
    "Got spoiled/rotten": Bug,
    "Past expiry date": CalendarClock,
    "Forgot about it": Brain,
    "Cooked too much": Soup,
    "Bought too much": Users, 
    "Plans changed": Users,
    "Other reason": Lightbulb,
};


export function TrendsDashboard() {
  const { logs, logsInitialized } = useWasteLogStore();
  const { insights, insightsInitialized } = useInsightStore();
  const [timeframe, setTimeframe] = useState<ChartTimeframe>('7d');
  const [chartMetric, setChartMetric] = useState<ChartMetric>('totalPesoValue');

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
      fullDate: date,
      totalPesoValue: 0,
      totalCarbonFootprint: 0,
    }));

    logs.forEach(log => {
      const logDate = parseISO(log.date);
      if (isAfter(logDate, startDate) || format(logDate, 'yyyy-MM-dd') === format(startDate, 'yyyy-MM-dd')) {
        const formattedDate = format(logDate, 'MMM d');
        const dayData = dailyData.find(d => d.date === formattedDate);
        if (dayData) {
          dayData.totalPesoValue += log.totalPesoValue;
          dayData.totalCarbonFootprint += log.totalCarbonFootprint;
        }
      }
    });

    return dailyData;
  }, [logs, timeframe]);
  
  const tickFormatter = (value: string, index: number) => {
    if (timeframe === '7d') return value;
    const date = parseISO(chartData[index].fullDate.toISOString());
    // Show full date for first, last, and every 7th day for longer ranges
    if (index === 0 || index === chartData.length - 1 || (index + 1) % 7 === 0) {
        return format(date, 'MMM d');
    }
    return format(date, 'd');
  }

  const { categoryData, reasonData } = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    const reasonTotals: Record<string, number> = {};
    let totalWasteValue = 0;

    logs.forEach(log => {
        totalWasteValue += log.totalPesoValue;
        if(log.sessionWasteReason) {
            reasonTotals[log.sessionWasteReason] = (reasonTotals[log.sessionWasteReason] || 0) + log.totalPesoValue;
        }
        log.items.forEach(item => {
            const category = getCategory(item.name);
            categoryTotals[category] = (categoryTotals[category] || 0) + item.pesoValue;
        });
    });

    const categoryData = Object.entries(categoryTotals).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const reasonData = Object.entries(reasonTotals).map(([name, value]) => ({ name, value, percentage: totalWasteValue > 0 ? ((value / totalWasteValue) * 100).toFixed(0) : 0 })).sort((a,b) => b.value - a.value);
    
    return { categoryData, reasonData };
  }, [logs]);
  
  const chartConfig = {
    totalPesoValue: {
      label: "Waste Value (₱)",
      color: "hsl(var(--destructive))",
    },
    totalCarbonFootprint: {
        label: "CO₂e (kg)",
        color: "hsl(var(--primary))",
    }
  }
  
  const categoryChartConfig = {
      value: { label: 'Value' },
      ...categoryData.reduce((acc, cur) => ({...acc, [cur.name]: { label: cur.name, color: COLORS[categoryData.indexOf(cur) % COLORS.length] } }), {}),
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
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-y-4">
            <div className="flex-grow">
                <CardTitle>Waste Impact Over Time</CardTitle>
                <CardDescription>
                    {chartMetric === 'totalPesoValue' ? 'Daily peso value of wasted food' : 'Daily carbon footprint of wasted food'}
                </CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg">
                    <Button
                        size="sm"
                        onClick={() => setChartMetric('totalPesoValue')}
                        className={cn('h-auto px-2 py-1 text-xs', chartMetric === 'totalPesoValue' ? 'bg-background text-destructive shadow' : 'bg-transparent text-muted-foreground hover:bg-background/50')}
                    >
                        ₱ Value
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => setChartMetric('totalCarbonFootprint')}
                        className={cn('h-auto px-2 py-1 text-xs', chartMetric === 'totalCarbonFootprint' ? 'bg-background text-primary shadow' : 'bg-transparent text-muted-foreground hover:bg-background/50')}
                    >
                        CO₂e
                    </Button>
                </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className='flex gap-2'>
                 <Button size="sm" variant={timeframe === '7d' ? 'destructive' : 'outline'} onClick={() => setTimeframe('7d')}>7d</Button>
                 <Button size="sm" variant={timeframe === '30d' ? 'destructive' : 'outline'} onClick={() => setTimeframe('30d')}>30d</Button>
                 <Button size="sm" variant={timeframe === '90d' ? 'destructive' : 'outline'} onClick={() => setTimeframe('90d')}>3m</Button>
            </div>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <LineChart accessibilityLayer data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis 
                        dataKey="date" 
                        tickLine={false} 
                        tickMargin={10} 
                        axisLine={false} 
                        tickFormatter={tickFormatter}
                        interval="auto"
                    />
                    <YAxis tickFormatter={(value) => chartMetric === 'totalPesoValue' ? `₱${value}` : `${value}kg`} />
                    <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                    <Line dataKey={chartMetric} type="monotone" stroke={`var(--color-${chartMetric})`} strokeWidth={3} dot={false} activeDot={{r: 6, fill: `var(--color-${chartMetric})`}} fill={`var(--color-${chartMetric})`} />
                </LineChart>
            </ChartContainer>
        </CardContent>
      </Card>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart2 className="h-5 w-5" />
                        Waste by Food Category
                    </CardTitle>
                    <CardDescription>What you're wasting most</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={categoryChartConfig} className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Tooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                    const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
                                    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                    return ( <text x={x} y={y} fill="currentColor" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs fill-muted-foreground" > {`${(percent * 100).toFixed(0)}%`} </text> );
                                }}>
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Why Food Gets Wasted</CardTitle>
                    <CardDescription>Root cause breakdown</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    {reasonData.length > 0 ? reasonData.map(reason => {
                         const Icon = reasonIconMap[reason.name] || Lightbulb;
                         return (
                            <div key={reason.name} className="flex items-center text-sm py-2 border-b last:border-b-0">
                                <Icon className="h-5 w-5 mr-3 text-muted-foreground" />
                                <span className="flex-1">{reason.name}</span>
                                <div className='text-right'>
                                    <span className='font-semibold text-destructive'>₱{reason.value.toFixed(0)}</span>
                                    <p className='text-xs text-muted-foreground'>{reason.percentage}% of waste</p>
                                </div>
                            </div>
                         );
                    }) : <p className="text-center text-muted-foreground py-10">No reasons logged yet.</p>}
                </CardContent>
            </Card>
        </div>
      
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                AI Waste Insights
            </CardTitle>
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
        <h2 className="text-xl font-semibold mb-4">Recent Waste History</h2>
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

    