

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


// --- Comprehensive Food Icon System ---
const foodIconConfig: { [key: string]: { emoji: string; keywords: string[]; color: string; } } = {
  vegetables: { emoji: '🥬', keywords: ['kangkong', 'spinach', 'lettuce', 'cabbage', 'bok choy', 'pechay', 'tomatoes', 'tomato', 'onion', 'sibuyas', 'carrots', 'karot', 'potatoes', 'patatas', 'sweet potato', 'kamote', 'bell pepper', 'chili', 'sili', 'cucumber', 'pipino', 'corn', 'mais', 'mushrooms', 'garlic', 'bawang', 'ginger', 'luya', 'gulay'], color: 'bg-green-100 text-green-800' },
  eggplant: { emoji: '🍆', keywords: ['eggplant', 'talong'], color: 'bg-purple-100 text-purple-800' },
  fruits: { emoji: '🍎', keywords: ['apple', 'mansanas', 'banana', 'saging', 'orange', 'dalandan', 'mango', 'mangga', 'grapes', 'ubas', 'strawberry', 'watermelon', 'pakwan', 'pineapple', 'pinya', 'coconut', 'niyog', 'buko', 'papaya', 'avocado', 'lemon', 'kalamansi', 'calamansi', 'prutas'], color: 'bg-red-100 text-red-800' },
  meat: { emoji: '🥩', keywords: ['chicken', 'manok', 'pork', 'baboy', 'pork belly', 'pork chops', 'lechon', 'bacon', 'ham', 'beef', 'baka', 'ground beef', 'steak', 'sausage', 'hotdog', 'longganisa', 'karne', 'chicharon'], color: 'bg-red-200 text-red-900' },
  seafood: { emoji: '🐟', keywords: ['fish', 'tilapia', 'bangus', 'milkfish', 'tuna', 'salmon', 'galunggong', 'shrimp', 'hipon', 'prawns', 'crab', 'alimango', 'squid', 'pusit', 'oysters', 'tahong', 'isda'], color: 'bg-blue-100 text-blue-800' },
  dairy: { emoji: '🥛', keywords: ['milk', 'gatas', 'cheese', 'keso', 'cheddar', 'yogurt', 'butter', 'mantikilya'], color: 'bg-blue-200 text-blue-900' },
  eggs: { emoji: '🥚', keywords: ['egg', 'itlog', 'duck egg'], color: 'bg-yellow-100 text-yellow-800' },
  carbs: { emoji: '🍞', keywords: ['bread', 'tinapay', 'pandesal', 'rolls', 'rice', 'kanin', 'bigas', 'fried rice', 'sinangag', 'pasta', 'spaghetti', 'noodles', 'pancit', 'bihon'], color: 'bg-yellow-200 text-yellow-900' },
  dishes: { emoji: '🍲', keywords: ['adobo', 'sinigang', 'tinola', 'kare kare', 'menudo', 'mechado', 'caldereta', 'afritada', 'lumpia', 'pinakbet', 'laing', 'bicol express', 'soup', 'sabaw', 'bulalo', 'pochero', 'curry', 'fried chicken', 'fried fish', 'inihaw', 'pizza', 'burger', 'sandwich', 'salad', 'ulam', 'leftovers', 'takeout'], color: 'bg-purple-100 text-purple-800' },
  snacks: { emoji: '🥨', keywords: ['chips', 'crackers', 'biskwit', 'cookies', 'nuts', 'mani', 'candy', 'chocolate', 'tsokolate', 'meryenda'], color: 'bg-orange-100 text-orange-800' },
  desserts: { emoji: '🍰', keywords: ['cake', 'ice cream', 'sorbetes', 'halo halo', 'leche flan', 'ube', 'biko', 'bibingka', 'puto'], color: 'bg-pink-100 text-pink-800' },
  beverages: { emoji: '🥤', keywords: ['juice', 'soda', 'coke', 'pepsi', 'sprite', 'coffee', 'kape', 'tea', 'tsaa', 'beer', 'wine', 'water', 'tubig'], color: 'bg-cyan-100 text-cyan-800' },
  canned: { emoji: '🥫', keywords: ['canned', 'sardines', 'corned beef', 'spam', 'luncheon meat'], color: 'bg-gray-200 text-gray-800' },
  other: { emoji: '🍽️', keywords: [], color: 'bg-gray-100 text-gray-700' },
};

const getFoodIcon = (itemName: string) => {
  const lowerItem = itemName.toLowerCase();
  for (const category in foodIconConfig) {
    if (foodIconConfig[category].keywords.some(keyword => lowerItem.includes(keyword))) {
      return foodIconConfig[category];
    }
  }
  return foodIconConfig.other;
};

const WasteReasonIndicator = ({ reason }: { reason: string }) => {
    const indicatorMap: { [key: string]: { icon: React.ElementType, color: string, tooltip: string } } = {
        'Past expiry date': { icon: Clock, color: 'bg-red-500', tooltip: 'Expired' },
        'Forgot about it': { icon: Brain, color: 'bg-yellow-500', tooltip: 'Forgot' },
        'Cooked too much': { icon: Plus, color: 'bg-blue-500', tooltip: 'Excess' },
        'Got spoiled/rotten': { icon: ThumbsDown, color: 'bg-green-600', tooltip: 'Spoiled' },
        'Bought too much': { icon: ShoppingCart, color: 'bg-purple-500', tooltip: 'Bought too much'},
    };

    const indicator = Object.keys(indicatorMap).find(key => reason.toLowerCase().includes(key.toLowerCase()));
    if (!indicator) return null;

    const { icon: Icon, color, tooltip } = indicatorMap[indicator];
    
    return (
        <div title={tooltip} className={cn("absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white shadow", color)}>
            <Icon className="w-3 h-3" />
        </div>
    );
};


const WasteIcon = ({ entry }: { entry: WasteLog }) => {
    const primaryItemName = entry.items[0]?.name || 'food';
    const { emoji, color } = getFoodIcon(primaryItemName);
    const cost = entry.totalPesoValue;

    const costBorderColor = useMemo(() => {
        if (cost >= 200) return 'border-red-500';
        if (cost >= 100) return 'border-orange-500';
        if (cost >= 50) return 'border-yellow-400';
        return 'border-gray-200';
    }, [cost]);

    return (
        <div className="relative">
             <div 
                className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0 border-2 transition-all duration-300 group-hover:scale-110", 
                    color, 
                    costBorderColor
                )}
            >
                {cost >= 100 ? '💸' : emoji}
            </div>
            <WasteReasonIndicator reason={entry.sessionWasteReason || ''} />
        </div>
    );
};


const WasteEntryCard = ({ entry }: { entry: WasteLog }) => {
    const ReasonIcon = reasonIconMap[entry.sessionWasteReason || ''] || Lightbulb;
    
    return (
        <motion.div 
            className="bg-white border border-gray-200 rounded-xl p-4 mb-3 transition-all hover:shadow-md hover:border-green-500 group"
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex items-start gap-3">
                <WasteIcon entry={entry} />
                <div className="flex-1">
                    <p className="font-medium text-gray-800 leading-snug mb-1.5">{entry.items.map(i => i.name).join(', ')}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{format(parseISO(entry.date), 'h:mm a')}</div>
                        <div className="flex items-center gap-1.5"><ReasonIcon className="w-3.5 h-3.5" />{entry.sessionWasteReason}</div>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-semibold text-orange-600 text-base">₱{entry.totalPesoValue.toFixed(2)}</p>
                    <p className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full mt-1">{entry.totalCarbonFootprint.toFixed(2)}kg CO₂e</p>
                </div>
            </div>
        </motion.div>
    );
};

const RecentWasteHistory = ({ logs }: { logs: WasteLog[] }) => {
    const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
    const [dateRange, setDateRange] = useState<Date[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const today = startOfDay(new Date());

    useEffect(() => {
        const calculateVisibleDays = () => {
            let numDays = 7;
            if (containerRef.current) {
                const containerWidth = containerRef.current.offsetWidth;
                const buttonWidth = 92; // Approx width of a date button including gap
                numDays = Math.max(1, Math.floor(containerWidth / buttonWidth));
            }
            return numDays;
        };

        const numDays = calculateVisibleDays();
        const initialEndDate = selectedDate > today ? today : selectedDate;
        const range = Array.from({ length: numDays }, (_, i) => startOfDay(subDays(initialEndDate, i))).reverse();
        setDateRange(range);

        const handleResize = () => {
            const newNumDays = calculateVisibleDays();
            const currentEndDate = dateRange[dateRange.length - 1] || today;
            const newRange = Array.from({ length: newNumDays }, (_, i) => startOfDay(subDays(currentEndDate, i))).reverse();
            setDateRange(newRange);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
        
    }, []);

    const organizedWaste = useMemo(() => {
        const filteredLogs = logs.filter(log => isSameDay(parseISO(log.date), selectedDate));
        
        return filteredLogs.reduce((acc, entry) => {
            const hour = parseISO(entry.date).getHours();
            const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
            acc[timeOfDay].push(entry);
            return acc;
        }, { morning: [] as WasteLog[], afternoon: [] as WasteLog[], evening: [] as WasteLog[] });
    }, [logs, selectedDate]);
    
    const handleDateChange = (offset: number) => {
        if (dateRange.length === 0) return;
        const currentEndDate = dateRange[dateRange.length - 1];
        let newEndDate = addDays(currentEndDate, offset);

        if (isAfter(newEndDate, today)) {
            newEndDate = today;
        }

        const newRange = Array.from({ length: dateRange.length }, (_, i) => startOfDay(subDays(newEndDate, i))).reverse();
        setDateRange(newRange);
    };

    const hasWasteForSelectedDate = Object.values(organizedWaste).some(arr => arr.length > 0);

    const isFutureDate = (date: Date) => isAfter(date, today);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><History className="w-6 h-6" />Recent Waste History</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2 mb-4">
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleDateChange(-dateRange.length)}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex-1 overflow-x-auto scrollbar-hide" ref={containerRef}>
                        <div className="flex gap-2 pb-1">
                            {dateRange.map(date => (
                                <motion.button
                                    key={date.toISOString()}
                                    className={cn(
                                        "flex-shrink-0 w-20 text-center rounded-lg p-2.5 transition-all border",
                                        isSameDay(date, selectedDate)
                                            ? 'bg-primary text-white border-primary shadow-md'
                                            : 'bg-white text-gray-500 border-gray-200 hover:border-primary hover:bg-green-50'
                                    )}
                                    onClick={() => setSelectedDate(date)}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <p className={cn("text-xs uppercase", isSameDay(date, selectedDate) ? 'text-green-200' : 'text-gray-400')}>{format(date, 'MMM')}</p>
                                    <p className={cn("text-xl font-bold", isSameDay(date, selectedDate) ? 'text-white' : 'text-gray-800')}>{format(date, 'd')}</p>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                     <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => handleDateChange(dateRange.length)} disabled={dateRange.length > 0 && isSameDay(dateRange[dateRange.length-1], today)}>
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>

                <div className="mt-4 min-h-[150px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedDate.toISOString()}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {!hasWasteForSelectedDate ? (
                                <div className="text-center py-10 bg-gray-50 rounded-lg">
                                    <p className="text-gray-500">No waste logged for this day.</p>
                                </div>
                            ) : (
                                <>
                                    {organizedWaste.morning.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="text-sm font-semibold text-gray-500 mb-2 pl-2 border-l-2 border-primary">Morning</h3>
                                            <AnimatePresence>
                                                {organizedWaste.morning.map(log => <WasteEntryCard key={log.id} entry={log} />)}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                    {organizedWaste.afternoon.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="text-sm font-semibold text-gray-500 mb-2 pl-2 border-l-2 border-primary">Afternoon</h3>
                                             <AnimatePresence>
                                                {organizedWaste.afternoon.map(log => <WasteEntryCard key={log.id} entry={log} />)}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                    {organizedWaste.evening.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="text-sm font-semibold text-gray-500 mb-2 pl-2 border-l-2 border-primary">Evening</h3>
                                             <AnimatePresence>
                                                {organizedWaste.evening.map(log => <WasteEntryCard key={log.id} entry={log} />)}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </CardContent>
        </Card>
    );
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
    const dataLength = chartData.length;
    if (dataLength <= 7) return value;
    if (isMobile && dataLength > 14) {
       if (index === 0 || index === dataLength - 1 || index % 7 === 0) {
           return value;
       }
       return "";
    }
    const date = parseISO(chartData[index].fullDate.toISOString());
    // Show full date for first, last, and roughly weekly intervals
    if (index === 0 || index === dataLength - 1 || (index + 1) % Math.floor(dataLength / 4) === 0) {
        return format(date, 'MMM d');
    }
    return ""; // Hide other labels to prevent crowding
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
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Waste Impact</h1>
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
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-y-4">
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
                       <Button size="sm" variant={timeframe === '15d' ? 'destructive' : 'outline'} onClick={() => setTimeframe('15d')}>15d</Button>
                       <Button size="sm" variant={timeframe === '30d' ? 'destructive' : 'outline'} onClick={() => setTimeframe('30d')}>30d</Button>
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
                              interval="preserveStartEnd"
                          />
                          <YAxis tickFormatter={(value) => chartMetric === 'totalPesoValue' ? `₱${value}` : `${value}kg`} />
                          <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                          <Line dataKey={chartMetric} type="monotone" stroke={`var(--color-${chartMetric})`} strokeWidth={3} dot={false} activeDot={{r: 6, fill: `var(--color-${chartMetric})`}} fill={`var(--color-${chartMetric})`} />
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

            <RecentWasteHistory logs={logs} />
          </div>
      )}
    </div>
  );
}
