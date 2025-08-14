
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

const oneHour = 60 * 60 * 1000;

const QuickActionButton = ({ icon, label, onClick, className, ...props }: { icon: React.ElementType, label: string, onClick?: () => void, className?: string, [key: string]: any }) => {
    const Icon = icon;
    const ButtonComponent = onClick ? 'button' : 'div';

    return (
        <Button
            className={cn(
                "flex items-center justify-center gap-3 group px-6 py-3 rounded-lg bg-gradient-to-br from-primary to-green-700 shadow-lg border border-green-600 hover:from-primary hover:to-green-600 transition-all duration-300 transform hover:scale-105",
                className
            )}
            onClick={onClick}
            aria-label={label}
            {...props}
        >
            <Icon className="h-6 w-6 text-primary-foreground" />
            <span className="text-base font-semibold text-primary-foreground">{label}</span>
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

  const monthSavings = analytics?.savings.thisMonthAmount || 0;
  const savingsGoal = 5000;
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
            <Image src="/dashboard/user_impact_final.jpg" layout="fill" objectFit="cover" alt="Impact background" className="z-0" />
            <div className="absolute inset-0 bg-black/40 z-0"></div>
            <div className="relative z-10 p-6 space-y-4">
              <CardHeader className="p-0">
                  <CardTitle className="text-lg font-bold tracking-tight sm:text-xl text-white">{user?.name}'s Impact</CardTitle>
              </CardHeader>
              <CardContent className="p-0 grid grid-cols-2 gap-6 text-center">
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
               <div className="pt-4 border-t border-white/20">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-xs text-green-200">Monthly Savings Goal</p>
                      <p className="text-xs text-green-200 font-semibold">{formatPeso(monthSavings)} / {formatPeso(savingsGoal)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Progress value={goalProgress} className="h-2 flex-1" />
                        <p className="text-sm font-bold">{goalProgress}%</p>
                    </div>
                </div>
            </div>
          </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                    <Zap className="w-5 h-5" /> Quick Start
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-row items-center justify-around gap-4">
                    <Popover open={isAddMethodOpen} onOpenChange={setIsAddMethodOpen}>
                      <PopoverTrigger asChild>
                         <QuickActionButton 
                            icon={PackagePlus} 
                            label="Add Pantry Items" 
                        />
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
                             <QuickActionButton 
                                icon={Trash2} 
                                label="Log Food Waste" 
                            />
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
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                    <Sparkles className="w-5 h-5" /> Explore Other Services (plZ Add other services)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="h-auto py-3" onClick={() => router.push('/bpi')}>
                        <Landmark className="w-5 h-5 mr-2" />
                        <span className="font-semibold">BPI Hub</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-3" onClick={() => {
                           const chatButton = document.querySelector('[aria-label="Open Chat"]');
                            if (chatButton instanceof HTMLElement) {
                                chatButton.click();
                            }
                        }}>
                        <Bot className="w-5 h-5 mr-2" />
                        <span className="font-semibold">AI Chatbot</span>
                    </Button>
                </div>
            </CardContent>
        </Card>

        <Card className="shadow-sm overflow-hidden relative">
            <div className="absolute inset-0">
                 <Image 
                    src="/dashboard/recipe_generator_dashboard_2.png"
                    alt="Fresh vegetables illustration"
                    layout="fill"
                    objectFit="cover"
                    className="pointer-events-none"
                />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-white from-20% via-white/80 to-transparent"></div>
            <CardContent className="p-0">
                <div className="relative z-10 p-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 border-4 border-primary/20">
                        <ChefHat className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Don't let them go to waste!</h3>
                    <p className="text-muted-foreground mb-4">Your <span className="font-semibold text-primary">Tomatoes, Chicken, and Lettuce</span> are expiring soon.</p>
                    <Button variant="default" onClick={() => router.push('/pantry')}>
                        Explore Recipes
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
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
                    <p className="text-muted-foreground mb-4">Your <span className="font-semibold text-primary">Onions, Garlic, and Eggs</span> are low in stock.</p>
                    <Button variant="default" onClick={() => router.push('/shopping')}>
                        Go Shopping
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
                <div className="relative w-1/3 flex-shrink-0">
                    <Image
                        src="/dashboard/shopping_guide_dashboard_image.png"
                        alt="Shopping guide illustration"
                        layout="fill"
                        objectFit="contain"
                        className="pointer-events-none opacity-50 object-bottom"
                    />
                </div>
            </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FunFactPanel wasteLogs={logs} savingsEvents={savingsEvents}/>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <KitchenCoachPanel />
        </div>
        
      </div>
    </div>
  );
}
