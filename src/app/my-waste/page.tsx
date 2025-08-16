

'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, Tooltip, Pie, PieChart, Cell, ResponsiveContainer, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Lightbulb, AlertTriangle, TrendingUp, BarChart2, Brain, CalendarClock, Users, Soup, MessageCircleQuestion, Plus, ShoppingCart, Utensils, ThumbsDown, Leaf, Sprout, Apple, Drumstick, Fish, Beef, Wheat, Sandwich, IceCream, Star, Flame, Package, Trash, Clock, ChevronLeft, ChevronRight, History, RefreshCw, Camera, Mic, Type } from 'lucide-react';
import type { WasteLog } from '@/types';
import { format, subDays, startOfDay, isAfter, endOfDay, eachDayOfInterval, parseISO, isSameDay, addDays } from 'date-fns';
import Image from 'next/image';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { TrendsKPI } from '@/components/dashboard/TrendsKPI';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeWastePatterns } from '../actions';
import type { AnalyzeWastePatternsOutput } from '@/ai/schemas';
import { useWasteInsightStore } from '@/stores/waste-insight-store';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

type ChartTimeframe = '7d' | '15d' | '30d';
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
  "Got spoiled/rotten": ThumbsDown,
  "Past expiry date": CalendarClock,
  "Forgot about it": Brain,
  "Cooked too much": Soup,
  "Bought too much": ShoppingCart, 
  "Plans changed": MessageCircleQuestion,
  "Other reason": Lightbulb,
};


export default function MyWastePage() {
  const router = useRouter();
  const { logs, logsInitialized } = useWasteLogStore();
  const [timeframe, setTimeframe] = useState<ChartTimeframe>('7d');
  const [chartMetric, setChartMetric] = useState<ChartMetric>('totalPesoValue');
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const { insight, setInsight } = useWasteInsightStore();
  const isMobile = useIsMobile();
  const [isLogMethodOpen, setIsLogMethodOpen] = useState(false);

  const getDaysFromTimeframe = (tf: ChartTimeframe) => {
      switch(tf) {
          case '15d': return 15;
          case '30d': return 30;
          default: return 7;
      }
  }

  const chartData = useMemo(() => {
    const days = getDaysFromTimeframe(timeframe);
    const startDate = startOfDay(subDays(new Date(), days - 1));
    const endDate = endOfDay(new Date());
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

    const dailyData = dateRange.map(date => ({
      date: format(date, 'E'), // Use abbreviated day name
      fullDate: date,
      totalPesoValue: 0,
      totalCarbonFootprint: 0,
    }));

    logs.forEach(log => {
      const logDate = parseISO(log.date);
      if (isAfter(logDate, startDate) || format(logDate, 'yyyy-MM-dd') === format(startDate, 'yyyy-MM-dd')) {
        const dayData = dailyData.find(d => isSameDay(d.fullDate, logDate));
        if (dayData) {
          dayData.totalPesoValue += log.totalPesoValue;
          dayData.totalCarbonFootprint += log.totalCarbonFootprint;
        }
      }
    });

    return dailyData;
  }, [logs, timeframe]);
  
  const tickFormatter = (value: string, index: number) => {
    const dataLength = chartData.length;
    // For mobile on long timeframes, show fewer labels to prevent overlap
    if (isMobile && dataLength > 14) {
       if (index % 3 === 0) { // Show roughly every 3rd day
           return value;
       }
       return "";
    }
    return value;
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
    const reasonData = Object.entries(reasonTotals).map(([name, value, percentage]) => ({ name, value, percentage: totalWasteValue > 0 ? ((value / totalWasteValue) * 100).toFixed(0) : 0 })).sort((a,b) => b.value - a.value);
    
    return { categoryData, reasonData };
  }, [logs]);
  
  const handleFetchPattern = async () => {
    setIsLoadingInsight(true);
    setInsight(null);
    try {
        const result = await analyzeWastePatterns({ wasteLogs: logs });
        setInsight(result);
    } catch(e) {
        console.error("Failed to analyze waste patterns", e);
        // Optionally show a toast error
    } finally {
        setIsLoadingInsight(false);
    }
  }

  const handleMethodSelect = (method: 'camera' | 'voice' | 'text') => {
    setIsLogMethodOpen(false);
    router.push(`/log-waste?method=${method}`);
  };


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

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 bg-gray-50">
       <div className="flex flex-row flex-wrap items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
                  <BarChart2 className="w-8 h-8 text-primary" />
                  My Waste Impact
                </h1>
                <p className="text-muted-foreground text-sm md:text-base">
                    Track your patterns, reduce waste, spend less
                </p>
            </div>
            <Popover open={isLogMethodOpen} onOpenChange={setIsLogMethodOpen}>
              <PopoverTrigger asChild>
                <Button className="whitespace-nowrap bg-primary hover:bg-primary/90 h-11 text-base">
                    <Trash className="w-5 h-5 mr-2" />
                    <span>Log Waste</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-primary">
                <div className="flex flex-col">
                  <Button variant="ghost" className="justify-start text-primary-foreground hover:bg-white/20" onClick={() => handleMethodSelect('camera')}>
                    <Camera className="w-4 h-4 mr-2" /> Scan with Camera
                  </Button>
                  <Separator className="my-1 bg-white/20" />
                  <Button variant="ghost" className="justify-start text-primary-foreground hover:bg-white/20" onClick={() => handleMethodSelect('voice')}>
                    <Mic className="w-4 h-4 mr-2" /> Use Voice Log
                  </Button>
                  <Separator className="my-1 bg-white/20" />
                  <Button variant="ghost" className="justify-start text-primary-foreground hover:bg-white/20" onClick={() => handleMethodSelect('text')}>
                    <Type className="w-4 h-4 mr-2" /> Type Manually
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
        </div>

      {!logsInitialized ? (
          <div className="flex h-64 w-full items-center justify-center p-4">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-6">
              <TrendsKPI logs={logs} />
            
              <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                  <div className="flex-grow">
                    <CardTitle className="text-base sm:text-lg">Waste Impact Over Time</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {chartMetric === 'totalPesoValue'
                        ? 'Daily peso value of wasted food'
                        : 'Daily carbon footprint of wasted food'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg">
                      <Button
                        size="sm"
                        onClick={() => setChartMetric('totalPesoValue')}
                        className={cn(
                          'h-auto px-2 py-1 text-xs',
                          chartMetric === 'totalPesoValue'
                            ? 'bg-background text-destructive shadow'
                            : 'bg-transparent text-muted-foreground hover:bg-background/50'
                        )}
                      >
                        ₱ Value
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setChartMetric('totalCarbonFootprint')}
                        className={cn(
                          'h-auto px-2 py-1 text-xs',
                          chartMetric === 'totalCarbonFootprint'
                            ? 'bg-background text-primary shadow'
                            : 'bg-transparent text-muted-foreground hover:bg-background/50'
                        )}
                      >
                        CO₂e
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={timeframe === '7d' ? 'destructive' : 'outline'}
                      onClick={() => setTimeframe('7d')}
                    >
                      7d
                    </Button>
                    <Button
                      size="sm"
                      variant={timeframe === '15d' ? 'destructive' : 'outline'}
                      onClick={() => setTimeframe('15d')}
                    >
                      15d
                    </Button>
                    <Button
                      size="sm"
                      variant={timeframe === '30d' ? 'destructive' : 'outline'}
                      onClick={() => setTimeframe('30d')}
                    >
                      30d
                    </Button>
                  </div>

                  <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] w-full">
                    <LineChart accessibilityLayer data={chartData}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={tickFormatter}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tickFormatter={(value) =>
                          chartMetric === 'totalPesoValue' ? `₱${value}` : `${value}kg`
                        }
                      />
                      <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                      <Line
                        dataKey={chartMetric}
                        type="monotone"
                        stroke={`var(--color-${chartMetric})`}
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6, fill: `var(--color-${chartMetric})` }}
                        fill={`var(--color-${chartMetric})`}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart2 className="h-5 w-5" />
                            Waste by Food Category
                        </CardTitle>
                        <CardDescription>What you're wasting most</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex items-center justify-center">
                        <ChartContainer config={categoryChartConfig} className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Tooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={isMobile ? 60 : 80} fill="#8884d8" label={false} labelLine={false}>
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Legend
                                      layout={isMobile ? 'horizontal' : 'vertical'}
                                      verticalAlign={isMobile ? 'bottom' : 'middle'}
                                      align={isMobile ? 'center' : 'right'}
                                      iconSize={10}
                                      wrapperStyle={isMobile ? { fontSize: '12px' } : { paddingLeft: '20px', fontSize: '14px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>

                  <Card className="flex flex-col min-h-[400px]">
                      <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Brain className="h-5 w-5" />
                            Why Food Gets Wasted
                          </CardTitle>
                          <CardDescription>Root cause breakdown</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 flex-1">
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
              <CardHeader className="flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5" />
                        Waste Pattern
                    </CardTitle>
                    <CardDescription>Smart patterns & predictions from your data</CardDescription>
                  </div>
                   {insight && (
                        <Button variant="outline" size="sm" onClick={handleFetchPattern} disabled={isLoadingInsight}>
                           <RefreshCw className="mr-2 h-4 w-4" />
                           Refresh Pattern
                       </Button>
                   )}
              </CardHeader>
              <CardContent className="space-y-4">
                  {isLoadingInsight ? (
                     <div className="flex justify-center items-center h-24">
                        <Loader2 className="h-8 w-8 animate-spin" />
                     </div>
                  ) : insight ? (
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        <div className="border-l-4 border-amber-500 bg-amber-50 p-4 rounded-r-lg">
                           <h3 className="font-semibold text-amber-800">Hidden Pattern Detected</h3>
                           <p className="text-sm text-amber-700">{insight.hiddenPattern}</p>
                        </div>
                         <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                           <h3 className="font-semibold text-blue-800">Smart Disposal Tip</h3>
                           <p className="text-sm text-blue-700">{insight.disposalTip}</p>
                        </div>
                         <div className="space-y-2">
                             <h3 className="font-semibold text-green-800">Prevention Solutions</h3>
                             {insight.preventionSolutions.map((solution, i) => (
                                <p key={i} className="text-sm text-green-700 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    {solution}
                                </p>
                             ))}
                         </div>
                     </motion.div>
                  ) : (
                     <Button className="w-full" onClick={handleFetchPattern} disabled={isLoadingInsight}>
                        <Brain className="mr-2 h-4 w-4" />
                        Reveal Waste Pattern
                     </Button>
                  )}
              </CardContent>
            </Card>
          </div>
      )}
    </div>
  );
}
