
'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, TooltipProps, RadialBarChart, RadialBar, PolarGrid, Label, PolarRadiusAxis } from 'recharts';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Lightbulb, AlertTriangle, TrendingUp, BarChart2, Brain, CalendarClock, Users, Soup, MessageCircleQuestion, Plus, ShoppingCart, Utensils, ThumbsDown, Leaf, Sprout, Apple, Drumstick, Fish, Beef, Wheat, Sandwich, IceCream, Star, Flame, Package, Trash, Clock, ChevronLeft, ChevronRight, History, RefreshCw, Camera, Mic, Type, Gem, ArrowRight } from 'lucide-react';
import type { WasteLog } from '@/types';
import { format, subDays, startOfDay, isAfter, endOfDay, eachDayOfInterval, parseISO, isSameDay, addDays } from 'date-fns';
import Image from 'next/image';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { usePantryLogStore } from '@/stores/pantry-store';
import { useSavingsStore } from '@/stores/savings-store';
import { TrendsKPI } from '@/components/dashboard/TrendsKPI';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { PantryHealthScore } from '@/components/dashboard/PantryHealthScore';
import { WeeklyPerformancePanel } from '@/components/dashboard/WeeklyPerformancePanel';

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


const CustomizedYAxisTick = ({ x, y, payload }: any) => {
    if (!payload || !payload.value) {
      return null;
    }
    const words = payload.value.split(' ');
  
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={4} textAnchor="end" fill="#666" fontSize="10px" fontWeight="bold">
          {words[0]}
          {words.length > 1 && <tspan x="0" dy="1.2em">{words.slice(1).join(' ')}</tspan>}
        </text>
      </g>
    );
};


export default function MyWastePage() {
  const router = useRouter();
  const { logs, logsInitialized } = useWasteLogStore();
  const { archivedItems } = usePantryLogStore();
  const { savingsEvents } = useSavingsStore();
  const [timeframe, setTimeframe] = useState<ChartTimeframe>('7d');
  const [chartMetric, setChartMetric] = useState<ChartMetric>('totalPesoValue');
  const [viewType, setViewType] = useState<ChartView>('daily');
  const isMobile = useIsMobile();
  const [isLogMethodOpen, setIsLogMethodOpen] = useState(false);

  const getDaysFromTimeframe = (tf: ChartTimeframe) => {
      switch(tf) {
          case '15d': return 15;
          case '30d': return 30;
          default: return 7;
      }
  }

  const { chartData, totalWaste, totalSavings } = useMemo(() => {
    const days = getDaysFromTimeframe(timeframe);
    const startDate = startOfDay(subDays(new Date(), days - 1));
    const endDate = endOfDay(new Date());
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

    let calculatedTotalWaste = 0;
    let calculatedTotalSavings = 0;

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
        calculatedTotalWaste += log.totalPesoValue;
      }
    });

    savingsEvents.forEach(event => {
        const eventDate = parseISO(event.date);
        if (isAfter(eventDate, startDate) || format(eventDate, 'yyyy-MM-dd') === format(startDate, 'yyyy-MM-dd')) {
            const dayData = dailyData.find(d => isSameDay(d.fullDate, eventDate));
            if (dayData) {
                dayData.totalSavings += event.amount;
            }
            calculatedTotalSavings += event.amount;
        }
    });
    
    if (viewType === 'aggregate') {
        let cumulativeWasteValue = 0;
        let cumulativeCO2 = 0;
        let cumulativeSavings = 0;
        
        dailyData = dailyData.map(d => {
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

    return { chartData: dailyData, totalWaste: calculatedTotalWaste, totalSavings: calculatedTotalSavings };
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
  
  const { reasonCategoryData, allCategories, topReasonInsight } = useMemo(() => {
    const reasonData: Record<string, Record<string, number> & { total: number }> = {};
    const categories = new Set<string>();

    const shortenedNames: Record<string, string> = {
        "Got spoiled/rotten": "Spoiled",
        "Past expiry date": "Expired",
        "Cooked too much": "Too Big",
        "Portion too big / Couldn’t finish": "Too Big"
    };

    logs.forEach(log => {
        let reason = log.sessionWasteReason || 'Other';
        reason = shortenedNames[reason] || reason;

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
        .sort((a, b) => b.total - a.total);
        
    let insight = "Log more waste to get personalized insights.";
    if (sortedData.length > 0) {
        const topReason = sortedData[0];
        const topCategoryForReason = Object.entries(topReason)
            .filter(([key]) => key !== 'name' && key !== 'total')
            .sort((a, b) => b[1] - a[1])[0];
            
        insight = `Your top reason for waste is "${topReason.name}", primarily from ${topCategoryForReason?.[0] || 'various foods'}.`;
    }

    return { reasonCategoryData: sortedData, allCategories: Array.from(categories), topReasonInsight: insight };
  }, [logs]);


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
  
  const netOffset = totalSavings - totalWaste;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 bg-gray-50">
       <div className="flex flex-row flex-wrap items-center justify-between gap-2">
            <div className="space-y-1">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight flex items-center gap-2">
                  <BarChart2 className="w-6 h-6 text-primary" />
                  My Waste Impact
                </h1>
                <p className="text-muted-foreground text-sm">
                    Track your patterns, reduce waste, spend less
                </p>
            </div>
            <Popover open={isLogMethodOpen} onOpenChange={setIsLogMethodOpen}>
              <PopoverTrigger asChild>
                <Button className="whitespace-nowrap bg-primary hover:bg-primary/90 h-10 text-sm">
                    <Trash className="w-4 h-4 mr-2" />
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TrendsKPI logs={logs} />
            
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base md:text-lg font-semibold">Waste & Savings</CardTitle>
                  <CardDescription className="text-xs">
                    This chart shows the daily cost of your food waste versus the virtual savings you've earned from sustainable actions.
                  </CardDescription>
                  <div className="flex flex-wrap items-center gap-1 pt-2 sm:gap-2">
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

                <CardContent className="space-y-2 px-2 sm:px-4 pb-4">
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
                    <AreaChart accessibilityLayer data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
                            stackId={chartMetric === 'totalPesoValue' ? "value" : "co2"}
                        />
                        {chartMetric === 'totalPesoValue' && (
                            <Area
                                dataKey="totalSavings"
                                name={chartConfig.totalSavings.label}
                                type="monotone"
                                fill="url(#fillSavings)"
                                fillOpacity={0.4}
                                stroke={chartConfig.totalSavings.color}
                                stackId="value"
                            />
                        )}
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
                 <CardFooter className="px-4 py-3 border-t bg-secondary/50">
                    <p className="text-xs text-muted-foreground">
                        Insight: You've saved <strong className="text-green-600">₱{totalSavings.toFixed(2)}</strong> and wasted <strong className="text-destructive">₱{totalWaste.toFixed(2)}</strong>. 
                        Your net offset is <strong className={cn(netOffset >= 0 ? "text-green-600" : "text-destructive")}>₱{netOffset.toFixed(2)}</strong>.
                    </p>
                </CardFooter>
              </Card>

            <PantryHealthScore wasteLogs={logs} archivedItems={archivedItems} />
            
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg font-semibold">
                        <Brain className="h-5 w-5" />
                        Why Food Gets Wasted
                    </CardTitle>
                    <CardDescription className="text-xs">Root causes and the types of food involved.</CardDescription>
                </CardHeader>
                <CardContent>
                    {reasonCategoryData.length > 0 ? (
                        <ChartContainer config={reasonChartConfig} className="h-[350px] w-full">
                            <BarChart
                                layout="vertical"
                                data={reasonCategoryData}
                                margin={{ top: 5, right: 10, left: 10, bottom: 20 }}
                            >
                                <CartesianGrid horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis 
                                    type="category" 
                                    dataKey="name" 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tickMargin={10} 
                                    width={isMobile ? 60 : 80}
                                    tick={<CustomizedYAxisTick />}
                                />
                                <ChartTooltip 
                                    cursor={{fill: 'hsl(var(--muted))'}} 
                                    content={<ChartTooltipContent />} 
                                />
                                <ChartLegend content={<ChartLegendContent />} />
                                {allCategories.map((category) => (
                                    <Bar
                                        key={category}
                                        dataKey={category}
                                        stackId="a"
                                        fill={reasonChartConfig[category]?.color || '#8884d8'}
                                        radius={[0, 4, 4, 0]}
                                    />
                                ))}
                            </BarChart>
                        </ChartContainer>
                    ) : <p className="text-center text-muted-foreground py-10">No reasons logged yet.</p>}
                </CardContent>
                 <CardFooter className="px-4 py-3 border-t bg-secondary/50">
                    <p className="text-xs text-muted-foreground">
                        Insight: {topReasonInsight}
                    </p>
                </CardFooter>
            </Card>

            <WeeklyPerformancePanel />

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Want deeper insights?
                </CardTitle>
                <CardDescription className="text-xs">
                  See a full AI analysis of your patterns and get personalized solutions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={() => router.push('/kitchen-coach')}>
                  Go to Kitchen Coach
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

          </div>
      )}
    </div>
  );
}
