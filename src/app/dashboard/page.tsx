
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Bell, Bot, Brain, Trash, LineChart, ShoppingBasket, Utensils, CheckCircle, PackagePlus, X, Lightbulb, ShoppingCart, PanelLeft, TrendingUp, Award, Zap, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import type { User, Insight } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { useInsightStore } from '@/stores/insight-store';
import { usePantryLogStore } from '@/stores/pantry-store';
import { isToday, isWithinInterval, add, format } from 'date-fns';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPredictionPanelOpen, setIsPredictionPanelOpen] = useState(false);
  const [hasBeenViewed, setHasBeenViewed] = useState(false);

  const predictionPanelRef = useRef<HTMLDivElement>(null);
  const bellButtonRef = useRef<HTMLButtonElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);
  
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

  // Create focus cards array
  const focusCards = [
    ...(itemsExpiringToday.length > 0 ? [{
      type: 'urgent',
      title: '🚨 Use It Now!',
      subtitle: 'Items expiring today',
      badge: 'Urgent',
      bgColor: 'bg-gradient-to-br from-destructive via-destructive to-destructive/90',
      textColor: 'text-destructive-foreground',
      action: () => router.push('/pantry'),
      content: (
        <div className="space-y-2 mb-4">
          {itemsExpiringToday.slice(0, 2).map(item => (
            <div key={item.id} className="flex items-center space-x-2 bg-white/10 rounded-lg p-2">
              <span className="text-sm font-medium">{item.name}</span>
            </div>
          ))}
        </div>
      )
    }] : []),
    ...(latestInsight ? [{
      type: 'insight',
      title: `✨ ${latestInsight.patternAlert}`,
      subtitle: 'Fresh AI insight',
      badge: 'AI Powered',
      bgColor: 'bg-gradient-to-br from-primary/10 via-primary/5 to-background',
      textColor: 'text-foreground',
      action: () => router.push(`/insights/${latestInsight.id}`),
      content: (
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4 mb-4 border border-primary/10">
          <p className="text-sm leading-relaxed">{latestInsight.smartTip}</p>
        </div>
      )
    }] : []),
    {
      type: 'progress',
      title: '🎉 Great Progress!',
      subtitle: "This week's update",
      badge: 'On Track',
      bgColor: 'bg-gradient-to-br from-card via-card to-primary/5',
      textColor: 'text-foreground',
      action: () => router.push('/my-waste'),
      content: (
        <div className="bg-gradient-to-r from-green-50 to-green-100/50 rounded-xl p-4 mb-4 border border-green-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Waste budget</span>
            <span className="text-sm font-bold text-green-700">65% used</span>
          </div>
          <Progress value={65} className="h-3" />
        </div>
      )
    },
    {
      type: 'shopping',
      title: '🛒 Shop Smart',
      subtitle: 'Plan your next grocery run',
      badge: 'Smart Planning',
      bgColor: 'bg-gradient-to-br from-blue-50 via-blue-50/50 to-background',
      textColor: 'text-blue-900',
      action: () => router.push('/shopping'),
      content: (
        <div className="bg-gradient-to-r from-blue-100 to-blue-50 rounded-xl p-4 mb-4 border border-blue-200">
          <p className="text-sm leading-relaxed text-blue-800">
            Generate a shopping list based on what's running low in your pantry to avoid overbuying.
          </p>
        </div>
      )
    },
    {
      type: 'recipes',
      title: '🍳 Find a Recipe',
      subtitle: 'Use what you have',
      badge: 'Creative Cooking',
      bgColor: 'bg-gradient-to-br from-orange-50 via-orange-50/50 to-background',
      textColor: 'text-orange-900',
      action: () => router.push('/pantry'),
      content: (
        <div className="bg-gradient-to-r from-orange-100 to-orange-50 rounded-xl p-4 mb-4 border border-orange-200">
          <p className="text-sm leading-relaxed text-orange-800">
            Get recipe ideas based on your pantry items to cook delicious meals and prevent waste.
          </p>
        </div>
      )
    },
    {
      type: 'log_waste',
      title: '🗑️ Log Waste',
      subtitle: 'Track to get smarter',
      badge: 'Learn & Improve',
      bgColor: 'bg-gradient-to-br from-purple-50 via-purple-50/50 to-background',
      textColor: 'text-purple-900',
      action: () => router.push('/log-waste?method=camera'),
      content: (
        <div className="bg-gradient-to-r from-purple-100 to-purple-50 rounded-xl p-4 mb-4 border border-purple-200">
          <p className="text-sm leading-relaxed text-purple-800">
            Quickly log any food you waste to help the AI find your patterns and save you money.
          </p>
        </div>
      )
    }
  ];

  const totalSlides = focusCards.length;

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    if (carouselRef.current) {
      const slideWidth = carouselRef.current.offsetWidth;
      carouselRef.current.scrollTo({
        left: slideWidth * index,
        behavior: 'smooth'
      });
    }
  };

  const nextSlide = () => {
    const nextIndex = (currentSlide + 1) % totalSlides;
    goToSlide(nextIndex);
  };

  const prevSlide = () => {
    const prevIndex = currentSlide === 0 ? totalSlides - 1 : currentSlide - 1;
    goToSlide(prevIndex);
  };

  const hasUnseenNotification = (itemsExpiringSoon.length > 0 || (latestInsight && latestInsight.smartShoppingPlan));
  const hasNotification = hasUnseenNotification && !hasBeenViewed;

  const handleBellClick = () => {
    setIsPredictionPanelOpen(!isPredictionPanelOpen);
    if (hasUnseenNotification) {
        setHasBeenViewed(true);
    }
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="bg-gradient-to-br from-background via-background to-primary/2 text-foreground min-h-screen w-full max-w-full">
        <div className="min-h-screen pb-20 w-full max-w-full overflow-x-hidden">
          {/* Enhanced Header */}
          <motion.header 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-transparent sticky top-0 z-20 w-full max-w-full"
          >
              <div className="px-4 py-6 md:px-6 w-full max-w-full">
                  <div className="flex items-center justify-between w-full max-w-full">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                          <SidebarTrigger className="md:hidden flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                              <motion.h1 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text truncate"
                              >
                                 {greeting}, {user?.name?.split(' ')[0] || 'User'}! 👋
                              </motion.h1>
                              <motion.p 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-muted-foreground flex items-center gap-2"
                              >
                                <Zap className="h-4 w-4 text-primary flex-shrink-0" />
                                <span className="truncate">Let's reduce waste together</span>
                              </motion.p>
                          </div>
                      </div>
                      <div className="flex items-center space-x-3 flex-shrink-0">
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
                className="fixed top-0 right-0 w-full md:w-1/2 md:max-w-md bg-card/95 backdrop-blur-xl text-card-foreground border-b md:border-l border-border shadow-2xl z-30 max-w-full"
              >
                  <div className="px-4 py-4 md:px-6 w-full max-w-full">
                      <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Bell className="w-4 h-4 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold truncate">AI Notifications</h3>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => setIsPredictionPanelOpen(false)} className="p-1 hover:bg-destructive/10 hover:text-destructive flex-shrink-0">
                              <X className="w-5 h-5" />
                          </Button>
                      </div>
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-3 w-full max-w-full"
                      >
                          {itemsExpiringSoon.length > 0 && (
                              <motion.div 
                                whileHover={{ scale: 1.02 }}
                                className="p-4 bg-gradient-to-r from-yellow-50 via-yellow-50/50 to-transparent border border-yellow-200 rounded-xl w-full max-w-full"
                              >
                                  <div className="flex items-start space-x-3 w-full max-w-full">
                                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                          <p className="text-sm font-semibold text-yellow-800 mb-1 truncate">Expiring Soon</p>
                                          <p className="text-sm text-yellow-700 break-words">{itemsExpiringSoon.length} items in your pantry expire in the next 3 days.</p>
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
                                 className="p-4 bg-gradient-to-r from-blue-50 via-blue-50/50 to-transparent border border-blue-200 rounded-xl w-full max-w-full"
                               >
                                  <div className="flex items-start space-x-3 w-full max-w-full">
                                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <ShoppingCart className="w-4 h-4 text-blue-600" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                          <p className="text-sm font-semibold text-blue-800 mb-1 truncate">Smart Shopping Tip</p>
                                          <p className="text-sm text-blue-700 line-clamp-2 break-words">{latestInsight.smartShoppingPlan}</p>
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
            className="px-4 md:px-6 py-6 space-y-8 w-full max-w-full overflow-x-hidden"
          >
              {/* Custom Focus Carousel */}
              <motion.div variants={itemVariants} className="w-full max-w-full overflow-x-hidden">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-foreground mb-2">Today's Focus</h2>
                    <p className="text-muted-foreground text-sm">Your personalized action items</p>
                  </div>
                  
                  {/* Carousel Container */}
                  <div className="relative w-full max-w-full overflow-hidden">
                    {/* Carousel Track */}
                    <div 
                      ref={carouselRef}
                      className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-4 w-full max-w-full pb-2"
                      style={{ 
                        scrollbarWidth: 'none', 
                        msOverflowStyle: 'none',
                        maxWidth: '100%',
                        width: '100%'
                      }}
                    >
                      {focusCards.map((card, index) => (
                        <div 
                          key={index} 
                          className="flex-none snap-start w-full max-w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)] min-w-0"
                          style={{ maxWidth: '100%' }}
                        >
                          <motion.div
                            whileHover={{ y: -4, transition: { duration: 0.2 } }}
                            className="h-full w-full max-w-full"
                          >
                            <Card className={cn(
                              "border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 h-full overflow-hidden relative w-full max-w-full",
                              card.bgColor
                            )}>
                              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5 rounded-2xl"></div>
                              <CardContent className="p-6 relative z-10 w-full max-w-full">
                                <div className="flex items-start justify-between mb-4 w-full max-w-full">
                                  <div className="min-w-0 flex-1">
                                    <h2 className={cn("text-xl font-bold mb-1 truncate", card.textColor)}>{card.title}</h2>
                                    <p className={cn("text-sm mb-2 break-words", card.textColor === 'text-destructive-foreground' ? 'text-destructive-foreground/80' : 'text-muted-foreground')}>{card.subtitle}</p>
                                    <Badge variant="outline" className="mt-2">
                                      {card.badge}
                                    </Badge>
                                  </div>
                                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                                    {card.type === 'urgent' && <AlertTriangle className="w-6 h-6" />}
                                    {card.type === 'insight' && <Brain className="w-6 h-6 text-primary" />}
                                    {card.type === 'progress' && <Award className="w-6 h-6 text-green-600" />}
                                    {card.type === 'shopping' && <ShoppingCart className="w-6 h-6 text-blue-600" />}
                                    {card.type === 'recipes' && <Utensils className="w-6 h-6 text-orange-600" />}
                                    {card.type === 'log_waste' && <Trash className="w-6 h-6 text-purple-600" />}
                                  </div>
                                </div>
                                <div className="w-full max-w-full">
                                  {card.content}
                                </div>
                                <Button 
                                  className="w-full transition-all duration-200" 
                                  onClick={card.action}
                                  variant={card.type === 'urgent' ? 'secondary' : 'default'}
                                >
                                  {card.type === 'urgent' && 'Find Recipes →'}
                                  {card.type === 'insight' && 'See Full Analysis →'}
                                  {card.type === 'progress' && 'View Your Trends →'}
                                  {card.type === 'shopping' && 'Go to Shopping Hub →'}
                                  {card.type === 'recipes' && 'Find Recipes →'}
                                  {card.type === 'log_waste' && 'Log Waste Now →'}
                                </Button>
                              </CardContent>
                            </Card>
                          </motion.div>
                        </div>
                      ))}
                    </div>

                    {/* Navigation Buttons - Desktop Only */}
                    <div className="hidden md:block">
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm hover:bg-background"
                        onClick={prevSlide}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm hover:bg-background"
                        onClick={nextSlide}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Dots Indicator */}
                  <div className="flex justify-center gap-2 mt-4">
                    {focusCards.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all duration-200 hover:scale-125",
                          index === currentSlide 
                            ? 'bg-primary scale-125' 
                            : 'bg-muted-foreground/40'
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
    </div>
  );
}
