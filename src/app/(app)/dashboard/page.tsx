
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Bell, Bot, Brain, Trash, LineChart, ShoppingBasket, Utensils, CheckCircle, PackagePlus, X, Lightbulb, ShoppingCart } from 'lucide-react';
import type { User, Insight } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { useInsightStore } from '@/stores/insight-store';
import { usePantryLogStore } from '@/stores/pantry-store';
import { isToday, isWithinInterval, add, format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { PantryHealthScore } from '@/components/dashboard/PantryHealthScore';


const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    return name.charAt(0).toUpperCase();
}


export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { logs, logsInitialized } = useWasteLogStore();
  const { insights, insightsInitialized } = useInsightStore();
  const { liveItems, pantryInitialized } = usePantryLogStore();
  
  const [greeting, setGreeting] = useState("Good morning");
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPredictionPanelOpen, setIsPredictionPanelOpen] = useState(false);
  const [hasBeenViewed, setHasBeenViewed] = useState(false);

  const predictionPanelRef = useRef<HTMLDivElement>(null);
  const bellButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  useEffect(() => {
    if (!carouselApi) return;
    setCurrentSlide(carouselApi.selectedScrollSnap())
    carouselApi.on("select", () => {
      setCurrentSlide(carouselApi.selectedScrollSnap())
    })
  }, [carouselApi])
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isPredictionPanelOpen &&
        predictionPanelRef.current &&
        !predictionPanelRef.current.contains(event.target as Node) &&
        bellButtonRef.current &&
        !bellButtonRef.current.contains(event.target as Node)
      ) {
        setIsPredictionPanelOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPredictionPanelOpen]);

  const latestInsight = insights.length > 0 ? insights[0] : null;

  const itemsExpiringToday = liveItems.filter(item => isToday(new Date(item.estimatedExpirationDate)));
  
  const weeklyStats = logs
    .filter(log => isWithinInterval(new Date(log.date), { start: new Date(new Date().setDate(new Date().getDate() - 7)), end: new Date() }))
    .reduce((acc, log) => {
        acc.totalPesoValue += log.totalPesoValue;
        acc.totalCarbonFootprint += log.totalCarbonFootprint;
        return acc;
    }, { totalPesoValue: 0, totalCarbonFootprint: 0 });

  const itemsExpiringSoon = liveItems.filter(item => 
      isWithinInterval(new Date(item.estimatedExpirationDate), { start: new Date(), end: add(new Date(), {days: 3}) })
  );

  const focusCards = [
      itemsExpiringToday.length > 0 && 'urgent',
      latestInsight && 'insight',
      'progress'
  ].filter(Boolean);
  
  const handleDotClick = useCallback((index: number) => {
    carouselApi?.scrollTo(index)
  }, [carouselApi])

  const hasUnseenNotification = (itemsExpiringSoon.length > 0 || (latestInsight && latestInsight.smartShoppingPlan));
  const hasNotification = hasUnseenNotification && !hasBeenViewed;

  const handleBellClick = () => {
    setIsPredictionPanelOpen(!isPredictionPanelOpen);
    if (hasUnseenNotification) {
        setHasBeenViewed(true);
    }
  }


  return (
    <div className="gradient-bg min-h-screen">
      <div className="min-h-screen pb-20 relative">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-20">
            <div className="px-4 py-4 md:px-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-800">
                           {greeting}, {user?.name?.split(' ')[0] || 'User'}! 👋
                        </h1>
                        <p className="text-sm text-gray-500">Let's reduce waste together</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Button ref={bellButtonRef} variant="ghost" size="icon" className="relative text-gray-600 hover:text-gray-800" onClick={handleBellClick}>
                            <Bell className="w-6 h-6" />
                            {hasNotification && <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full notification-badge"></span>}
                        </Button>
                        <Avatar className="w-8 h-8">
                           <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </div>
        </header>

        {/* Prediction Panel (Hidden by default) */}
        <div 
          id="predictionPanel" 
          ref={predictionPanelRef} 
          className={cn(
            "fixed top-0 right-0 w-full md:w-1/2 md:max-w-md bg-white border-b md:border-l border-gray-200 shadow-lg z-30 prediction-panel",
            isPredictionPanelOpen && 'show'
          )}
        >
            <div className="px-4 py-4 md:px-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-800">AI Notifications</h3>
                    <Button variant="ghost" size="icon" onClick={() => setIsPredictionPanelOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </Button>
                </div>
                <div className="space-y-2">
                    {itemsExpiringSoon.length > 0 && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start space-x-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-yellow-800">Expiring Soon</p>
                                    <p className="text-sm text-yellow-700">{itemsExpiringSoon.length} items in your pantry expire in the next 3 days.</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {latestInsight && latestInsight.smartShoppingPlan && (
                         <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start space-x-2">
                                <ShoppingCart className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-blue-800">Smart Shopping Tip</p>
                                    <p className="text-sm text-blue-700">{latestInsight.smartShoppingPlan}</p>
                                </div>
                            </div>
                        </div>
                    )}
                     {!hasUnseenNotification && (
                         <div className="text-center text-gray-500 py-4">
                             <p>No new notifications right now.</p>
                         </div>
                    )}
                </div>
            </div>
        </div>

        <div className="px-4 md:px-6 py-6 space-y-5">
            {/* Today's Focus Carousel */}
            <div className="relative">
                <Carousel setApi={setCarouselApi}>
                    <CarouselContent className="-ml-0">
                        {itemsExpiringToday.length > 0 && (
                            <CarouselItem className="pl-0">
                                <Card className="focus-card bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl shadow-sm">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h2 className="text-lg font-semibold text-amber-900">🚨 Use It Now!</h2>
                                                <p className="text-sm text-amber-700">Items expiring today</p>
                                            </div>
                                            <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center">
                                                <AlertTriangle className="w-4 h-4 text-amber-700" />
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3 mb-4">
                                            {itemsExpiringToday.slice(0, 2).map(item => (
                                                <div key={item.id} className="flex items-center space-x-2">
                                                    <span className="text-sm font-medium text-gray-800">{item.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white" onClick={() => router.push('/pantry')}>
                                            Find Recipes for These Items →
                                        </Button>
                                    </CardContent>
                                </Card>
                            </CarouselItem>
                        )}
                        {latestInsight && (
                            <CarouselItem className="pl-4">
                                 <Card className="focus-card bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl shadow-sm">
                                     <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h2 className="text-lg font-semibold text-purple-900">✨ {latestInsight.patternAlert}</h2>
                                                <p className="text-sm text-purple-700">Fresh AI insight</p>
                                            </div>
                                            <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center">
                                                <Brain className="w-4 h-4 text-purple-700" />
                                            </div>
                                        </div>
                                        <div className="bg-white/60 rounded-lg p-4 mb-4">
                                            <p className="text-sm text-purple-800 leading-relaxed">
                                                {latestInsight.smartTip}
                                            </p>
                                        </div>
                                        <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white" onClick={() => router.push(`/insights/${latestInsight.id}`)}>
                                            See Full Analysis →
                                        </Button>
                                    </CardContent>
                                </Card>
                            </CarouselItem>
                        )}
                        <CarouselItem className="pl-4">
                             <Card className="focus-card bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm">
                                 <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h2 className="text-lg font-semibold text-green-900">🎉 Great Progress!</h2>
                                            <p className="text-sm text-green-700">This week's update</p>
                                        </div>
                                        <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center">
                                            <LineChart className="w-4 h-4 text-green-700" />
                                        </div>
                                    </div>
                                    <div className="bg-white/60 rounded-lg p-4 mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-green-800">Waste budget</span>
                                            <span className="text-sm font-medium text-green-800">65% used</span>
                                        </div>
                                        <Progress value={65} className="h-2 [&>div]:bg-green-600" />
                                    </div>
                                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => router.push('/trends')}>
                                        View Your Trends →
                                    </Button>
                                </CardContent>
                            </Card>
                        </CarouselItem>
                    </CarouselContent>
                </Carousel>
                <div className="carousel-dots">
                    {Array.from({ length: focusCards.length }).map((_, index) => (
                        <button key={index} onClick={() => handleDotClick(index)} className={cn("dot", index === currentSlide ? 'active' : '')} />
                    ))}
                </div>
            </div>

            <PantryHealthScore />

            {/* Main Impact Card */}
            <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">THIS WEEK'S IMPACT</h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-600 mb-1">₱{weeklyStats.totalPesoValue.toFixed(2)}</div>
                            <div className="text-sm text-gray-600">💸 Financial Leakage</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600 mb-1">{weeklyStats.totalCarbonFootprint.toFixed(1)}kg</div>
                            <div className="text-sm text-gray-600">🌍 Carbon Footprint</div>
                        </div>
                    </div>
                    <Button variant="link" className="w-full mt-4 text-blue-600 hover:text-blue-800" onClick={() => router.push('/trends')}>
                        View 7-Day Trend →
                    </Button>
                </CardContent>
            </Card>

            {/* Primary Action Buttons */}
            <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                <CardContent className="p-5">
                    <div className="grid grid-cols-2 gap-4">
                        <button className="flex flex-col items-center justify-center p-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors" onClick={() => router.push('/add-to-pantry')}>
                            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center mb-2">
                                <PackagePlus className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm font-medium text-emerald-700">Add Groceries</span>
                        </button>
                        <button className="flex flex-col items-center justify-center p-4 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors" onClick={() => router.push('/log-waste?method=camera')}>
                            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center mb-2">
                                <Trash className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm font-medium text-red-700">Log Food Waste</span>
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* Contextual AI Zone */}
             {latestInsight && (
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
                    <CardContent className="p-5">
                        <h3 className="text-base font-semibold text-blue-900 mb-3">💡 Your Smart Tip for Today</h3>
                        <div className="bg-white/60 rounded-lg p-4 mb-4">
                            <p className="text-sm text-blue-800 leading-relaxed">
                                {latestInsight.smartShoppingPlan}
                            </p>
                        </div>
                        <Button variant="link" className="text-blue-700 hover:text-blue-900 p-0 h-auto" onClick={() => router.push(`/insights/${latestInsight.id}`)}>
                            View Full Insight →
                        </Button>
                    </CardContent>
                </Card>
             )}

            {/* Virtual Pantry Peek */}
            {itemsExpiringSoon.length > 0 && (
                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <CardContent className="p-5">
                        <h3 className="text-base font-semibold text-gray-800 mb-4">PANTRY WATCHLIST</h3>
                        <div className="space-y-3">
                            {itemsExpiringSoon.slice(0,2).map(item => (
                                <div key={item.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <span className="text-sm font-medium text-gray-800">{item.name}</span>
                                    </div>
                                    <span className="text-xs text-amber-700 font-medium">Expires in {Math.max(0, new Date(item.estimatedExpirationDate).getDate() - new Date().getDate())} days</span>
                                </div>
                            ))}
                        </div>
                         <Button variant="link" className="w-full mt-4 text-gray-600 hover:text-gray-800" onClick={() => router.push('/pantry')}>
                            Go to Pantry →
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
      </div>
    </div>
  );
}

    