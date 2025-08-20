
'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usePantryLogStore } from '@/stores/pantry-store';
import { useRecipeStore } from '@/stores/recipe-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Search, 
  RefreshCw, 
  BookOpen, 
  Package, 
  Clock, 
  TrendingUp,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ListFilter,
  PackageCheck,
  Soup,
  Leaf,
  Camera,
  Mic,
  Type,
  CookingPot,
  Trash,
  History,
  ChevronLeft,
  ChevronRight,
  ThumbsDown,
  Brain,
  ShoppingCart,
  MessageCircleQuestion,
  Lightbulb,
  CalendarClock,
  Heart,
  ChevronRightIcon
} from 'lucide-react';
import type { PantryItem, Recipe, WasteLog } from '@/types';
import { PantryItemCard } from '@/components/pantry/PantryItemCard';
import { PantryItemDetails } from '@/components/pantry/PantryItemDetails';
import { deletePantryItem, getSavedRecipes, saveRecipe, unsaveRecipe, updatePantryItemStatus } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { getRecipeSuggestions } from '@/app/actions';
import { RecipeCard } from '@/components/pantry/RecipeCard';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { differenceInDays, startOfToday, format, parseISO, isSameDay, addDays, subDays, isAfter, startOfDay } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { motion, AnimatePresence } from 'framer-motion';
import { PantryItemEditor } from '@/components/pantry/PantryItemEditor';

const filterOptions = [
    { value: 'all', label: 'All Items' },
    { value: 'expiring', label: 'Expiring Soon' },
    { value: 'fresh', label: 'Fresh' },
];

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

const reasonIconMap: { [key: string]: React.ElementType } = {
  "Got spoiled/rotten": ThumbsDown,
  "Past expiry date": CalendarClock,
  "Forgot about it": Brain,
  "Cooked too much": Soup,
  "Bought too much": ShoppingCart, 
  "Plans changed": MessageCircleQuestion,
  "Other reason": Lightbulb,
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
            let numDays = 5; // Default for mobile
            if (containerRef.current) {
                const containerWidth = containerRef.current.offsetWidth;
                const buttonWidth = 60; // Approx width of a date button including gap (w-12 + gap-2)
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
        <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4"><History className="w-6 h-6" />Recent Waste History</h2>
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
                                    "flex-shrink-0 w-12 text-center rounded-lg p-1.5 transition-all border",
                                    isSameDay(date, selectedDate)
                                        ? 'bg-primary text-white border-primary shadow-md'
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-primary hover:bg-green-50'
                                )}
                                onClick={() => setSelectedDate(date)}
                                whileTap={{ scale: 0.95 }}
                            >
                                <p className={cn("text-xs uppercase", isSameDay(date, selectedDate) ? 'text-green-200' : 'text-gray-400')}>{format(date, 'MMM')}</p>
                                <p className={cn("text-base font-bold", isSameDay(date, selectedDate) ? 'text-white' : 'text-gray-800')}>{format(date, 'd')}</p>
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
        </div>
    );
};


export default function PantryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { liveItems, pantryInitialized } = usePantryLogStore();
  const { logs: wasteLogs } = useWasteLogStore();
  
  const [activeTab, setActiveTab] = useState('pantry');
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedItem, setSelectedItem] = useState<PantryItem | null>(null);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  const [isAddMethodOpen, setIsAddMethodOpen] = useState(false);
  

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const getStatus = useCallback((expirationDate: string) => {
    const today = startOfToday();
    const expiry = new Date(expirationDate);
    const daysLeft = differenceInDays(expiry, today);

    if (daysLeft < 0) return 'expired';
    if (daysLeft <= 3) return 'expiring';
    return 'fresh';
  }, []);


  // Filter and search items
  const filteredItems = useMemo(() => {
    let items = liveItems;
    
    // Apply search filter
    if (searchQuery) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply category filter
    if (filter !== 'all') {
      items = items.filter(item => getStatus(item.estimatedExpirationDate) === filter);
    }
    
    return items.sort((a,b) => new Date(a.estimatedExpirationDate).getTime() - new Date(b.estimatedExpirationDate).getTime());
  }, [liveItems, filter, searchQuery, getStatus]);

  const handleDelete = async (itemId: string) => {
    if (!user) return;
    setIsDeleting(itemId);
    try {
      await deletePantryItem(user.uid, itemId);
      toast({ title: 'Success', description: 'Item deleted from pantry.' });
      if (selectedItem?.id === itemId) {
        setSelectedItem(null);
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete item.' });
    } finally {
      setIsDeleting(null);
    }
  };


  const handleMethodSelect = (method: 'camera' | 'voice' | 'text') => {
    setIsAddMethodOpen(false);
    if (activeTab === 'pantry') {
      router.push(`/add-to-pantry?method=${method}`);
    } else {
      router.push(`/log-waste?method=${method}`);
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2"><CookingPot className="w-8 h-8" />My Pantry</h1>
            <Popover open={isAddMethodOpen} onOpenChange={setIsAddMethodOpen}>
              <PopoverTrigger asChild>
                 <Button className="bg-primary hover:bg-primary/90 h-10 px-4 rounded-lg text-sm">
                  {activeTab === 'pantry' ? (
                    <>
                      <span>Add Items</span>
                      <Plus className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      <span>Log Waste</span>
                      <Trash className="w-4 h-4 ml-2" />
                    </>
                  )}
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

          <div className="flex bg-gray-200/70 p-1 rounded-xl mb-6">
            <button
              onClick={() => setActiveTab('pantry')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all duration-300 focus:outline-none focus:ring-0 focus:ring-offset-0',
                activeTab === 'pantry'
                  ? 'bg-white text-gray-800 shadow-md font-semibold'
                  : 'bg-transparent text-gray-500'
              )}
            >
              <CookingPot className="w-4 h-4" />
              My Pantry
            </button>
            <button
              onClick={() => setActiveTab('scraps')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all duration-300 focus:outline-none focus:ring-0 focus:ring-offset-0',
                activeTab === 'scraps'
                  ? 'bg-white text-gray-800 shadow-md font-semibold'
                  : 'bg-transparent text-gray-500'
              )}
            >
              <Trash className="w-4 h-4" />
              Waste Bin
            </button>
          </div>
          
          {activeTab === 'pantry' && (
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                        placeholder="Search your pantry..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11 h-12 text-base bg-white border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                </div>
                <div className="flex gap-2 items-center overflow-x-auto pb-2 scrollbar-hide">
                    {filterOptions.map(opt => (
                        <Button 
                            key={opt.value}
                            variant="outline"
                            size="sm"
                            onClick={() => setFilter(opt.value)}
                            className={cn(
                                "rounded-full border-gray-300 transition-all duration-200 whitespace-nowrap h-9",
                                filter === opt.value 
                                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90" 
                                    : "bg-white hover:border-primary hover:text-primary"
                            )}
                        >
                            {opt.label}
                        </Button>
                    ))}
                </div>
            </div>
          )}
        </div>

        {activeTab === 'pantry' ? (
        <>
            {/* Pantry Items */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Your Items</h2>
                    <span className="text-sm text-gray-500">{filteredItems.length} items found</span>
                </div>
    
                {!pantryInitialized ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Card key={i} className='h-32 animate-pulse bg-gray-100'></Card>
                        ))}
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No items found</h3>
                        <p className="text-gray-500 mb-4 px-4">
                        {liveItems.length === 0 
                            ? "Your pantry is empty. Let's add some groceries!"
                            : "Clear your search or filters to see all items."
                        }
                        </p>
                        <Button onClick={() => router.push('/add-to-pantry')} className="h-11 text-base">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Groceries
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                    {filteredItems.map((item) => (
                        <PantryItemCard
                        key={item.id}
                        item={item}
                        onSelect={setSelectedItem}
                        onEdit={setEditingItem}
                        onDelete={handleDelete}
                        isDeleting={isDeleting === item.id}
                        />
                    ))}
                    </div>
                )}
            </div>
            
            <div 
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between gap-4 cursor-pointer hover:bg-green-50 transition-colors"
                onClick={() => router.push('/cook-shop')}
            >
                <div>
                    <h3 className="font-bold text-gray-800">Cook & Shop Hub</h3>
                    <p className="text-sm text-gray-500">Get recipe ideas and build your shopping list.</p>
                </div>
                <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            </div>

        </>
        ) : (
            <RecentWasteHistory logs={wasteLogs} />
        )}

        {/* Item Details Modal */}
        {selectedItem && (
          <PantryItemDetails
            item={selectedItem}
            isOpen={!!selectedItem}
            onClose={() => setSelectedItem(null)}
            onDelete={handleDelete}
          />
        )}
        {/* Item Editor Modal */}
        {editingItem && (
          <PantryItemEditor
            item={editingItem}
            isOpen={!!editingItem}
            onClose={() => setEditingItem(null)}
          />
        )}
      </div>
    </div>
  );
}
