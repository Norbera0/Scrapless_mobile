
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
import { isWithinInterval, add, differenceInDays, startOfToday } from 'date-fns';
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
  Edit
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PantryItem } from '@/types';

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
  const { liveItems } = usePantryLogStore();
  const { savingsEvents } = useSavingsStore();
  
  const [greeting, setGreeting] = useState("Good morning");
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'daysUntilExpiration', direction: 'asc' });

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
    if (days <= 1) return <div className="w-3 h-3 rounded-full bg-red-500" title="Urgent"></div>;
    if (days <= 3) return <div className="w-3 h-3 rounded-full bg-yellow-500" title="Expiring Soon"></div>;
    return <div className="w-3 h-3 rounded-full bg-green-500" title="Fresh"></div>;
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7] p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-4xl font-semibold text-[#063627]">{greeting}, {user?.name?.split(' ')[0] || 'Raphael'}!</h1>
            
          </div>
          <p className="text-[#7C7C7C] text-lg">Let's reduce waste together</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-pink-700">Total Items</p>
                  <p className="text-3xl font-semibold text-pink-900">{liveItems.length}</p>
                </div>
                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Health Score</p>
                  <p className="text-3xl font-semibold text-green-900">{healthPercentage}%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700">Expiring Soon</p>
                  <p className="text-3xl font-semibold text-yellow-900">{expiringSoonItems.length}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">This Week's Logs</p>
                  <p className="text-3xl font-semibold text-blue-900">{logs.filter(log => isWithinInterval(new Date(log.date), { start: new Date(new Date().setDate(new Date().getDate() - 7)), end: new Date() })).length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* This Week's Impact */}
        <Card className="mb-8 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <BarChart3 className="w-6 h-6 text-green-600" />
              This Week's Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-700 mb-6">Your progress this week</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl p-6 border border-green-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-green-800">₱{weeklySavingsStats.totalSavings.toFixed(2)}</p>
                    <p className="text-sm text-green-600 font-medium">Virtual Savings</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-red-100 to-red-200 rounded-xl p-6 border border-red-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-200 rounded-xl flex items-center justify-center">
                    <Trash className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-red-800">₱{weeklyWasteStats.totalPesoValue.toFixed(2)}</p>
                    <p className="text-sm text-red-600 font-medium">Food Waste</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card 
            className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-md border-2 border-yellow-200 hover:border-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-50"
            onClick={() => router.push('/add-to-pantry')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="font-semibold text-[#063627] text-lg mb-1">Add Groceries</h3>
              <p className="text-[#7C7C7C] text-sm">Stock your pantry with new items</p>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-md border-2 border-green-200 hover:border-green-300 bg-gradient-to-br from-green-50 to-emerald-50"
            onClick={() => router.push('/log-waste?method=camera')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
              <h3 className="font-semibold text-[#063627] text-lg mb-1">Log Food Waste</h3>
              <p className="text-[#7C7C7C] text-sm">Track and learn from waste</p>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* AI Insights Card */}
          {latestInsight && (
            <Card className="bg-gradient-to-br from-[#063627] to-[#227D53] text-white shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                   Your frequently waste portions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white/80 mb-2">Fresh AI Insight</p>
                <Badge className="mb-4 bg-green-500 hover:bg-green-500">AI Powered</Badge>
                <div className="bg-white/10 rounded-xl p-4 mb-4 border border-white/20">
                  <p className="text-white/90 text-sm leading-relaxed">
                    "Try reducing the amount you cook in a single batch, starting with smaller portions and adjust based on what you actually consume to minimize leftovers."
                  </p>
                </div>
                <Button 
                  variant="link" 
                  className="text-white hover:text-white/80 p-0 h-auto font-semibold"
                  onClick={() => router.push(`/insights/${latestInsight.id}`)}
                >
                  View Full Analysis →
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Progress Card */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#063627]">
                 🎉 Great Progress!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#7C7C7C] mb-2">This week's update</p>
              <Badge className="mb-4 bg-green-100 text-green-800 hover:bg-green-100">On track</Badge>
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 mb-4 border border-green-200">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-green-800">Waste Budget</span>
                    <span className="text-2xl font-bold text-green-800">65%</span>
                  </div>
                  <Progress value={65} className="h-3" />
                </div>
              </div>
              <Button 
                variant="link" 
                className="text-[#227D53] hover:text-[#227D53]/80 p-0 h-auto font-semibold"
                onClick={() => router.push('/my-waste')}
              >
                View Your Trends →
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Pantry Watchlist */}
        {expiringSoonItems.length > 0 && (
          <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                Pantry Watchlist
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{`${getItemEmoji(item.name)} ${item.name}`}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {getStatusIndicator(item.daysUntilExpiration)}
                            <span>{item.daysUntilExpiration} days</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                           <Button variant="ghost" size="sm" onClick={() => router.push('/pantry')}>
                            <Edit className="w-4 h-4 mr-2" /> Edit
                          </Button>
                           <Button variant="ghost" size="sm" onClick={() => router.push('/pantry')}>
                            <CheckCircle className="w-4 h-4 mr-2" /> Mark Used
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button 
                variant="link" 
                className="w-full mt-4 text-yellow-700 hover:text-yellow-800 font-semibold"
                onClick={() => router.push('/pantry')}
              >
                Go to Pantry →
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
