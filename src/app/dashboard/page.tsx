

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useWasteLogStore } from '@/stores/waste-log-store';
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
  Info,
  Bell
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
import { SidebarTrigger } from '@/components/ui/sidebar';
import Image from 'next/image';
import { useGreenScoreStore } from '@/stores/greenScoreStore';

const oneHour = 60 * 60 * 1000;

function SmartBPIWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAchievement, setShowAchievement] = useState(true); // Default to true for demo
  const { user } = useAuth();
  
  if (!user) return null;

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <Landmark className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 mb-1">BPI Smart Savings</CardTitle>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600">Connected • Last sync: {mockBPIData.user.lastSync}</span>
              </div>
            </div>
          </div>
          <Badge variant="secondary">{mockBPIData.user.accountStatus}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-2 bg-gray-50 rounded-lg border border-gray-100">
            <div className="text-2xl font-bold text-gray-800 mb-1">₱{Math.round(mockBPIData.currentMonth.cashbackEarned)}</div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">This Month</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg border border-gray-100">
            <div className="text-2xl font-bold text-gray-800 mb-1">{mockBPIData.currentMonth.averageCashbackRate}%</div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Avg Cashback</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg border border-gray-100">
            <div className="text-2xl font-bold text-gray-800 mb-1">{mockBPIData.activeOffers.length}</div>
            <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Active Deals</div>
          </div>
        </div>

        {/* Conditional Achievement Banner */}
        {showAchievement && (
          <div className="bg-green-50 rounded-xl p-4 mb-6 border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-lg">🎉</span>
              </div>
              <div>
                <h4 className="font-semibold text-green-800 mb-1">Sustainability Goal Achieved!</h4>
                <p className="text-sm text-green-700">Unlocked <span className="font-semibold">₱{mockBPIData.sustainabilityIntegration.greenBonusEarned} bonus</span> cashback</p>
              </div>
            </div>
          </div>
        )}

        {/* Top Offer */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
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
            <Badge>{mockBPIData.activeOffers[0].cashbackRate}% Cashback</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Your shopping list matches <span className="font-semibold text-primary">{mockBPIData.activeOffers[0].matchingItems} items</span></p>
              <p className="text-xs text-gray-500">{mockBPIData.activeOffers[0].matchedItems}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">₱{mockBPIData.activeOffers[0].potentialSavings.toFixed(2)}</p>
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
         <Button 
          className="w-full text-base py-3 h-auto"
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>{isExpanded ? 'Hide Details' : 'View Deals & Shop Smart'}</span>
          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
}

const QuickActionButton = ({ icon, label, onClick, className }: { icon: React.ElementType, label: string, onClick: () => void, className?: string }) => {
    const Icon = icon;
    return (
        <button className="flex flex-col items-center gap-2 group" onClick={onClick} aria-label={label}>
            <div
                className={cn("h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center shadow-sm border border-primary/20 group-hover:bg-primary/20 transition-colors", className)}
            >
                <Icon className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xs font-medium text-gray-600 text-center">{label}</p>
        </button>
    );
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { logs, logsInitialized } = useWasteLogStore();
  const { liveItems, pantryInitialized, archiveItem } = usePantryLogStore();
  const { savingsEvents } = useSavingsStore();
  const analytics = useAnalytics();
  const { toast } = useToast();
  const { setExpiredItemsToShow } = useExpiryStore();
  const { score } = useGreenScoreStore();
  
  const [greeting, setGreeting] = useState("Good morning");

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

  const monthSavings = analytics?.savings.thisMonthAmount || 0;
  const savingsGoal = 5000;
  const goalProgress = Math.round(Math.min(100, Math.max(0, (monthSavings / savingsGoal) * 100)));

  if (!analytics) {
     return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-full">
       <div className="absolute inset-0 bg-center bg-cover" style={{ backgroundImage: "url('https://imgur.com/a/aTNvSHc')" }}></div>
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>
      <div className="relative p-5 space-y-6">

          <Card className="shadow-lg text-white relative overflow-hidden rounded-2xl">
            <Image src="https://i.imgur.com/YZsLBs4.png" layout="fill" objectFit="fill" alt="Impact background" className="z-0" />
            <div className="absolute inset-0 bg-black/40 z-0"></div>
            <div className="relative z-10">
              <CardHeader>
                  <CardTitle className="text-lg font-bold tracking-tight sm:text-xl text-white">{user?.name}'s Impact</CardTitle>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-2 gap-6 text-center">
                  <div>
                      <p className="text-xs text-green-200 mb-1">Virtual Savings</p>
                      <div className="flex items-center justify-center gap-2">
                          <p className="text-3xl md:text-4xl font-bold">{formatPeso(analytics.savings.thisWeekAmount)}</p>
                          <Info className="w-4 h-4 text-green-200 cursor-pointer" onClick={() => router.push('/my-savings')}/>
                      </div>
                  </div>
                  <div>
                      <p className="text-xs text-green-200 mb-1">Carbon Footprint</p>
                      <p className="text-3xl md:text-4xl font-bold">{analytics.waste.thisWeekValue.toFixed(2)}<span className="text-lg font-medium text-green-200">kg</span></p>
                  </div>
              </CardContent>
            </div>
          </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                    <Zap className="w-5 h-5" /> Quick Actions
                </CardTitle>
            </CardHeader>
            <CardContent>
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
                        label="BPI Hub" 
                        onClick={() => router.push('/bpi')}
                    />
                    <QuickActionButton 
                        icon={Bot} 
                        label="AI Chatbot" 
                        onClick={() => {
                           const chatButton = document.querySelector('[aria-label="Open Chat"]');
                            if (chatButton instanceof HTMLElement) {
                                chatButton.click();
                            }
                        }}
                    />
                </div>
            </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FunFactPanel wasteLogs={logs} savingsEvents={savingsEvents}/>
            <SmartBPIWidget />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <KitchenCoachPanel />
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-[#063627]">
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
                    <span className="text-xl md:text-2xl font-bold text-green-800">{goalProgress}%</span>
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
        
      </div>
    </div>
  );
}
