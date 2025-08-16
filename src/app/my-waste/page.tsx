

'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, TooltipProps } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Lightbulb, AlertTriangle, TrendingUp, BarChart2, Brain, CalendarClock, Users, Soup, MessageCircleQuestion, Plus, ShoppingCart, Utensils, ThumbsDown, Leaf, Sprout, Apple, Drumstick, Fish, Beef, Wheat, Sandwich, IceCream, Star, Flame, Package, Trash, Clock, ChevronLeft, ChevronRight, History, RefreshCw, Camera, Mic, Type } from 'lucide-react';
import type { WasteLog } from '@/types';
import { format, subDays, startOfDay, isAfter, endOfDay, eachDayOfInterval, parseISO, isSameDay, addDays } from 'date-fns';
import Image from 'next/image';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { useSavingsStore } from '@/stores/savings-store';
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
type ChartView = 'daily' | 'aggregate';

const COLORS = ['#16a34a', '#f59e0b', '#3b82f6', '#8b5cf6', '#dc2626', '#ec4899', '#f472b6', '#6366f1'];


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
  const { savingsEvents } = useSavingsStore();
  const [timeframe, setTimeframe] = useState<ChartTimeframe>('7d');
  const [chartMetric, setChartMetric] = useState<ChartMetric>('totalPesoValue');
  const [viewType, setViewType] = useState<ChartView>('daily');
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

    let dailyData = dateRange.map(date => ({
      date: format(date, 'EEE'),
      fullDate: date,
      totalPesoValue: 0,
      totalCarbonFootprint: 0,
      totalSavings: 0,
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

    savingsEvents.forEach(event => {
        const eventDate = parseISO(event.date);
        if (isAfter(eventDate, startDate) || format(eventDate, 'yyyy-MM-dd') === format(startDate, 'yyyy-MM-dd')) {
            const dayData = dailyData.find(d => isSameDay(d.fullDate, eventDate));
            if (dayData) {
                dayData.totalSavings += event.amount;
            }
        }
    });
    
    if (viewType === 'aggregate') {
        let cumulativeWasteValue = 0;
        let cumulativeCO2 = 0;
        let cumulativeSavings = 0;
        
        return dailyData.map(d => {
            cumulativeWasteValue += d.totalPesoValue;
            cumulativeCO2 += d.totalCarbonFootprint;
            cumulativeSavings += d.totalSavings;
            return {
                ...d,
                totalPesoValue: cumulativeWasteValue,
                totalCarbonFootprint: cumulativeCO2,
                totalSavings: cumulativeSavings,
            }
        });
    }

    return dailyData;
  }, [logs, savingsEvents, timeframe, viewType]);
  
  const tickFormatter = (value: string, index: number) => {
    const dataLength = chartData.length;
    if (isMobile && dataLength > 14) {
       if (index % 3 === 0) {
           return value;
       }
       return "";
    }
    return value;
  }
  
  const { reasonCategoryData, allCategories } = useMemo(() => {
    const reasonData: Record<string, Record<string, number> & { total: number }> = {};
    const categories = new Set<string>();

    logs.forEach(log => {
        const reason = log.sessionWasteReason || 'Other';
        if (!reasonData[reason]) {
            reasonData[reason] = { total: 0 };
        }
        
        log.items.forEach(item => {
            const category = getCategory(item.name);
            categories.add(category);
            reasonData[reason][category] = (reasonData[reason][category] || 0) + item.pesoValue;
            reasonData[reason].total += item.pesoValue;
        });
    });

    const sortedData = Object.entries(reasonData)
        .map(([name, values]) => ({ name, ...values }))
        .sort((a, b) => a.total - b.total); // Sort ascending for better chart display

    return { reasonCategoryData: sortedData, allCategories: Array.from(categories) };
  }, [logs]);


  const handleFetchPattern = async () => {
    setIsLoadingInsight(true);
    setInsight(null);
    try {
        const result = await analyzeWastePatterns({ wasteLogs: logs });
        setInsight(result);
    } catch(e) {
        console.error("Failed to analyze waste patterns", e);
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
      label: "Waste (₱)",
      color: "hsl(var(--destructive))",
    },
    totalCarbonFootprint: {
        label: "CO₂e (kg)",
        color: "hsl(var(--primary))",
    },
    totalSavings: {
        label: "Savings (₱)",
        color: "hsl(var(--chart-1))",
    }
  } satisfies ChartConfig
  
  const reasonChartConfig = {
      ...allCategories.reduce((acc, cat, i) => ({
          ...acc,
          [cat]: { label: cat, color: COLORS[i % COLORS.length] }
      }), {}),
  } satisfies ChartConfig

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
                    <CardTitle className="text-base sm:text-lg">Waste & Savings Over Time</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Daily impact of your actions
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg">
                      <Button
                        size="sm"
                        onClick={() => setViewType('daily')}
                        className={cn(
                          'h-auto px-2 py-1 text-xs',
                          viewType === 'daily'
                            ? 'bg-background text-foreground shadow'
                            : 'bg-transparent text-muted-foreground hover:bg-background/50'
                        )}
                      >
                        Daily
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setViewType('aggregate')}
                        className={cn(
                          'h-auto px-2 py-1 text-xs',
                          viewType === 'aggregate'
                            ? 'bg-background text-foreground shadow'
                            : 'bg-transparent text-muted-foreground hover:bg-background/50'
                        )}
                      >
                        Aggregate
                      </Button>
                    </div>
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

                <CardContent className="space-y-4 px-2 sm:px-4 pb-4">
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
                    <AreaChart accessibilityLayer data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={tickFormatter}
                            interval="preserveStartEnd"
                        />

                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                        <defs>
                            <linearGradient id="fillWaste" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={chartConfig[chartMetric].color} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={chartConfig[chartMetric].color} stopOpacity={0.1}/>
                            </linearGradient>
                            <linearGradient id="fillSavings" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={chartConfig.totalSavings.color} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={chartConfig.totalSavings.color} stopOpacity={0.1}/>
                            </linearGradient>
                        </defs>
                        <Area
                            dataKey={chartMetric}
                            name={chartConfig[chartMetric].label}
                            type="monotone"
                            fill="url(#fillWaste)"
                            fillOpacity={0.4}
                            stroke={chartConfig[chartMetric].color}
                            stackId={chartMetric === 'totalPesoValue' ? "a" : chartMetric}
                        />
                        {chartMetric === 'totalPesoValue' && (
                            <Area
                                dataKey="totalSavings"
                                name={chartConfig.totalSavings.label}
                                type="monotone"
                                fill="url(#fillSavings)"
                                fillOpacity={0.4}
                                stroke={chartConfig.totalSavings.color}
                                stackId="a"
                            />
                        )}
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Why Food Gets Wasted
                    </CardTitle>
                    <CardDescription>Root causes and the types of food involved.</CardDescription>
                </CardHeader>
                <CardContent className="pl-0">
                    {reasonCategoryData.length > 0 ? (
                        <ChartContainer config={reasonChartConfig} className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={reasonCategoryData}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        tickLine={false} 
                                        axisLine={false}
                                        tick={{ fontSize: 12 }}
                                        width={isMobile ? 80 : 120}
                                        />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--muted))' }}
                                        content={<ChartTooltipContent />}
                                    />
                                    <Legend />
                                    {allCategories.map((category, index) => (
                                        <Bar 
                                            key={category} 
                                            dataKey={category} 
                                            stackId="a" 
                                            fill={COLORS[index % COLORS.length]} 
                                            radius={[0, 4, 4, 0]}
                                        />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    ) : <p className="text-center text-muted-foreground py-10">No reasons logged yet.</p>}
                </CardContent>
            </Card>

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
