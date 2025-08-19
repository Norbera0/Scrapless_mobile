
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useSavingsStore } from '@/stores/savings-store';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PiggyBank, Sparkles, CheckCircle, ArrowRight, Banknote, Target, TrendingUp, Check, Globe, Settings, History, ChevronRight, Info, Edit, Save } from 'lucide-react';
import type { SavingsEvent } from '@/types';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAnalytics } from '@/hooks/use-analytics';
import { useSavingsSummary } from '@/lib/bpi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { BpiTransferForm } from '@/app/bpi/transfer/page';
import { useUserSettingsStore } from '@/stores/user-settings-store';
import { saveUserSettings } from '@/lib/data';

export default function MySavingsPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const { savingsEvents, savingsInitialized } = useSavingsStore();
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();
    const analytics = useAnalytics();
    const { total, available } = useSavingsSummary(savingsEvents);
    const transferred = total - available;
    const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
    
    // Settings store
    const { settings, setSavingsGoal } = useUserSettingsStore();
    
    // State for goal editing
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [goalName, setGoalName] = useState('New Air Fryer'); // We'll keep the name client-side for now
    const [goalAmount, setGoalAmount] = useState(settings.savingsGoal);

    useEffect(() => {
        setGoalAmount(settings.savingsGoal);
    }, [settings.savingsGoal]);
    
    // This is a proxy for now. In a real app, you'd track how much of 'available' is allocated to the goal
    const currentGoalProgress = useMemo(() => {
        return Math.min(goalAmount, transferred + (available / 2)); 
    }, [goalAmount, transferred, available]);

    const goalProgressPercent = goalAmount > 0 ? (currentGoalProgress / goalAmount) * 100 : 0;

    useEffect(() => {
        if (!isAuthLoading && savingsInitialized) {
            setIsLoading(false);
        }
    }, [isAuthLoading, savingsInitialized]);
    
    const handleSetGoal = async () => {
        if(isEditingGoal) {
            if (!user) return;
            setSavingsGoal(goalAmount);
            await saveUserSettings(user.uid, { ...settings, savingsGoal: goalAmount });
            toast({ title: "Goal Updated!", description: `Your new monthly goal is ₱${goalAmount.toLocaleString()}.`});
        }
        setIsEditingGoal(!isEditingGoal);
    }
    
    const totalWasteKg = analytics?.totalWasteCO2e || 0; // Using CO2e as a proxy for waste kg for now

    if (isLoading || !analytics) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        )
    }
    
    const handleTransferComplete = () => {
        setIsTransferDialogOpen(false);
        toast({
            title: "Transfer Planned!",
            description: "Your transfer suggestion has been created. Check your BPI app to approve.",
        });
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
            </div>

            <Card className="bg-primary text-white shadow-lg overflow-hidden relative">
                 <div className="absolute top-0 right-0 text-8xl opacity-10 pointer-events-none -mr-4 -mt-4">💰</div>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold text-green-200">
                            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
                              <PiggyBank className="w-4 h-4" />
                            </div>
                            Virtual Savings
                        </div>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                     <Info className="w-4 h-4 text-green-200 cursor-pointer" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs">Savings are calculated based on using items before they expire and following recipe suggestions instead of buying more expensive alternatives.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                     <div>
                        <div className="text-sm text-green-200">Total Saved</div>
                        <p className="text-4xl font-bold tracking-tighter">₱{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                     <div className="space-y-1 text-sm">
                        <div className="flex justify-between items-center text-green-200/80">
                           <span>Transferred</span>
                           <span>₱{transferred.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                         <div className="flex justify-between items-center font-semibold">
                           <span>Available to Transfer</span>
                           <span>₱{available.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
                        <DialogTrigger asChild>
                             <Button 
                                variant="secondary" 
                                className="bg-white/20 text-white hover:bg-white/30 w-full h-12 text-base"
                            >
                                <Banknote className="mr-2" />
                                Transfer to BPI #MySaveUp via GCash
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Suggest a Transfer</DialogTitle>
                                <DialogDescription>Move your eco-savings to your BPI account.</DialogDescription>
                            </DialogHeader>
                            <BpiTransferForm onTransferComplete={handleTransferComplete} />
                        </DialogContent>
                    </Dialog>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base"><Target /> {isEditingGoal ? 'Edit Your Goal' : `Current Goal: ${goalName}`}</CardTitle>
                </CardHeader>
                <CardContent>
                     {isEditingGoal ? (
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="goal-name">Goal Name</Label>
                                <Input id="goal-name" value={goalName} onChange={e => setGoalName(e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="goal-amount">Target Amount (₱)</Label>
                                <Input id="goal-amount" type="number" value={goalAmount} onChange={e => setGoalAmount(Number(e.target.value))} />
                            </div>
                        </div>
                     ) : (
                        <>
                            <div className="flex justify-between items-center text-sm text-muted-foreground mb-1">
                                <span className="font-medium text-primary">₱{currentGoalProgress.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                                <span>₱{goalAmount.toLocaleString()}</span>
                            </div>
                            <Progress value={goalProgressPercent} />
                            <p className="text-xs text-muted-foreground text-right mt-1">{goalProgressPercent.toFixed(0)}% to your goal</p>
                        </>
                     )}
                </CardContent>
                 <CardFooter className="flex justify-between items-center gap-4">
                     <div className="flex items-center gap-3">
                        <Label htmlFor="auto-save-switch" className="font-semibold">Auto-Save</Label>
                        <Switch id="auto-save-switch" defaultChecked />
                    </div>
                    <Button onClick={handleSetGoal} size="sm">
                        {isEditingGoal ? <Save className="mr-2 h-4 w-4" /> : <Edit className="mr-2 h-4 w-4" />}
                        {isEditingGoal ? 'Save Goal' : 'Set Goal'}
                    </Button>
                </CardFooter>
            </Card>

             <Card className="cursor-pointer hover:bg-secondary/50">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between" onClick={() => router.push('/my-savings/history')}>
                        <span className="flex items-center gap-2 text-base">
                            <History /> Savings History
                        </span>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </CardTitle>
                    <CardDescription>See how your smart habits are adding up.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-48">
                        <div className="space-y-3 pr-4">
                            {savingsEvents.map(event => (
                                <div key={event.id} className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-sm">{event.description}</p>
                                        <p className="text-xs text-muted-foreground">{format(parseISO(event.date), 'MMM d, h:mm a')}</p>
                                    </div>
                                    <p className="font-semibold text-green-600 text-sm whitespace-nowrap">+ ₱{event.amount.toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">Impact Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center gap-3 bg-green-50 p-3 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-lg">✅</div>
                        <p className="font-medium">{analytics.totalWasteValue.toFixed(1)}kg food waste prevented</p>
                     </div>
                     <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-lg">🌍</div>
                        <p className="font-medium">{analytics.totalWasteCO2e.toFixed(1)}kg CO₂ saved</p>
                     </div>
                </CardContent>
            </Card>

        </div>
    );
}
