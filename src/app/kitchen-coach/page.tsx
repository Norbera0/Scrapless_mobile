
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Sparkles, Lightbulb, AlertTriangle, Wallet, Brain, Clock, Check, Target, HelpCircle, TrendingUp, ChefHat } from 'lucide-react';
import { getCoachAdvice, fetchCoachSolutions } from '../actions';
import { type KitchenCoachOutput, type GetCoachSolutionsOutput, type KitchenCoachInput, type GetCoachSolutionsInput } from '@/ai/schemas';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useAnalytics } from '@/hooks/use-analytics';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { usePantryLogStore } from '@/stores/pantry-store';
import { useSavingsStore } from '@/stores/savings-store';
import { format, parseISO, startOfMonth } from 'date-fns';
import { KitchenCoachWizard } from '@/components/coach/KitchenCoachWizard';
import { useBpiTrackPlanStore } from '@/stores/bpiTrackPlanStore';

type Solutions = GetCoachSolutionsOutput;

const loadingSteps = [
    "Analyzing your kitchen data...",
    "Formulating core hypothesis...",
    "Constructing your action plan...",
];

function SolutionCard({ solution, onSelect, isSelected, isUpdating }: { solution: Solutions['solutions'][0], onSelect: () => void, isSelected: boolean, isUpdating: boolean }) {
    return (
        <Card className="bg-background flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
                <CardTitle className='text-base flex items-center gap-2'>
                    {solution.title}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">{solution.description}</p>
                    <p className="text-lg font-bold text-green-600">💰 Save ~₱{solution.estimatedSavings}/mo</p>
                    <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>Success Rate</span>
                            <span>{Math.round(solution.successRate * 100)}%</span>
                        </div>
                        <Progress value={solution.successRate * 100} className="h-2" />
                    </div>
                </div>
                 <Button 
                    size="sm" 
                    className="w-full mt-4" 
                    onClick={onSelect} 
                    disabled={isUpdating}
                    variant={isSelected ? 'default' : 'outline'}
                 >
                    {isUpdating ? 
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                        (isSelected ? <Check className="mr-2 h-4 w-4" /> : null)
                    }
                    {isSelected ? "Working on it!" : `I'll try this`}
                 </Button>
            </CardContent>
        </Card>
    )
}

export default function KitchenCoachPage() {
    const { user } = useAuth();
    const { logs } = useWasteLogStore();
    const { liveItems, archivedItems } = usePantryLogStore();
    const { savingsEvents } = useSavingsStore();
    const { isLinked: isBpiLinked, trackPlanData } = useBpiTrackPlanStore();


    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingSolutions, setIsFetchingSolutions] = useState(false);
    
    const [analysis, setAnalysis] = useState<KitchenCoachOutput | null>(null);
    const [solutions, setSolutions] = useState<Solutions | null>(null);
    const [showWizard, setShowWizard] = useState(false);
    
    const [selectedSolutions, setSelectedSolutions] = useState<Set<string>>(new Set());
    const [loadingMessage, setLoadingMessage] = useState(loadingSteps[0]);

    const { toast } = useToast();
    const analytics = useAnalytics();
    
    useEffect(() => {
        let intervalId: NodeJS.Timeout | undefined;
        if (isLoading || isFetchingSolutions) {
            let step = 0;
            intervalId = setInterval(() => {
                step = (step + 1) % loadingSteps.length;
                setLoadingMessage(loadingSteps[step]);
            }, 1700);
        } else {
            setLoadingMessage(loadingSteps[0]); // Reset
        }
        return () => clearInterval(intervalId);
    }, [isLoading, isFetchingSolutions]);
    
    const handleAskCoach = async () => {
        setIsLoading(true);
        setAnalysis(null);
        setSolutions(null);
        if (!user || !analytics) {
            toast({ variant: 'destructive', title: 'Could not get advice', description: 'User or analytics data is not available.' });
            setIsLoading(false);
            return;
        }

        try {
            const input: KitchenCoachInput = {
                summaryMetrics: {
                    pantryHealthScore: analytics.pantryHealthScore,
                    totalVirtualSavings: analytics.totalVirtualSavings,
                    totalWasteValue: analytics.totalWasteValue,
                    engagementScore: analytics.engagementScore,
                    weather: analytics.weather,
                    waste: analytics.waste,
                    pantry: analytics.pantry,
                    savings: {
                        useRate: analytics.useRate,
                        savingsPerWastePeso: analytics.savingsPerWastePeso,
                    }
                },
                rawData: {
                    recentWasteLogs: logs.slice(0, 10).map(l => ({ date: l.date, items: l.items.map(i => ({name: i.name, pesoValue: i.pesoValue})), sessionWasteReason: l.sessionWasteReason })),
                    recentPantryLogs: liveItems.slice(0,10).map(i => ({ date: i.addedDate, items: [{name: i.name, estimatedCost: i.estimatedCost }]})),
                    recentUsageLogs: archivedItems.filter(i => i.status === 'used').slice(0, 5).map(i => ({ name: i.name, dateAdded: i.addedDate, dateUsed: i.usedDate })),
                    recentSavingsEvents: savingsEvents.slice(0,5).map(e => ({ type: e.type, amount: e.amount, date: e.date, description: e.description })),
                }
            };
            
            const analysisResult = await getCoachAdvice(input);
            setAnalysis(analysisResult);
            
            if (analysisResult) {
                setIsFetchingSolutions(true);
                const solutionsInput: GetCoachSolutionsInput = {
                    analysis: analysisResult,
                    userContext: {
                        userStage: 'regular_user',
                        previouslyAttemptedSolutions: [],
                        bpiTrackPlanData: isBpiLinked ? trackPlanData : undefined,
                    }
                };
                const solutionsResult = await fetchCoachSolutions(solutionsInput);
                setSolutions(solutionsResult);
                setIsFetchingSolutions(false);
                setShowWizard(true); 
            }

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
    
    const handleSelectSolution = (solutionTitle: string) => {
        setSelectedSolutions(prev => {
            const newSet = new Set(prev);
            if (newSet.has(solutionTitle)) {
                newSet.delete(solutionTitle);
            } else {
                newSet.add(solutionTitle);
            }
            return newSet;
        });
        toast({ title: 'Great!', description: "We'll track your progress on this solution." });
    };

    if (!analytics && !isLoading) {
        return (
            <div className="flex h-full items-center justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ml-2">Loading analytics...</p>
            </div>
        )
    }

    return (
        <>
            <div className="flex flex-col gap-6 p-4 md:p-6 bg-gray-50 min-h-full">
                <div className="space-y-1 text-center">
                    {/* @ts-ignore */}
                    <dotlottie-wc src="https://lottie.host/55c18eb1-89f2-4916-8211-c063d81a959d/Xf9C5RWU4z.lottie" style={{width: '300px', height: '300px', margin: '0 auto'}} speed="1" autoplay loop></dotlottie-wc>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
                        Kitchen Coach
                    </h1>
                    <p className="text-muted-foreground">
                        Your AI partner for a smarter, less wasteful kitchen.
                    </p>
                </div>
                
                <div className="text-center">
                     <Button 
                        size="lg" 
                        className="h-14 text-lg"
                        onClick={handleAskCoach} 
                        disabled={isLoading || isFetchingSolutions}
                    >
                        {isLoading || isFetchingSolutions ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                {loadingMessage}
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-5 w-5" />
                                Ask Your Coach for Advice
                            </>
                        )}
                    </Button>
                </div>

                {analysis && solutions && !showWizard && (
                    <div className="grid gap-6">
                        {/* Analysis Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base"><Brain className="text-primary" /> The Analysis</CardTitle>
                                <CardDescription>{analysis.title}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-base"><Target className="text-primary" /> What's Happening</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                                {analysis.story.situation.map((s, i) => <li key={i}>{s}</li>)}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-base"><HelpCircle className="text-primary" /> The Root Cause</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                                {analysis.story.rootCause.map((s, i) => <li key={i}>{s}</li>)}
                                            </ul>
                                        </CardContent>
                                    </Card>
                                </div>
                                 <Card className="bg-red-50 border-red-200">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium text-red-800">Financial Impact</CardTitle>
                                        <Wallet className="h-4 w-4 text-red-700" />
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-red-900 font-semibold">{analysis.story.impact}</p>
                                    </CardContent>
                                </Card>
                                <Card className="bg-amber-50 border-amber-200">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium text-amber-800">Prediction</CardTitle>
                                        <AlertTriangle className="h-4 w-4 text-amber-700" />
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-amber-900 font-semibold">{analysis.prediction}</p>
                                    </CardContent>
                                </Card>
                            </CardContent>
                        </Card>

                        {/* Solutions Section */}
                        <div>
                            <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2"><Lightbulb className="text-primary" />Actionable Solutions</h2>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {solutions.solutions.map((solution, index) => (
                                    <SolutionCard 
                                        key={index} 
                                        solution={solution} 
                                        onSelect={() => handleSelectSolution(solution.title)} 
                                        isSelected={selectedSolutions.has(solution.title)}
                                        isUpdating={isLoading}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Quick Win & Encouragement */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base"><Check className="text-primary" /> Quick Win</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{solutions.quickWin}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="text-primary" /> A Little Encouragement</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{solutions.encouragement}</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}
            </div>

            {analysis && solutions && showWizard && (
                 <KitchenCoachWizard 
                    isOpen={showWizard}
                    onClose={() => setShowWizard(false)}
                    analysis={analysis}
                    solutions={solutions}
                    onSelectSolution={handleSelectSolution}
                    selectedSolutions={selectedSolutions}
                    isUpdatingSolution={isLoading}
                    isBpiLinked={isBpiLinked}
                 />
            )}
        </>
    );
}
