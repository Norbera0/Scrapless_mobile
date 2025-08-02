
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Bell, Bot, Brain, Trash, LineChart, ShoppingBasket, Utensils, CheckCircle, PackagePlus, X, Lightbulb, ShoppingCart, PanelLeft, TrendingUp, Award, Zap, BarChart3 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PantryHealthScore } from '@/components/dashboard/PantryHealthScore';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { motion, AnimatePresence } from 'framer-motion';

const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    return name.charAt(0).toUpperCase();
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

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
      'progress',
      'shopping',
      'recipes',
      'log_waste'
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
    <div className="bg-gradient-to-br from-background via-background to-primary/2 text-foreground min-h-screen">
      <div className="min-h-screen pb-20">
        {/* Enhanced Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-transparent sticky top-0 z-20"
        >
            <div className="px-4 py-6 md:px-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <SidebarTrigger className="md:hidden" />
                        <div>
                            <motion.h1 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2 }}
                              className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text"
                            >
                               {greeting}, {user?.name?.split(' ')[0] || 'User'}! 👋
                            </motion.h1>
                            <motion.p 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 }}
                              className="text-muted-foreground flex items-center gap-2"
                            >
                              <Zap className="h-4 w-4 text-primary" />
                              Let's reduce waste together
                            </motion.p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button ref={bellButtonRef} variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all duration-200" onClick={handleBellClick}>
                            <Bell className="w-6 h-6" />
                            <AnimatePresence>
                              {hasNotification && (
                                <motion.span 
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                  className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"
                                />
                              )}
                            </AnimatePresence>
                          </Button>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                          <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                             <AvatarFallback className='bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold'>{getInitials(user?.name)}</AvatarFallback>
                          </Avatar>
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.header>

        {/* Enhanced Prediction Panel */}
        <AnimatePresence>
          {isPredictionPanelOpen && (
            <motion.div 
              id="predictionPanel" 
              ref={predictionPanelRef} 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 w-full md:w-1/2 md:max-w-md bg-card/95 backdrop-blur-xl text-card-foreground border-b md:border-l border-border shadow-2xl z-30"
            >
                <div className="px-4 py-4 md:px-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Bell className="w-4 h-4 text-primary" />
                          </div>
                          <h3 className="text-lg font-semibold">AI Notifications</h3>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setIsPredictionPanelOpen(false)} className="p-1 hover:bg-destructive/10 hover:text-destructive">
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-3"
                    >
                        {itemsExpiringSoon.length > 0 && (
                            <motion.div 
                              whileHover={{ scale: 1.02 }}
                              className="p-4 bg-gradient-to-r from-yellow-50 via-yellow-50/50 to-transparent border border-yellow-200 rounded-xl"
                            >
                                <div className="flex items-start space-x-3">
                                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-yellow-800 mb-1">Expiring Soon</p>
                                        <p className="text-sm text-yellow-700">{itemsExpiringSoon.length} items in your pantry expire in the next 3 days.</p>
                                        <Badge variant="outline" className="mt-2 border-yellow-300 text-yellow-700 text-xs">
                                          Action Required
                                        </Badge>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        {latestInsight && latestInsight.smartShoppingPlan && (
                             <motion.div 
                               whileHover={{ scale: 1.02 }}
                               className="p-4 bg-gradient-to-r from-blue-50 via-blue-50/50 to-transparent border border-blue-200 rounded-xl"
                             >
                                <div className="flex items-start space-x-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <ShoppingCart className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-blue-800 mb-1">Smart Shopping Tip</p>
                                        <p className="text-sm text-blue-700 line-clamp-2">{latestInsight.smartShoppingPlan}</p>
                                        <Badge variant="outline" className="mt-2 border-blue-300 text-blue-700 text-xs">
                                          AI Suggestion
                                        </Badge>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                         {!hasUnseenNotification && (
                             <div className="text-center text-muted-foreground py-8">
                                 <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-3">
                                   <CheckCircle className="w-8 h-8" />
                                 </div>
                                 <p className="font-medium">All caught up!</p>
                                 <p className="text-sm">No new notifications right now.</p>
                             </div>
                        )}
                    </motion.div>
                </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="px-4 md:px-6 py-6 space-y-8"
        >
            {/* Enhanced Focus Carousel */}
            <motion.div variants={itemVariants} className="overflow-hidden">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-foreground mb-2">Today's Focus</h2>
                  <p className="text-muted-foreground text-sm">Your personalized action items</p>
                </div>
                <Carousel setApi={setCarouselApi} opts={{ align: "start" }}>
                    <CarouselContent className="-ml-4">
                        {itemsExpiringToday.length > 0 && (
                            <CarouselItem className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                                <motion.div
                                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                  className="h-full"
                                >
                                  <Card className="bg-gradient-to-br from-destructive via-destructive to-destructive/90 border-destructive/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 h-full text-destructive-foreground overflow-hidden relative">
                                      <div className="absolute inset-0 bg-red-500/5 rounded-2xl"></div>
                                      <CardContent className="p-6 relative z-10">
                                          <div className="flex items-start justify-between mb-4">
                                              <div>
                                                  <h2 className="text-xl font-bold mb-1">🚨 Use It Now!</h2>
                                                  <p className="text-destructive-foreground/80 text-sm">Items expiring today</p>
                                                  <Badge variant="secondary" className="mt-2 bg-white/20 text-white border-white/30">
                                                    Urgent
                                                  </Badge>
                                              </div>
                                              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                                  <AlertTriangle className="w-6 h-6" />
                                              </div>
                                          </div>
                                          <div className="space-y-2 mb-4">
                                              {itemsExpiringToday.slice(0, 2).map(item => (
                                                  <div key={item.id} className="flex items-center space-x-2 bg-white/10 rounded-lg p-2">
                                                      <span className="text-sm font-medium">{item.name}</span>
                                                  </div>
                                              ))}
                                          </div>
                                          <Button className="w-full bg-white hover:bg-white/90 text-destructive font-semibold transition-all duration-200" onClick={() => router.push('/pantry')}>
                                              Find Recipes →
                                          </Button>
                                      </CardContent>
                                  </Card>
                                </motion.div>
                            </CarouselItem>
                        )}
                        {latestInsight && (
                            <CarouselItem className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                                <motion.div
                                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                  className="h-full"
                                >
                                  <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 h-full overflow-hidden relative">
                                      <div className="absolute inset-0 bg-primary/2 rounded-2xl"></div>
                                      <CardContent className="p-6 relative z-10">
                                          <div className="flex items-start justify-between mb-4">
                                              <div>
                                                  <h2 className="text-xl font-bold mb-1">✨ {latestInsight.patternAlert}</h2>
                                                  <p className="text-muted-foreground text-sm">Fresh AI insight</p>
                                                  <Badge variant="outline" className="mt-2 border-primary/30 text-primary">
                                                    AI Powered
                                                  </Badge>
                                              </div>
                                              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                                                  <Brain className="w-6 h-6 text-primary" />
                                              </div>
                                          </div>
                                          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4 mb-4 border border-primary/10">
                                              <p className="text-sm leading-relaxed">
                                                  {latestInsight.smartTip}
                                              </p>
                                          </div>
                                          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200" onClick={() => router.push(`/insights/${latestInsight.id}`)}>
                                              See Full Analysis →
                                          </Button>
                                      </CardContent>
                                  </Card>
                                </motion.div>
                            </CarouselItem>
                        )}
                        <CarouselItem className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                            <motion.div
                              whileHover={{ y: -4, transition: { duration: 0.2 } }}
                              className="h-full"
                            >
                              <Card className="bg-gradient-to-br from-card via-card to-primary/5 border-border rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 h-full overflow-hidden relative">
                                  <div className="absolute inset-0 bg-green-500/2 rounded-2xl"></div>
                                  <CardContent className="p-6 relative z-10">
                                      <div className="flex items-start justify-between mb-4">
                                          <div>
                                              <h2 className="text-xl font-bold mb-1">🎉 Great Progress!</h2>
                                              <p className="text-muted-foreground text-sm">This week's update</p>
                                              <Badge variant="outline" className="mt-2 border-green-300 text-green-700">
                                                <TrendingUp className="w-3 h-3 mr-1" />
                                                On Track
                                              </Badge>
                                          </div>
                                          <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                                              <Award className="w-6 h-6 text-green-600" />
                                          </div>
                                      </div>
                                      <div className="bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl p-4 mb-4 border border-green-200">
                                          <div className="flex items-center justify-between mb-3">
                                              <span className="text-sm font-medium">Waste budget</span>
                                              <span className="text-sm font-bold text-green-700">65% used</span>
                                          </div>
                                          <Progress value={65} className="h-3" />
                                      </div>
                                      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200" onClick={() => router.push('/my-waste')}>
                                          View Your Trends →
                                      </Button>
                                  </CardContent>
                              </Card>
                            </motion.div>
                        </CarouselItem>
                        <CarouselItem className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                            <motion.div
                              whileHover={{ y: -4, transition: { duration: 0.2 } }}
                              className="h-full"
                            >
                              <Card className="bg-gradient-to-br from-blue-50 via-blue-50/50 to-background border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 h-full overflow-hidden relative">
                                  <CardContent className="p-6 relative z-10">
                                      <div className="flex items-start justify-between mb-4">
                                          <div>
                                              <h2 className="text-xl font-bold mb-1 text-blue-900">🛒 Shop Smart</h2>
                                              <p className="text-blue-700 text-sm">Plan your next grocery run</p>
                                              <Badge variant="outline" className="mt-2 border-blue-300 text-blue-700">
                                                Smart Planning
                                              </Badge>
                                          </div>
                                          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                                              <ShoppingCart className="w-6 h-6 text-blue-600" />
                                          </div>
                                      </div>
                                      <div className="bg-gradient-to-r from-blue-100 to-blue-50 rounded-xl p-4 mb-4 border border-blue-200">
                                          <p className="text-sm leading-relaxed text-blue-800">
                                              Generate a shopping list based on what's running low in your pantry to avoid overbuying.
                                          </p>
                                      </div>
                                      <Button className="w-full bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200" onClick={() => router.push('/shopping')}>
                                          Go to Shopping Hub →
                                      </Button>
                                  </CardContent>
                              </Card>
                            </motion.div>
                        </CarouselItem>
                        <CarouselItem className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                            <motion.div
                              whileHover={{ y: -4, transition: { duration: 0.2 } }}
                              className="h-full"
                            >
                              <Card className="bg-gradient-to-br from-orange-50 via-orange-50/50 to-background border-orange-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 h-full overflow-hidden relative">
                                  <CardContent className="p-6 relative z-10">
                                      <div className="flex items-start justify-between mb-4">
                                          <div>
                                              <h2 className="text-xl font-bold mb-1 text-orange-900">🍳 Find a Recipe</h2>
                                              <p className="text-orange-700 text-sm">Use what you have</p>
                                              <Badge variant="outline" className="mt-2 border-orange-300 text-orange-700">
                                                Creative Cooking
                                              </Badge>
                                          </div>
                                          <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                                              <Utensils className="w-6 h-6 text-orange-600" />
                                          </div>
                                      </div>
                                      <div className="bg-gradient-to-r from-orange-100 to-orange-50 rounded-xl p-4 mb-4 border border-orange-200">
                                          <p className="text-sm leading-relaxed text-orange-800">
                                              Get recipe ideas based on your pantry items to cook delicious meals and prevent waste.
                                          </p>
                                      </div>
                                      <Button className="w-full bg-orange-600 text-white hover:bg-orange-700 transition-all duration-200" onClick={() => router.push('/pantry')}>
                                          Find Recipes →
                                      </Button>
                                  </CardContent>
                              </Card>
                            </motion.div>
                        </CarouselItem>
                        <CarouselItem className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                            <motion.div
                              whileHover={{ y: -4, transition: { duration: 0.2 } }}
                              className="h-full"
                            >
                              <Card className="bg-gradient-to-br from-purple-50 via-purple-50/50 to-background border-purple-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 h-full overflow-hidden relative">
                                  <CardContent className="p-6 relative z-10">
                                      <div className="flex items-start justify-between mb-4">
                                          <div>
                                              <h2 className="text-xl font-bold mb-1 text-purple-900">🗑️ Log Waste</h2>
                                              <p className="text-purple-700 text-sm">Track to get smarter</p>
                                              <Badge variant="outline" className="mt-2 border-purple-300 text-purple-700">
                                                Learn & Improve
                                              </Badge>
                                          </div>
                                          <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                                              <Trash className="w-6 h-6 text-purple-600" />
                                          </div>
                                      </div>
                                      <div className="bg-gradient-to-r from-purple-100 to-purple-50 rounded-xl p-4 mb-4 border border-purple-200">
                                          <p className="text-sm leading-relaxed text-purple-800">
                                              Quickly log any food you waste to help the AI find your patterns and save you money.
                                          </p>
                                      </div>
                                      <Button className="w-full bg-purple-600 text-white hover:bg-purple-700 transition-all duration-200" onClick={() => router.push('/log-waste?method=camera')}>
                                          Log Waste Now →
                                      </Button>
                                  </CardContent>
                              </Card>
                            </motion.div>
                        </CarouselItem>
                    </CarouselContent>
                </Carousel>
                <div className="carousel-dots">
                    {Array.from({ length: focusCards.length }).map((_, index) => (
                        <button 
                          key={index} 
                          onClick={() => handleDotClick(index)} 
                          className={cn(
                            "dot transition-all duration-200 hover:scale-125", 
                            index === currentSlide ? 'active' : ''
                          )} 
                        />
                    ))}
                </div>
            </motion.div>

            {/* Enhanced Impact Card */}
            <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-br from-card via-card to-destructive/5 border-border rounded-2xl shadow-lg text-card-foreground overflow-hidden relative">
                  <div className="absolute inset-0 bg-red-500/2 rounded-2xl"></div>
                  <CardContent className="p-6 relative z-10">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 bg-destructive/10 rounded-xl flex items-center justify-center">
                          <BarChart3 className="w-5 h-5 text-destructive" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">THIS WEEK'S IMPACT</h3>
                          <p className="text-sm text-muted-foreground">Your waste tracking results</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                          <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200"
                          >
                              <div className="text-3xl font-bold text-red-700 mb-2">₱{weeklyStats.totalPesoValue.toFixed(2)}</div>
                              <div className="text-sm text-red-600 font-medium">💸 Financial Leakage</div>
                          </motion.div>
                          <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200"
                          >
                              <div className="text-3xl font-bold text-red-700 mb-2">{weeklyStats.totalCarbonFootprint.toFixed(1)}kg</div>
                              <div className="text-sm text-red-600 font-medium">🌍 Carbon Footprint</div>
                          </motion.div>
                      </div>
                  </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <PantryHealthScore />
            </motion.div>

            {/* Enhanced Action Buttons */}
            <motion.div variants={itemVariants}>
              <Card className="bg-gradient-to-br from-card via-card to-primary/5 border-border rounded-2xl shadow-lg">
                  <CardContent className="p-6">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-1">Quick Actions</h3>
                        <p className="text-sm text-muted-foreground">Most common tasks</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <motion.button 
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 border border-primary/20 rounded-xl transition-all duration-200 text-foreground group" 
                            onClick={() => router.push('/add-to-pantry')}
                          >
                              <div className="w-12 h-12 bg-primary/20 group-hover:bg-primary/30 text-primary rounded-xl flex items-center justify-center mb-3 transition-colors">
                                  <PackagePlus className="w-6 h-6" />
                              </div>
                              <span className="font-semibold">Add Groceries</span>
                              <span className="text-xs text-muted-foreground mt-1">Stock your pantry</span>
                          </motion.button>
                          <motion.button 
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-destructive/10 to-destructive/5 hover:from-destructive/20 hover:to-destructive/10 border border-destructive/20 rounded-xl transition-all duration-200 text-foreground group" 
                            onClick={() => router.push('/log-waste?method=camera')}
                          >
                              <div className="w-12 h-12 bg-destructive/20 group-hover:bg-destructive/30 text-destructive rounded-xl flex items-center justify-center mb-3 transition-colors">
                                  <Trash className="w-6 h-6" />
                              </div>
                              <span className="font-semibold">Log Food Waste</span>
                              <span className="text-xs text-muted-foreground mt-1">Track & learn</span>
                          </motion.button>
                      </div>
                  </CardContent>
              </Card>
            </motion.div>

            {/* Enhanced AI Zone */}
             {latestInsight && (
                <motion.div variants={itemVariants}>
                  <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 rounded-2xl shadow-lg text-foreground overflow-hidden relative">
                      <div className="absolute inset-0 bg-primary/2 rounded-2xl"></div>
                      <CardContent className="p-6 relative z-10">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                              <Lightbulb className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold">💡 Your Smart Tip for Today</h3>
                              <p className="text-sm text-muted-foreground">Personalized AI recommendation</p>
                            </div>
                          </div>
                          <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-xl p-4 mb-4 border border-primary/20">
                              <p className="text-sm leading-relaxed">
                                  {latestInsight.smartShoppingPlan}
                              </p>
                          </div>
                          <Button variant="link" className="text-primary hover:text-primary/80 p-0 h-auto font-semibold" onClick={() => router.push(`/insights/${latestInsight.id}`)}>
                              View Full Insight →
                          </Button>
                      </CardContent>
                  </Card>
                </motion.div>
             )}

            {/* Enhanced Pantry Watchlist */}
            {itemsExpiringSoon.length > 0 && (
                <motion.div variants={itemVariants}>
                  <Card className="bg-gradient-to-br from-card via-card to-yellow-50 border-yellow-200 rounded-2xl shadow-lg text-card-foreground overflow-hidden relative">
                      <CardContent className="p-6 relative z-10">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                              <AlertTriangle className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold">PANTRY WATCHLIST</h3>
                              <p className="text-sm text-muted-foreground">Items needing attention</p>
                            </div>
                          </div>
                          <div className="space-y-3">
                              {itemsExpiringSoon.slice(0,2).map(item => (
                                  <motion.div 
                                    key={item.id} 
                                    whileHover={{ scale: 1.02 }}
                                    className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl"
                                  >
                                      <div className="flex items-center space-x-3">
                                          <div className="w-8 h-8 bg-yellow-200 rounded-lg flex items-center justify-center">
                                            <span className="text-sm">🥬</span>
                                          </div>
                                          <span className="font-medium">{item.name}</span>
                                      </div>
                                      <Badge variant="outline" className="border-yellow-400 text-yellow-700 font-medium">
                                        {Math.max(0, new Date(item.estimatedExpirationDate).getDate() - new Date().getDate())} days
                                      </Badge>
                                  </motion.div>
                              ))}
                          </div>
                           <Button variant="link" className="w-full mt-4 text-muted-foreground hover:text-foreground font-semibold" onClick={() => router.push('/pantry')}>
                              Go to Pantry →
                          </Button>
                      </CardContent>
                  </Card>
                </motion.div>
            )}
        </motion.div>
      </div>
    </div>
  );
}
