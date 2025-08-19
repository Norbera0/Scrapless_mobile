
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
  Bell,
  PackagePlus,
  ChefHat,
  Camera,
  Mic,
  Type
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useUserSettingsStore } from '@/stores/user-settings-store';
import { WeeklyPerformancePanel } from '@/components/dashboard/WeeklyPerformancePanel';
import { WasteBreakdownCard } from '@/components/dashboard/WasteBreakdownCard';

const oneHour = 60 * 60 * 1000;

const QuickActionButton = ({ icon, label, onClick, className, ...props }: { icon: React.ElementType, label: string, onClick?: () => void, className?: string, [key: string]: any }) => {
    const Icon = icon;
    const ButtonComponent = onClick ? 'button' : 'div';

    return (
        <Button
            className={cn(
                "flex flex-col items-center justify-center gap-2 group px-4 py-4 rounded-xl h-24 w-full bg-gradient-to-br from-primary to-green-700 shadow-lg border border-green-600 hover:from-primary hover:to-green-600 transition-all duration-300 transform hover:scale-105",
                className
            )}
            onClick={onClick}
            aria-label={label}
            {...props}
        >
            <Icon className="h-6 w-6 text-primary-foreground" />
            <span className="text-sm font-semibold text-primary-foreground">{label}</span>
        </Button>
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
  const { settings } = useUserSettingsStore();
  
  const [greeting, setGreeting] = useState("Good morning");
  const [isAddMethodOpen, setIsAddMethodOpen] = useState(false);
  const [isLogWasteMethodOpen, setIsLogWasteMethodOpen] = useState(false);

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
  
  const expiringSoonMessage = useMemo(() => {
    const count = expiringSoonItems.length;
    if (count === 0) {
      return "Your pantry is looking fresh! No items expiring soon.";
    }

    const itemNames = expiringSoonItems
      .slice(0, 3)
      .map(item => item.name);

    let namesString = "";
    if (itemNames.length === 1) {
      namesString = itemNames[0];
    } else if (itemNames.length === 2) {
      namesString = `${itemNames[0]} and ${itemNames[1]}`;
    } else {
      namesString = `${itemNames[0]}, ${itemNames[1]}, and ${itemNames[2]}`;
    }

    return `Don't let them go to waste! ${count} of your food in the pantry including ${namesString} are expiring soon.`;
  }, [expiringSoonItems]);

  const lowStockEssentialsMessage = useMemo(() => {
    const essentials: { [key: string]: { threshold: number, unit?: string } } = {
        'onion': { threshold: 3 },
        'garlic': { threshold: 3 },
        'egg': { threshold: 4 },
        'rice': { threshold: 1, unit: 'kg' },
        'cooking oil': { threshold: 0.5, unit: 'l' },
    };

    const lowStockItems = Object.keys(essentials).map(key => {
        const itemInPantry = liveItems.find(pItem => pItem.name.toLowerCase().includes(key));
        if (!itemInPantry) return { name: key.charAt(0).toUpperCase() + key.slice(1), isLow: true };

        const config = essentials[key];
        // If unit is specified (like kg), check for that unit. Otherwise, check quantity.
        if (config.unit) {
            if (itemInPantry.unit.toLowerCase().includes(config.unit) && itemInPantry.quantity < config.threshold) {
                return { name: itemInPantry.name, isLow: true };
            }
        } else {
            if (itemInPantry.quantity < config.threshold) {
                return { name: itemInPantry.name, isLow: true };
            }
        }
        return { name: key.charAt(0).toUpperCase() + key.slice(1), isLow: false };
    }).filter(item => item.isLow);

    if (lowStockItems.length === 0) {
        return "Your kitchen essentials are well-stocked.";
    }

    const itemNames = lowStockItems.map(item => item.name);
    let namesString = itemNames[0];
    if (itemNames.length === 2) namesString = `${itemNames[0]} and ${itemNames[1]}`;
    if (itemNames.length > 2) namesString = `${itemNames.slice(0, 2).join(', ')}, and ${itemNames[2]}`;
    
    return `Your ${namesString} ${lowStockItems.length > 1 ? 'are' : 'is'} low in stock.`;
  }, [liveItems]);


  const monthSavings = analytics?.savings.thisMonthAmount || 0;
  const savingsGoal = settings.savingsGoal || 5000;
  const goalProgress = Math.round(Math.min(100, Math.max(0, (monthSavings / savingsGoal) * 100)));

  const handleMethodSelect = (type: 'pantry' | 'waste', method: 'camera' | 'voice' | 'text') => {
    if (type === 'pantry') {
        setIsAddMethodOpen(false);
        router.push(`/add-to-pantry?method=${method}`);
    } else {
        setIsLogWasteMethodOpen(false);
        router.push(`/log-waste?method=${method}`);
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
    <div className="relative min-h-full">
       <div className="absolute inset-0 bg-center bg-cover" style={{ backgroundImage: "url('/dashboard/total_impact_bg.jpg')" }}></div>
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>
      <div className="relative p-5 space-y-6">

          <Card className="shadow-lg text-white relative overflow-hidden rounded-2xl">
            <Image src="/dashboard/user_impact_final.jpg" layout="fill" objectFit="cover" alt="Dashboard hero image" className="z-0" data-ai-hint="impact savings" />
            <div className="absolute inset-0 bg-black/40 z-0"></div>
            <div className="relative z-10 p-6 space-y-4">
              <CardHeader className="p-0">
                  <CardTitle className="text-lg font-bold tracking-tight sm:text-xl">{user?.name}'s Impact</CardTitle>
              </CardHeader>
              <CardContent className="p-0 grid grid-cols-2 gap-6 text-center">
                  <div>
                      <p className="text-xs text-green-200 mb-1">Virtual Savings</p>
                      <div className="flex items-center justify-center gap-2">
                          <p className="text-2xl sm:text-3xl font-bold">{formatPeso(analytics.savings.thisWeekAmount)}</p>
                          <Info className="w-4 h-4 text-green-200 cursor-pointer" onClick={() => router.push('/my-savings')}/>
                      </div>
                  </div>
                  <div>
                      <p className="text-xs text-green-200 mb-1">Carbon Footprint</p>
                      <p className="text-2xl sm:text-3xl font-bold">{analytics.waste.thisWeekValue.toFixed(2)}<span className="text-base font-medium text-green-200">kg</span></p>
                  </div>
              </CardContent>
               <div className="pt-4 border-t border-white/20">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs text-green-200">Savings Goal</p>
                      <p className="text-xs text-green-200 font-semibold">{formatPeso(monthSavings)} / {formatPeso(savingsGoal)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Progress value={goalProgress} className="h-2 flex-1" style={{
                            // @ts-ignore
                            '--indicator-bg': '#FBBF24'
                        }} />
                        <p className="text-sm font-bold">{goalProgress}%</p>
                    </div>
                </div>
            </div>
          </Card>
        
        <div className="flex items-center justify-around gap-4">
            <Popover open={isAddMethodOpen} onOpenChange={setIsAddMethodOpen}>
              <PopoverTrigger asChild>
                <button className="relative aspect-square w-5/12 max-w-xs h-auto transition-transform duration-300 hover:scale-105 active:scale-100">
                    <Image
                      src="/dashboard/add_pantry_items_button_3.png"
                      alt="Add Pantry Items"
                      layout="fill"
                      objectFit="contain"
                    />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-primary">
                <div className="flex flex-col">
                  <Button variant="ghost" className="justify-start text-primary-foreground hover:bg-white/20" onClick={() => handleMethodSelect('pantry', 'camera')}>
                    <Camera className="w-4 h-4 mr-2" /> Scan with Camera
                  </Button>
                  <Separator className="my-1 bg-white/20" />
                  <Button variant="ghost" className="justify-start text-primary-foreground hover:bg-white/20" onClick={() => handleMethodSelect('pantry', 'voice')}>
                    <Mic className="w-4 h-4 mr-2" /> Use Voice Log
                  </Button>
                  <Separator className="my-1 bg-white/20" />
                  <Button variant="ghost" className="justify-start text-primary-foreground hover:bg-white/20" onClick={() => handleMethodSelect('pantry', 'text')}>
                    <Type className="w-4 h-4 mr-2" /> Type Manually
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Popover open={isLogWasteMethodOpen} onOpenChange={setIsLogWasteMethodOpen}>
                <PopoverTrigger asChild>
                    <button className="relative aspect-square w-5/12 max-w-xs h-auto transition-transform duration-300 hover:scale-105 active:scale-100">
                        <Image
                        src="/dashboard/log_food_waste_button_3.png"
                        alt="Log Food Waste"
                        layout="fill"
                        objectFit="contain"
                        />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-primary">
                    <div className="flex flex-col">
                    <Button variant="ghost" className="justify-start text-primary-foreground hover:bg-white/20" onClick={() => handleMethodSelect('waste', 'camera')}>
                        <Camera className="w-4 h-4 mr-2" /> Scan with Camera
                    </Button>
                    <Separator className="my-1 bg-white/20" />
                    <Button variant="ghost" className="justify-start text-primary-foreground hover:bg-white/20" onClick={() => handleMethodSelect('waste', 'voice')}>
                        <Mic className="w-4 h-4 mr-2" /> Use Voice Log
                    </Button>
                    <Separator className="my-1 bg-white/20" />
                    <Button variant="ghost" className="justify-start text-primary-foreground hover:bg-white/20" onClick={() => handleMethodSelect('waste', 'text')}>
                        <Type className="w-4 h-4 mr-2" /> Type Manually
                    </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>

        <Card className="shadow-sm overflow-hidden">
            <CardContent className="p-0 flex">
                <div className="p-6 flex-1">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 border-4 border-primary/20">
                        <ChefHat className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Don't let them go to waste!</h3>
                    <p className="text-muted-foreground mb-4 text-sm">{expiringSoonMessage}</p>
                    <Button variant="default" onClick={() => router.push('/pantry')}>
                        Explore Recipes
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
                <div className="relative w-1/3 flex-shrink-0">
                    <Image
                        src="/dashboard/recipe_generator_home_3.png"
                        alt="Recipe suggestions illustration"
                        layout="fill"
                        objectFit="cover"
                    />
                </div>
            </CardContent>
        </Card>

        <Card className="shadow-sm overflow-hidden">
            <CardContent className="p-0 flex">
                <div className="p-6 flex-1">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 border-4 border-primary/20">
                        <ShoppingCart className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Running low on essentials?</h3>
                    <p className="text-muted-foreground mb-4"><span className="font-semibold text-primary">{lowStockEssentialsMessage}</span></p>
                    <Button variant="default" onClick={() => router.push('/shopping')}>
                        Go Shopping
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
                 <div className="relative w-1/3 flex-shrink-0">
                    <Image
                        src="/dashboard/shopping_hub_home_2.png"
                        alt="Shopping hub illustration"
                        layout="fill"
                        objectFit="cover"
                    />
                </div>
            </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FunFactPanel wasteLogs={logs} savingsEvents={savingsEvents}/>
            <WasteBreakdownCard wasteLogs={logs} />
            <KitchenCoachPanel />
        </div>
        
      </div>
    </div>
  );
}
