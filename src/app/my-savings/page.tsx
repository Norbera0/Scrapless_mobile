
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useSavingsStore } from '@/stores/savings-store';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PiggyBank, Sparkles, CheckCircle, ArrowRight, Banknote, Target, TrendingUp, Check, Globe, Settings, History, ChevronRight } from 'lucide-react';
import type { SavingsEvent } from '@/types';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';

const eventIcons: Record<SavingsEvent['type'], React.ElementType> = {
    avoided_expiry: CheckCircle,
    recipe_followed: Sparkles,
    smart_shopping: Sparkles,
    waste_reduction: Sparkles,
    solution_implemented: Sparkles,
};

export default function MySavingsPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const { savingsEvents, savingsInitialized } = useSavingsStore();
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthLoading && savingsInitialized) {
            setIsLoading(false);
        }
    }, [isAuthLoading, savingsInitialized]);

    const totalSavings = useMemo(() => {
        return savingsEvents.reduce((acc, event) => acc + event.amount, 0);
    }, [savingsEvents]);

    const handleTransfer = () => {
        router.push('/bpi/transfer');
    };
    
    // Mock data for goal
    const goalAmount = 3000;
    const currentGoalProgress = 1200;
    const goalProgressPercent = (currentGoalProgress / goalAmount) * 100;


    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6 bg-gray-50 min-h-screen">
             <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">💰 My Savings</h1>
                    <p className="text-muted-foreground text-sm">
                        Your virtual savings from reducing food waste.
                    </p>
                </div>
                 <div className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full">Connected</div>
            </div>

            <Card className="bg-primary text-white shadow-lg overflow-hidden relative">
                 <div className="absolute top-0 right-0 text-8xl opacity-10 pointer-events-none -mr-4 -mt-4">💰</div>
                <CardHeader>
                    <CardTitle className="text-sm font-semibold text-green-200 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">₱</div>
                        #MySaveUp
                    </CardTitle>
                    <CardDescription className="text-5xl font-bold tracking-tighter text-white pt-2">₱{totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-green-200 text-sm">Virtual savings from reducing food waste.</p>
                </CardContent>
                <CardFooter>
                     <Button 
                        variant="secondary" 
                        className="bg-white/20 text-white hover:bg-white/30 w-full h-12 text-base"
                        onClick={handleTransfer}
                    >
                        <Banknote className="mr-2" />
                        Transfer to BPI #MySaveUp
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base"><Target /> Current Goal: New Air Fryer</CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="flex justify-between items-center text-sm text-muted-foreground mb-1">
                        <span className="font-medium text-primary">₱{currentGoalProgress.toLocaleString()}</span>
                        <span>₱{goalAmount.toLocaleString()}</span>
                    </div>
                    <Progress value={goalProgressPercent} />
                     <p className="text-xs text-muted-foreground text-right mt-1">{goalProgressPercent.toFixed(0)}% to your goal</p>
                </CardContent>
            </Card>
            
             <div className="grid grid-cols-2 gap-4">
                <Button size="lg" className="h-14">Save Now</Button>
                <Button size="lg" variant="secondary" className="h-14">Set Goal</Button>
            </div>

            <Card>
                <CardContent className="p-4 flex items-center justify-between">
                    <div>
                        <p className="font-semibold">Auto-Save</p>
                        <p className="text-sm text-muted-foreground">Transfer weekly savings automatically</p>
                    </div>
                    <Switch defaultChecked />
                </CardContent>
            </Card>
            
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base"><History /> Savings History</CardTitle>
                    <CardDescription>See how your smart habits are adding up.</CardDescription>
                </CardHeader>
                <CardContent>
                    {savingsEvents.length > 0 ? (
                        <div className="space-y-3">
                            {savingsEvents.slice(0, 3).map(event => {
                                const Icon = eventIcons[event.type] || Sparkles;
                                return (
                                    <div key={event.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Icon className="w-5 h-5 text-primary" />
                                            <div>
                                                <p className="font-medium text-sm">{event.description}</p>
                                                <p className="text-xs text-muted-foreground">{format(parseISO(event.date), 'MMMM d, h:mm a')}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                             <p className="font-bold text-green-600 text-lg whitespace-nowrap">+ ₱{event.amount.toFixed(2)}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                     ) : (
                         <div className="text-center text-muted-foreground py-10">
                            <p>You haven't earned any savings yet.</p>
                        </div>
                     )}
                </CardContent>
                {savingsEvents.length > 3 && (
                    <CardFooter>
                        <Button variant="ghost" className="w-full">View All History</Button>
                    </CardFooter>
                )}
            </Card>


            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">Impact Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center gap-3 bg-green-50 p-3 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-lg">✅</div>
                        <p className="font-medium">12kg food waste prevented</p>
                     </div>
                     <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-lg">🌍</div>
                        <p className="font-medium">45kg CO₂ saved</p>
                     </div>
                </CardContent>
            </Card>

        </div>
    );
}

