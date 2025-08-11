
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Sparkles, Lightbulb, ChefHat, AlertTriangle, ArrowRight, TrendingUp, Check, Info, Wallet, Brain, Clock } from 'lucide-react';
import { usePantryLogStore } from '@/stores/pantry-store';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { getCoachAdvice } from '../actions';
import { type KitchenCoachOutput, type KitchenCoachInput } from '@/ai/flows/get-kitchen-coach-advice';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const InsightStory = ({ story }: { story: KitchenCoachOutput['story'] }) => (
    <div className="space-y-4">
        <div>
            <h4 className="font-semibold flex items-center gap-2 mb-2"><Info className="w-5 h-5 text-blue-500" /> Situation</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-2">
                {story.situation.map((line, i) => <li key={i}>{line}</li>)}
            </ul>
        </div>
         <div>
            <h4 className="font-semibold flex items-center gap-2 mb-2"><Wallet className="w-5 h-5 text-green-500" /> Impact</h4>
            <p className="text-sm text-muted-foreground">{story.impact}</p>
        </div>
         <div>
            <h4 className="font-semibold flex items-center gap-2 mb-2"><Brain className="w-5 h-5 text-purple-500" /> Root Cause</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-2">
                 {story.rootCause.map((line, i) => <li key={i}>{line}</li>)}
            </ul>
        </div>
    </div>
);

const InsightSolutions = ({ solutions }: { solutions: KitchenCoachOutput['solutions'] }) => (
    <Accordion type="single" collapsible className="w-full">
        {solutions.map((s, i) => (
             <AccordionItem value={`item-${i}`} key={i}>
                <AccordionTrigger className="font-semibold text-base">{s.title}</AccordionTrigger>
                <AccordionContent className="space-y-3">
                    <p className="text-muted-foreground">{s.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-md">
                            <Clock className="w-4 h-4 text-primary" />
                            <div>
                                <p className="font-medium">Time to See Results</p>
                                <p className="text-muted-foreground">{s.timeToSee}</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-md">
                            <Wallet className="w-4 h-4 text-green-600" />
                            <div>
                                <p className="font-medium">Est. Savings</p>
                                <p className="text-muted-foreground">~₱{s.estimatedSavings}/mo</p>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground pt-2 italic border-t mt-2">
                        <strong>Filipino Context:</strong> {s.filipinoContext}
                    </p>
                </AccordionContent>
            </AccordionItem>
        ))}
    </Accordion>
);


export default function KitchenCoachPage() {
    const { user } = useAuth();
    const { liveItems, pantryInitialized } = usePantryLogStore();
    const { logs, logsInitialized } = useWasteLogStore();
    const [isLoading, setIsLoading] = useState(false);
    const [advice, setAdvice] = useState<KitchenCoachOutput | null>(null);
    const { toast } = useToast();

    const pantrySummary = useMemo(() => {
        if (!pantryInitialized) return { totalItems: 0, expiringSoon: 0 };
        const expiringSoon = liveItems.filter(item => {
            const daysLeft = (new Date(item.estimatedExpirationDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
            return daysLeft <= 3;
        }).length;
        return { totalItems: liveItems.length, expiringSoon };
    }, [liveItems, pantryInitialized]);
    
    const wasteSummary = useMemo(() => {
        if (!logsInitialized) return { last30DaysCount: 0, avgWeeklyWaste: 0 };
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentLogs = logs.filter(log => new Date(log.date) > thirtyDaysAgo);
        const totalWasteValue = recentLogs.reduce((sum, log) => sum + log.totalPesoValue, 0);
        
        return {
            last30DaysCount: recentLogs.length,
            avgWeeklyWaste: totalWasteValue / 4.3,
        }
    }, [logs, logsInitialized]);

    const handleAskCoach = async () => {
        setIsLoading(true);
        setAdvice(null);
        try {
            const input: KitchenCoachInput = {
                userName: user?.name?.split(' ')[0] || 'User',
                userStage: 'regular_user', // This can be dynamic in the future
                daysActive: 90, // This can be dynamic
                hasBpiData: false, // This can be dynamic
                wasteData: {
                    logs: logs.map(l => ({
                        date: l.date,
                        items: l.items.map(i => ({ name: i.name, amount: i.estimatedAmount, category: 'unknown' })), // Category can be enhanced
                        reason: l.sessionWasteReason || 'other',
                        totalValue: l.totalPesoValue,
                        dayOfWeek: new Date(l.date).toLocaleString('en-us', { weekday: 'long' })
                    })),
                    patterns: {
                        topWastedCategory: 'Vegetables', // This can be calculated
                        avgWeeklyWaste: wasteSummary.avgWeeklyWaste,
                        wasteFrequency: '2-3 times a week' // This can be calculated
                    }
                },
                pantryData: {
                    currentItems: liveItems.map(i => ({
                        name: i.name,
                        expiresIn: Math.max(0, Math.ceil((new Date(i.estimatedExpirationDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))),
                        category: 'unknown'
                    })),
                    healthScore: 85 // This can be calculated
                },
                pantryItemsCount: liveItems.length,
                wasteLogsCount: logs.length
            };

            const result = await getCoachAdvice(input);
            setAdvice(result);
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Analysis Failed',
                description: 'Could not get advice from the Kitchen Coach. Please try again later.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Kitchen Coach</h1>
                <p className="text-muted-foreground">
                    Your AI partner for a smarter, less wasteful kitchen.
                </p>
            </div>

            <Card className="bg-gradient-to-br from-primary to-green-700 text-primary-foreground">
                <CardHeader>
                    <CardTitle>Kitchen Vitals</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-white/10 rounded-lg">
                        <p className="text-sm font-medium">Pantry Items</p>
                        <p className="text-2xl font-bold">{pantrySummary.totalItems}</p>
                    </div>
                     <div className="p-4 bg-white/10 rounded-lg">
                        <p className="text-sm font-medium">Waste Logs (30d)</p>
                        <p className="text-2xl font-bold">{wasteSummary.last30DaysCount}</p>
                    </div>
                     <div className="p-4 bg-white/10 rounded-lg">
                        <p className="text-sm font-medium">Avg. Weekly Waste</p>
                        <p className="text-2xl font-bold">~₱{wasteSummary.avgWeeklyWaste.toFixed(0)}</p>
                    </div>
                </CardContent>
            </Card>

            <div className="text-center">
                <Button 
                    size="lg" 
                    className="h-14 text-lg"
                    onClick={handleAskCoach} 
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Analyzing your kitchen...
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2 h-5 w-5" />
                            Ask Your Coach
                        </>
                    )}
                </Button>
            </div>

            {advice && (
                <Card className="shadow-lg">
                    <CardHeader className="bg-secondary/50">
                        <CardTitle className="text-2xl flex items-center gap-3">
                             <Lightbulb className="w-8 h-8 text-amber-500" />
                             {advice.title}
                        </CardTitle>
                        <CardDescription>
                            Insight Type: {advice.insightType.replace(/_/g, ' ')} | Confidence: {advice.confidence}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <InsightStory story={advice.story} />
                        
                        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                             <h4 className="font-semibold flex items-center gap-2 mb-1 text-red-800"><AlertTriangle className="w-5 h-5" /> Prediction</h4>
                             <p className="text-sm text-red-900">{advice.prediction}</p>
                        </div>
                        
                        <div>
                             <h3 className="font-bold text-lg mb-2">Actionable Solutions</h3>
                             <InsightSolutions solutions={advice.solutions} />
                        </div>
                        
                         <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                             <h4 className="font-semibold flex items-center gap-2 mb-1 text-green-800"><Check className="w-5 h-5" /> Quick Win</h4>
                             <p className="text-sm text-green-900">{advice.quickWin}</p>
                        </div>
                        
                        <p className="text-sm text-center italic text-muted-foreground pt-4 border-t">"{advice.encouragement}"</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
