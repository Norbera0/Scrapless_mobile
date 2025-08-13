
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { useInsightStore } from '@/stores/insight-store';
import { usePantryLogStore } from '@/stores/pantry-store';
import { useSavingsStore } from '@/stores/savings-store';
import { differenceInDays, startOfToday, parseISO, addDays, isBefore, isAfter } from 'date-fns';
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
  Loader2,
  Bot,
  Landmark,
  ShoppingCart,
  Trash2,
  Info
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatPeso, estimateRiceKgFromPesos, estimateWaterSavedLitersFromSavings } from '@/lib/utils';
import type { PantryItem, WasteLog } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getExpiredPantryItems, updatePantryItemStatus } from '@/lib/data';
import { FunFactPanel } from '@/components/dashboard/FunFactPanel';
import { useAnalytics } from '@/hooks/use-analytics';
import { useExpiryStore } from '@/stores/expiry-store';
import { KitchenCoachPanel } from '@/components/dashboard/KitchenCoachPanel';
import { cn } from '@/lib/utils';
import { FloatingChatAssistant } from '@/components/assistant/FloatingChatAssistant';


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
    'eggplant': '🍆',
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

const mockBPIData = {
  user: {
    name: "Raphael Berdin",
    isConnected: true,
    lastSync: "2 hours ago",
    accountStatus: "Active"
  },
  currentMonth: {
    cashbackEarned: 127.50,
    averageCashbackRate: 12,
    transactionCount: 8,
    sustainabilityBonus: 23.50
  },
  activeOffers: [
    {
      store: "Robinsons Supermarket",
      cashbackRate: 10,
      matchingItems: 5,
      potentialSavings: 45.00,
      distance: "0.8 km",
      validUntil: "Aug 15, 2025",
      details: "Your shopping list matches 5 items.",
      matchedItems: "Rice, Eggs, Cooking Oil, Onions, Garlic"
    },
  ],
  sustainabilityIntegration: {
    greenScore: 89,
    greenBonusEarned: 50,
    nextMilestone: 95,
    milestoneReward: "₱50 bonus cashback"
  },
  shoppingListMatches: [
    { item: 'Rice (5kg)', store: 'Robinsons', cashback: 5.00 },
    { item: 'Eggs (30pcs)', store: 'SM Grocery', cashback: 8.00 },
    { item: 'Cooking Oil', store: 'Puregold', cashback: 15.00 },
  ],
};


function SmartBPIWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAchievement, setShowAchievement] = useState(true); // Default to true for demo
  const { user } = useAuth();
  
  if (!user) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300 group h-full"
      role="article"
      aria-labelledby="bpi-widget-title"
      aria-describedby="bpi-widget-description"
    >
      <h3 id="bpi-widget-title" className="sr-only">BPI Smart Savings Widget</h3>
      <p id="bpi-widget-description" className="sr-only">
        Shows your current BPI cashback earnings and available offers
      </p>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#2d7d32] to-[#388e3c] rounded-xl flex items-center justify-center shadow-sm">
            <Landmark className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">BPI Smart Savings</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Connected • Last sync: {mockBPIData.user.lastSync}</span>
            </div>
          </div>
        </div>
        <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium border border-green-200">
          {mockBPIData.user.accountStatus}
        </span>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-100">
          <div className="text-2xl font-bold text-[#2d7d32] mb-1">₱{Math.round(mockBPIData.currentMonth.cashbackEarned)}</div>
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">This Month</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
          <div className="text-2xl font-bold text-green-600 mb-1">{mockBPIData.currentMonth.averageCashbackRate}%</div>
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Avg Cashback</div>
        </div>
        <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-100">
          <div className="text-2xl font-bold text-orange-500 mb-1">{mockBPIData.activeOffers.length}</div>
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Active Deals</div>
        </div>
      </div>

      {/* Conditional Achievement Banner */}
      {showAchievement && (
        <div className="bg-gradient-to-r from-green-50 via-yellow-50 to-green-50 rounded-xl p-4 mb-6 border border-green-200 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <pattern id="celebration" patternUnits="userSpaceOnUse" width="20" height="20">
                <circle cx="10" cy="10" r="2" fill="currentColor"/>
              </pattern>
              <rect width="100%" height="100%" fill="url(#celebration)"/>
            </svg>
          </div>
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">🎉</span>
            </div>
            <div>
              <h4 className="font-semibold text-green-800 mb-1">Sustainability Goal Achieved!</h4>
              <p className="text-sm text-green-700">Unlocked <span className="font-semibold">₱{mockBPIData.sustainabilityIntegration.greenBonusEarned} bonus</span> cashback</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Offer */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-5 mb-6 border border-gray-200 hover:border-[#2d7d32] transition-colors group">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center border border-gray-200">
              <span className="text-sm">🏪</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{mockBPIData.activeOffers[0].store}</h4>
              <p className="text-xs text-gray-500">{mockBPIData.activeOffers[0].distance} away • Open until 10 PM</p>
            </div>
          </div>
          <div className="bg-[#2d7d32] text-white px-3 py-1 rounded-full text-sm font-semibold">
            {mockBPIData.activeOffers[0].cashbackRate}% Cashback
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Your shopping list matches <span className="font-semibold text-[#2d7d32]">{mockBPIData.activeOffers[0].matchingItems} items</span></p>
            <p className="text-xs text-gray-500">{mockBPIData.activeOffers[0].matchedItems}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-[#2d7d32]">₱{mockBPIData.activeOffers[0].potentialSavings.toFixed(2)}</p>
            <p className="text-xs text-gray-500">Potential savings</p>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
         <div className="mt-4 border-t pt-4">
          <h4 className="font-medium mb-3">Your Shopping List Matches:</h4>
          <div className="space-y-2">
            {mockBPIData.shoppingListMatches.map((match, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm">{match.item} • {match.store}</span>
                <span className="text-green-600 font-medium">₱{match.cashback.toFixed(2)} cashback</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Button */}
       <button 
        className="w-full bg-gradient-to-r from-[#2d7d32] to-[#388e3c] text-white py-4 rounded-xl font-semibold text-base hover:from-green-700 hover:to-[#2d7d32] transform hover:scale-[1.02] transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 group"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label="View BPI deals and start smart shopping"
      >
        <span>{isExpanded ? 'Hide Details' : 'View Deals & Shop Smart'}</span>
        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>
    </div>
  );
}

const QuickActionButton = ({ icon, label, onClick, className }: { icon: React.ElementType, label: string, onClick: () => void, className?: string }) => {
    const Icon = icon;
    return (
        <div className="flex flex-col items-center gap-2">
            <Button
                size="icon"
                className={cn("h-16 w-16 rounded-full bg-[#1B5E20] hover:bg-[#2d7d32] shadow-lg", className)}
                onClick={onClick}
                aria-label={label}
            >
                <Icon className="h-8 w-8 text-white" />
            </Button>
            <p className="text-xs font-medium text-gray-600">{label}</p>
        </div>
    );
};

const oneHour = 60 * 60 * 1000;
type SortKey = keyof PantryItem | 'daysUntilExpiration';
type SortDirection = 'asc' | 'desc';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { logs, logsInitialized } = useWasteLogStore();
  const { insights } = useInsightStore();
  const { liveItems, pantryInitialized, archiveItem } = usePantryLogStore();
  const { savingsEvents } = useSavingsStore();
  const analytics = useAnalytics();
  const { toast } = useToast();
  const { setExpiredItemsToShow } = useExpiryStore();
  
  const [greeting, setGreeting] = useState("Good morning");
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'daysUntilExpiration', direction: 'asc' });
  const [isUpdatingItemId, setIsUpdatingItemId] = useState<string | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  useEffect(() => {
    if (user && logsInitialized && pantryInitialized) {
      const now = new Date().getTime();
      
      const lastExpiredCheck = localStorage.getItem(`lastExpiredCheck_${user.uid}`);
      const shouldCheck = !lastExpiredCheck || now - parseInt(lastExpiredCheck, 10) > oneHour;

      if (shouldCheck) {
         getExpiredPantryItems(user.uid).then(expiredItems => {
            if (expiredItems.length > 0) {
                setExpiredItemsToShow(expiredItems);
            }
         });
         localStorage.setItem(`lastExpiredCheck_${user.uid}`, now.toString());
      }
    }
  }, [user, logsInitialized, pantryInitialized, setExpiredItemsToShow]);


  const expiringSoonItems = useMemo(() => {
    if (!pantryInitialized) return [];
    return liveItems.filter(item => {
        const expirationDate = parseISO(item.estimatedExpirationDate);
        const today = startOfToday();
        const sevenDaysFromNow = addDays(today, 7);
        return isAfter(expirationDate, today) && isBefore(expirationDate, sevenDaysFromNow);
    }).map(item => ({
        ...item,
        daysUntilExpiration: differenceInDays(parseISO(item.estimatedExpirationDate), startOfToday())
    }));
  }, [liveItems, pantryInitialized]);

  const latestInsight = insights.length > 0 ? insights[0] : null;

  const monthSavings = analytics?.savings.thisMonthAmount || 0;
  const savingsGoal = 5000;
  const goalProgress = Math.round(Math.min(100, Math.max(0, (monthSavings / savingsGoal) * 100)));

  const sortedWatchlistItems = useMemo(() => {
    return [...expiringSoonItems].sort((a, b) => {
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
      archiveItem(item.id, 'used');
      
      updatePantryItemStatus(user.uid, item.id, 'used').catch(err => {
        console.error("Failed to mark item as used on server", err);
      });

      toast({ title: "Item used!", description: `You've used "${item.name}".`});
    } catch (error) {
      console.error("Error marking item as used:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not mark item as used.' });
    } finally {
      setIsUpdatingItemId(null);
    }
  };
  
  if (!analytics) {
     return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
      {/* Header Section */}
      <div className="mb-8 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border-b">
          <h1 className="text-3xl md:text-4xl font-bold text-green-800">{greeting}, {user?.name?.split(' ')[0] || 'Raphael'}!</h1>
          <p className="text-lg font-medium text-gray-600 mt-1">Ready to make a difference? 🌍</p>
      </div>

       {/* This Week's Impact (prioritize savings and impact equivalences) */}
      <Card className="mb-8 overflow-hidden rounded-2xl shadow-sm border border-gray-200 bg-gradient-to-b from-green-50 to-white">
          <CardHeader className="bg-green-600 p-4">
              <CardTitle className="text-lg font-semibold flex items-center gap-2 text-white">
                  <TrendingUp className="w-5 h-5" />
                  This Week's Impact
              </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-center">
               <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-sm font-medium text-gray-500">Virtual Savings</p>
                    <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-muted-foreground h-5 w-5"
                        onClick={() => router.push('/my-savings')}
                    >
                        <Info className="h-4 w-4" />
                        <span className="sr-only">See breakdown</span>
                    </Button>
                  </div>
                  <p className="text-4xl font-bold text-green-700">{formatPeso(analytics.savings.thisWeekAmount)}</p>
              </div>
              <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-500">Carbon Footprint</p>
                  <p className="text-4xl font-bold text-gray-800">{analytics.waste.thisWeekValue.toFixed(2)}<span className="text-2xl text-gray-500">kg</span></p>
                  <p className="text-xs text-gray-400">CO₂e from waste</p>
              </div>
          </CardContent>
      </Card>
      
       {/* Quick Actions Section */}
      <Card className="mb-8">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" /> Quick Actions
            </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
            <div className="flex items-center justify-around">
                <QuickActionButton 
                    icon={ShoppingCart} 
                    label="Add Pantry" 
                    onClick={() => router.push('/add-to-pantry')}
                />
                <QuickActionButton 
                    icon={Trash2} 
                    label="Log Waste" 
                    onClick={() => router.push('/log-waste?method=camera')}
                />
                <QuickActionButton 
                    icon={Landmark} 
                    label="BPI Widget" 
                    onClick={() => router.push('/bpi')}
                />
                <QuickActionButton 
                    icon={Bot} 
                    label="AI Chatbot" 
                    onClick={() => {
                       // This is a placeholder for opening the chatbot.
                       // A real implementation would use a state management library (e.g., Zustand, Redux)
                       // to control the visibility of the FloatingChatAssistant.
                       // For this prototype, we'll just log to the console.
                       console.log("Open AI Chatbot");
                       const chatButton = document.querySelector('[aria-label="Open Chat"]');
                        if (chatButton instanceof HTMLElement) {
                            chatButton.click();
                        }
                    }}
                />
            </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <FunFactPanel wasteLogs={logs} savingsEvents={savingsEvents}/>
          <SmartBPIWidget />
      </div>
      
      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <KitchenCoachPanel />

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
  );
}
