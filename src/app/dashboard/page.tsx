
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { useInsightStore } from '@/stores/insight-store';
import { usePantryLogStore } from '@/stores/pantry-store';
import { useSavingsStore } from '@/stores/savings-store';
import { isWithinInterval, add, differenceInDays, startOfToday, startOfMonth } from 'date-fns';
import { 
  Sparkles, 
  TrendingUp, 
  Package, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Leaf,
  DollarSign,
  Zap,
  Trash,
  ChevronDown,
  ChevronUp,
  Edit,
  ShoppingBasket,
  Lightbulb,
  Loader2
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatPeso, estimateRiceKgFromPesos, estimateWaterSavedLitersFromSavings } from '@/lib/utils';
import type { PantryItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { updatePantryItemStatus } from '@/lib/data';

type SortKey = 'name' | 'daysUntilExpiration';
type SortDirection = 'asc' | 'desc';

const emojiMap: { [key: string]: string } = {
    'pork': '🐷',
    'chicken': '🐔',
    'beef': '🐄',
    'fish': '🐟',
    'salmon': '🐟',
    'tuna': '🐟',
    'cabbage': '🥬',
    'garlic': '🧄',
    'tomato': '🍅',
    'onion': '🧅',
    'carrot': '🥕',
    'potato': '🥔',
    'milk': '🥛',
    'cheese': '🧀',
    'butter': '🧈',
    'apple': '🍎',
    'banana': '🍌',
    'orange': '🍊',
    'rice': '🍚',
    'bread': '🍞',
    'pasta': '🍝',
    'lettuce': '🥬',
    'egg': '🥚',
};

const getItemEmoji = (itemName: string) => {
    const lowerItem = itemName.toLowerCase();
    for (const key in emojiMap) {
        if (lowerItem.includes(key)) {
            return emojiMap[key];
        }
    }
    return '🍽️'; // Default emoji
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { logs } = useWasteLogStore();
  const { insights } = useInsightStore();
  const { liveItems, archiveItem } = usePantryLogStore();
  const { savingsEvents } = useSavingsStore();
  const { toast } = useToast();
  
  const [greeting, setGreeting] = useState("Good morning");
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'daysUntilExpiration', direction: 'asc' });
  const [isUpdatingItemId, setIsUpdatingItemId] = useState<string | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // Calculate weekly stats
  const weeklyWasteStats = logs
    .filter(log => isWithinInterval(new Date(log.date), { 
      start: new Date(new Date().setDate(new Date().getDate() - 7)), 
      end: new Date() 
    }))
    .reduce((acc, log) => {
      acc.totalPesoValue += log.totalPesoValue;
      acc.totalCarbonFootprint += log.totalCarbonFootprint;
      return acc;
    }, { totalPesoValue: 0, totalCarbonFootprint: 0 });

  const weeklySavingsStats = savingsEvents
    .filter(event => isWithinInterval(new Date(event.date), {
        start: new Date(new Date().setDate(new Date().getDate() - 7)),
        end: new Date()
    }))
    .reduce((acc, event) => {
        acc.totalSavings += event.amount;
        return acc;
    }, { totalSavings: 0 });

  // Storytelling equivalents for savings
  const weeklyRiceKg = estimateRiceKgFromPesos(weeklySavingsStats.totalSavings);
  const weeklyWaterSavedL = estimateWaterSavedLitersFromSavings(weeklySavingsStats.totalSavings);

  // Calculate pantry health stats
  const freshItems = liveItems.filter(item => {
    const expirationDate = new Date(item.estimatedExpirationDate);
    const threeDaysFromNow = add(new Date(), { days: 3 });
    return expirationDate > threeDaysFromNow;
  });

  const expiringSoonItems = liveItems.filter(item => {
    const expirationDate = new Date(item.estimatedExpirationDate);
    const today = new Date();
    const threeDaysFromNow = add(today, { days: 3 });
    return expirationDate >= today && expirationDate <= threeDaysFromNow;
  });

  const expiredItems = liveItems.filter(item => 
    new Date(item.estimatedExpirationDate) < new Date()
  );

  const healthPercentage = liveItems.length > 0 
    ? Math.round((freshItems.length / liveItems.length) * 100) 
    : 0;

  const latestInsight = insights.length > 0 ? insights[0] : null;

  // Monthly savings goal progress (hackathon placeholder goal)
  const savingsGoal = 5000;
  const monthStart = startOfMonth(new Date());
  const monthSavings = savingsEvents
    .filter(e => new Date(e.date) >= monthStart)
    .reduce((acc, e) => acc + e.amount, 0);
  const goalProgress = Math.round(Math.min(100, Math.max(0, (monthSavings / savingsGoal) * 100)));

  const sortedWatchlistItems = useMemo(() => {
    const itemsWithDays = expiringSoonItems.map(item => ({
      ...item,
      daysUntilExpiration: differenceInDays(new Date(item.estimatedExpirationDate), startOfToday())
    }));

    return [...itemsWithDays].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [expiringSoonItems, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const getStatusIndicator = (days: number) => {
    if (days <= 1) return <div className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-500/30" title="Urgent"></div>;
    if (days <= 3) return <div className="w-3 h-3 rounded-full bg-yellow-500 ring-2 ring-yellow-500/30" title="Expiring Soon"></div>;
    return <div className="w-3 h-3 rounded-full bg-green-500" title="Fresh"></div>;
  };
  
  const getTableRowClass = (days: number) => {
      if(days <= 1) return "bg-red-500/10 hover:bg-red-500/20";
      if(days <= 3) return "bg-amber-500/10 hover:bg-amber-500/20";
      return "bg-white";
  }

  const handleMarkAsUsed = async (item: PantryItem) => {
    if (!user) return;
    setIsUpdatingItemId(item.id);
    try {
      // Optimistic UI update
      archiveItem(item.id, 'used');
      
      // Server update (fire and forget for better UX)
      updatePantryItemStatus(user.uid, item.id, 'used').catch(err => {
        console.error("Failed to mark item as used on server", err);
        // Here you might add logic to revert the optimistic update if needed
      });

      toast({ title: "Item used!", description: `You've used "${item.name}".`});
    } catch (error) {
      console.error("Error marking item as used:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not mark item as used.' });
    } finally {
      setIsUpdatingItemId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7] p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border-b">
            <h1 className="text-3xl md:text-4xl font-bold text-green-800">{greeting}, {user?.name?.split(' ')[0] || 'Raphael'}!</h1>
            <p className="text-lg font-medium text-gray-600 mt-1">Ready to make a difference? 🌍</p>
        </div>
        
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-pink-700">Total Items</p>
                  <p className="text-3xl font-semibold text-pink-900">{liveItems.length}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Pantry Health Score</p>
                  <p className="text-3xl font-semibold text-green-900">{healthPercentage}%</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700">Expiring Soon</p>
                  <p className="text-3xl font-semibold text-yellow-900">{expiringSoonItems.length}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">This Week's Logs</p>
                  <p className="text-3xl font-semibold text-blue-900">{logs.filter(log => isWithinInterval(new Date(log.date), { start: new Date(new Date().setDate(new Date().getDate() - 7)), end: new Date() })).length}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* This Week's Impact (prioritize savings and impact equivalences) */}
        <Card className="mb-8 overflow-hidden rounded-2xl shadow-sm border border-gray-200 bg-gradient-to-r from-green-600 to-emerald-500 text-white">
            <CardHeader className="bg-white/10 p-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    This Week's Impact
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-green-200">Virtual Savings</p>
                    <p className="text-3xl font-bold text-white">{formatPeso(weeklySavingsStats.totalSavings)}</p>
                    <p className="text-xs text-white/80">From using items before expiry</p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-emerald-200">Impact Equivalents</p>
                    <p className="text-sm text-white/90">≈ {weeklyRiceKg.toFixed(1)} kg rice or ~{weeklyWaterSavedL.toFixed(0)} L water saved</p>
                    <p className="text-xs text-white/60">Story-based comparison</p>
                </div>
                <div className="space-y-1">
                     <p className="text-sm font-medium text-red-200">Food Waste Logged</p>
                    <p className="text-3xl font-bold text-white">{formatPeso(weeklyWasteStats.totalPesoValue)}</p>
                    <p className="text-xs text-white/80">Track and reduce weekly losses</p>
                </div>
            </CardContent>
        </Card>

        {/* Quick Actions Section (tap-friendly, mobile-first) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-amber-500/50"
                onClick={() => router.push('/add-to-pantry')}
            >
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-amber-400 to-orange-500"></div>
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-amber-100 to-orange-200 transition-transform duration-300 group-hover:scale-110">
                            <ShoppingBasket className="h-6 w-6 text-amber-700" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">Add Groceries</h3>
                            <p className="text-sm text-gray-500">Stock your pantry</p>
                        </div>
                    </div>
                    <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-amber-600 transition-colors" />
                </div>
            </div>
            <div
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-green-500/50"
                onClick={() => router.push('/log-waste?method=camera')}
            >
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-green-400 to-emerald-500"></div>
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-green-100 to-emerald-200 transition-transform duration-300 group-hover:scale-110">
                            <BarChart3 className="h-6 w-6 text-green-700" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">Log Food Waste</h3>
                            <p className="text-sm text-gray-500">Track your impact</p>
                        </div>
                    </div>
                    <ArrowRight className="h-6 w-6 text-gray-400 group-hover:text-green-600 transition-colors" />
                </div>
            </div>
        </div>
        
        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* AI Insights Card */}
          <Card className="bg-gradient-to-br from-[#063627] to-[#227D53] text-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                 ✨ {latestInsight ? latestInsight.keyObservation : 'Fresh AI Insight'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {latestInsight ? (
                <>
                  <p className="text-sm text-white/80 mb-2">Fresh AI Insight</p>
                  <Badge className="mb-4 bg-green-500 hover:bg-green-500">AI Powered</Badge>
                  <div className="bg-white/10 rounded-xl p-4 mb-4 border border-white/20">
                    <p className="text-white/90 text-base leading-relaxed">
                      {latestInsight.smartTip}
                    </p>
                  </div>
                  <Button 
                    variant="outline"
                    className="bg-transparent border-white text-white hover:bg-white hover:text-primary rounded-full transition-colors duration-300 h-11"
                    onClick={() => router.push(`/insights/${latestInsight.id}`)}
                  >
                    View Full Analysis →
                  </Button>
                </>
              ) : (
                <div className="text-center text-white/70 py-6">
                  <Lightbulb className="w-10 h-10 mx-auto mb-3" />
                  <p className="font-semibold">No insights generated yet</p>
                  <p className="text-sm text-white/60">Keep logging your waste and pantry items to see AI-powered tips!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress Card */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#063627]">
                 🎉 Great Progress!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">Savings goal progress</p>
              <Badge className="mb-4 bg-green-100 text-green-800 hover:bg-green-100">{formatPeso(monthSavings)} this month</Badge>
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 mb-4 border border-green-200">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-green-800">Savings Goal ({formatPeso(savingsGoal)})</span>
                    <span className="text-2xl font-bold text-green-800">{goalProgress}%</span>
                  </div>
                  <Progress value={goalProgress} className="h-3" />
                </div>
              </div>
              <Button 
                variant="outline"
                className="bg-transparent text-primary border-primary hover:bg-primary hover:text-primary-foreground rounded-full font-semibold transition-colors duration-300 h-11"
                onClick={() => {router.push('/my-waste')}}
              >
                View Your Trends →
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Pantry Watchlist with suggested next actions */}
        <Card className="shadow-sm bg-white mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <AlertTriangle className="w-6 h-6 text-primary" />
                Pantry Watchlist
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expiringSoonItems.length > 0 ? (
                <>
                  {latestInsight?.solutions && latestInsight.solutions.length > 0 && (
                    <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                      <p className="text-sm font-semibold text-emerald-800 mb-2">Suggested next actions</p>
                      <ul className="list-disc list-inside text-sm text-emerald-900 space-y-1">
                        {latestInsight.solutions.slice(0,2).map((s, idx) => (
                          <li key={idx}>{s.solution}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            <Button variant="ghost" onClick={() => requestSort('name')} className="px-0">
                              Item {getSortIcon('name')}
                            </Button>
                          </TableHead>
                          <TableHead className="text-right">
                            <Button variant="ghost" onClick={() => requestSort('daysUntilExpiration')} className="px-0">
                              Expires In {getSortIcon('daysUntilExpiration')}
                            </Button>
                          </TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedWatchlistItems.map((item) => (
                          <TableRow key={item.id} className={getTableRowClass(item.daysUntilExpiration)}>
                            <TableCell className="font-semibold text-base">{`${getItemEmoji(item.name)} ${item.name}`}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                {getStatusIndicator(item.daysUntilExpiration)}
                                <span className="font-semibold">{item.daysUntilExpiration} days</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                               <Button variant="ghost" size="sm" onClick={() => handleMarkAsUsed(item)} disabled={isUpdatingItemId === item.id}>
                                {isUpdatingItemId === item.id ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                )}
                                Mark Used
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 bg-transparent text-primary border-primary hover:bg-primary hover:text-primary-foreground rounded-full font-semibold transition-colors duration-300 h-11"
                    onClick={() => router.push('/pantry')}
                  >
                    Go to Pantry →
                  </Button>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-10">
                  <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-500" />
                  <p className="font-semibold">Your pantry is looking fresh!</p>
                  <p className="text-sm">Nothing is expiring in the next few days. Great job!</p>
                </div>
              )}
            </CardContent>
          </Card>
      </div>
    </div>
  );

    



    