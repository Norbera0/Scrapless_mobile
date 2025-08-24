'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import { useRecipeStore } from '@/stores/recipe-store';
import { format, isSameDay, startOfToday, addDays, subDays } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Recipe } from '@/types';
import Image from 'next/image';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

const mealOrder: Recipe['mealType'][] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

const MealTypeBadge = ({ mealType }: { mealType: Recipe['mealType'] }) => {
    const config = {
        'Breakfast': { emoji: '🍳', color: 'bg-amber-100 text-amber-800' },
        'Lunch': { emoji: '☀️', color: 'bg-blue-100 text-blue-800' },
        'Dinner': { emoji: '🌙', color: 'bg-indigo-100 text-indigo-800' },
        'Snack': { emoji: '🥨', color: 'bg-green-100 text-green-800' },
    };
    const currentConfig = config[mealType!] || { emoji: '🍽️', color: 'bg-gray-100 text-gray-800' };

    return (
        <Badge variant="outline" className={cn("text-xs font-semibold border-none", currentConfig.color)}>
            {currentConfig.emoji} {mealType}
        </Badge>
    );
};

const DailyView = ({ scheduledRecipes, selectedDate, setSelectedDate }: { scheduledRecipes: Recipe[], selectedDate: Date, setSelectedDate: (d:Date) => void }) => {
    const mealsForDay = scheduledRecipes
        .filter(r => r.scheduledDate && isSameDay(new Date(r.scheduledDate), selectedDate))
        .sort((a,b) => mealOrder.indexOf(a.mealType) - mealOrder.indexOf(b.mealType));

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSelectedDate(subDays(selectedDate, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="font-semibold text-lg">{format(selectedDate, 'MMMM d, yyyy')}</h3>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
            {mealsForDay.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No meals planned for this day.</p>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {mealsForDay.map(recipe => (
                            <motion.div 
                                key={recipe.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <Card>
                                    <CardContent className="p-3 flex items-center gap-3">
                                        <div className="w-16 h-16 relative rounded-md overflow-hidden flex-shrink-0">
                                            {recipe.photoDataUri && <Image src={recipe.photoDataUri} alt={recipe.name} layout="fill" objectFit="cover" />}
                                        </div>
                                        <div className="flex-1">
                                            <MealTypeBadge mealType={recipe.mealType} />
                                            <p className="font-semibold leading-tight mt-1">{recipe.name}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

const MonthlyView = ({ scheduledRecipes, onDateSelect }: { scheduledRecipes: Recipe[], onDateSelect: (d:Date) => void }) => {
    const scheduledDates = useMemo(() => {
        return scheduledRecipes.map(r => new Date(r.scheduledDate!));
    }, [scheduledRecipes]);
    
    return (
        <Calendar
            mode="multiple"
            selected={scheduledDates}
            onSelect={(day) => {
                if (day) {
                    onDateSelect(day as unknown as Date);
                }
            }}
            className="flex justify-center"
            modifiers={{
                scheduled: scheduledDates,
            }}
            modifiersClassNames={{
                scheduled: 'bg-primary/20 rounded-full'
            }}
        />
    );
};

export function MealPlanner() {
    const { recipes } = useRecipeStore();
    const [view, setView] = useState<'daily' | 'monthly'>('daily');
    const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());

    const scheduledRecipes = useMemo(() => {
        return recipes.filter(r => r.isScheduled);
    }, [recipes]);
    
    if (scheduledRecipes.length === 0) {
        return (
            <Card className="text-center">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 justify-center"><CalendarIcon className="w-5 h-5"/>Your Meal Plan</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">You haven't scheduled any meals yet.</p>
                    <p className="text-sm text-muted-foreground">Click "Add to Plan" on a recipe to get started!</p>
                </CardContent>
            </Card>
        )
    }

    const handleDateSelectFromMonth = (date: Date) => {
        setSelectedDate(date);
        setView('daily');
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2"><CalendarIcon className="w-5 h-5"/>Your Meal Plan</CardTitle>
                    <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg">
                        <Button size="sm" onClick={() => setView('daily')} className={cn('h-7', view === 'daily' ? 'bg-background shadow' : 'bg-transparent text-muted-foreground')}>Daily</Button>
                        <Button size="sm" onClick={() => setView('monthly')} className={cn('h-7', view === 'monthly' ? 'bg-background shadow' : 'bg-transparent text-muted-foreground')}>Monthly</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {view === 'daily' ? (
                     <DailyView scheduledRecipes={scheduledRecipes} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
                ) : (
                    <MonthlyView scheduledRecipes={scheduledRecipes} onDateSelect={handleDateSelectFromMonth} />
                )}
            </CardContent>
        </Card>
    );
}
