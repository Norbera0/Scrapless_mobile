
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useSavingsStore } from '@/stores/savings-store';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PiggyBank, Sparkles, CheckCircle, ArrowRight, Banknote, Target, TrendingUp, Check, Globe, Settings, History, ChevronRight, Info, Edit, Save, Lightbulb, CookingPot } from 'lucide-react';
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
            title: "Transfer Successful!",
            description: "Your savings have been moved to your #MySaveUp account.",
        });
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6 bg-gray-50 min-h-screen">
             <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">💰 Virtual Savings</h1>
                    <p className="text-muted-foreground text-sm">
                        The value you've rescued from being wasted.
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
                            Virtual Savings Jar
                        </div>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                     <Info className="w-4 h-4 text-green-200 cursor-pointer" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs">Value is recovered by using at-risk items before expiry and following smart recipe suggestions.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                     <div>
                        <div className="text-sm text-green-200">Total Value Rescued</div>
                        <p className="text-4xl font-bold tracking-tighter">₱{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                     <div className="space-y-1 text-sm">
                        <div className="flex justify-between items-center text-green-200/80">
                           <span>Transferred to BPI #MySaveUp</span>
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
                                <span>₱{settings.savingsGoal.toLocaleString()}</span>
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

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-base">
                            <History /> Savings History
                        </span>
                    </CardTitle>
                    <CardDescription>See how your smart habits are adding up.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-96 pr-4">
                        {savingsEvents.length > 0 ? (
                             <Accordion type="single" collapsible className="w-full">
                                {savingsEvents.map(event => (
                                    <AccordionItem value={event.id} key={event.id}>
                                        <AccordionTrigger className="text-sm">
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex-1 text-left">
                                                    <p className="font-medium">{event.description}</p>
                                                    <p className="text-xs text-muted-foreground">{format(parseISO(event.date), 'MMM d, h:mm a')}</p>
                                                </div>
                                                <p className="font-semibold text-green-600 text-sm whitespace-nowrap pl-4">
                                                    + ₱{event.amount.toFixed(2)}
                                                </p>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-xs text-muted-foreground bg-secondary/50 p-3 rounded-md">
                                            <p><span className="font-semibold text-foreground">How it's calculated:</span> {event.calculationMethod}</p>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        ) : (
                             <p className="text-center text-muted-foreground py-10">No savings events yet. Use items from your pantry to start saving!</p>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">How Virtual Savings Work</CardTitle>
                    <CardDescription>Your savings are calculated based on your positive actions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                     <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 pt-1">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold">Avoiding Expiry</p>
                          <p className="text-muted-foreground">You earn a portion of an item's value when you use it close to its expiration date, preventing waste.</p>
                        </div>
                     </div>
                     <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 pt-1">
                           <CookingPot className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold">Cooking Recipes</p>
                          <p className="text-muted-foreground">You save the difference between cooking a suggested recipe and the cost of an average alternative meal.</p>
                        </div>
                     </div>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 pt-1">
                           <Lightbulb className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold">Following Coach Insights</p>
                          <p className="text-muted-foreground">You earn a bonus for committing to actionable solutions from your AI Kitchen Coach.</p>
                        </div>
                     </div>
                     <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 pt-1">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="font-semibold">Weekly Bonuses</p>
                            <p className="text-muted-foreground">Earn extra savings by having a lower total waste value this week compared to last week.</p>
                        </div>
                     </div>
                </CardContent>
            </Card>

        </div>
    );
}
