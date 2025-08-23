
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Sparkles, Lightbulb, AlertTriangle, Wallet, Brain, Clock, Check, Target, HelpCircle, TrendingUp, ChefHat, Bot } from 'lucide-react';
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
import { format, parseISO, startOfMonth, formatDistanceToNow } from 'date-fns';
import { KitchenCoachWizard } from '@/components/coach/KitchenCoachWizard';
import { useBpiTrackPlanStore } from '@/stores/bpiTrackPlanStore';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useCoachStore } from '@/stores/coach-store';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';

type Solutions = GetCoachSolutionsOutput;

const loadingSteps = [
    "Analyzing your kitchen data...",
    "Connecting to your kitchen's history...",
    "Identifying unique consumption patterns...",
    "Formulating core hypothesis...",
    "Evaluating financial and environmental impact...",
    "Cross-referencing with sustainability models...",
    "Personalizing your recommendations...",
    "Constructing your action plan...",
];

function SolutionCard({ solution, onSelect, isSelected, isUpdating }: { solution: Solutions['solutions'][0], onSelect: () => void, isSelected: boolean, isUpdating: boolean }) {
    return (
        <Card className="bg-background flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
            <CardHeader>
                <CardTitle className='text-base flex items-center gap-2'>
                    {solution.title}
                </CardTitle>
                <CardDescription className="text-lg font-bold text-green-600">💰 Save ~₱{solution.estimatedSavings}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">{solution.description}</p>
                </div>
                 <Button 
                    size="sm" 
                    onClick={onSelect} 
                    disabled={isUpdating}
                    className="mt-4 bg-primary hover:bg-primary/90"
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

    const { 
        analysis, 
        solutions, 
        isGenerating,
        lastGenerated,
        setAnalysis, 
        setSolutions, 
        setIsGenerating 
    } = useCoachStore();
    
    const [isFetchingSolutions, setIsFetchingSolutions] = useState(false);
    const [showWizard, setShowWizard] = useState(false);
    
    const [selectedSolutions, setSelectedSolutions] = useState<Set<string>>(new Set());
    const [loadingMessage, setLoadingMessage] = useState(loadingSteps[0]);

    const { toast } = useToast();
    const analytics = useAnalytics();
    
    useEffect(() => {
        let intervalId: NodeJS.Timeout | undefined;
        if (isGenerating || isFetchingSolutions) {
            let step = 0;
            intervalId = setInterval(() => {
                step = (step + 1) % loadingSteps.length;
                setLoadingMessage(loadingSteps[step]);
            }, 90000); // 15 seconds * 6
        } else {
            setLoadingMessage(loadingSteps[0]); // Reset
        }
        return () => clearInterval(intervalId);
    }, [isGenerating, isFetchingSolutions]);
    
    const handleAskCoach = async () => {
        setIsGenerating(true);
        setAnalysis(null);
        setSolutions(null);
        if (!user || !analytics) {
            toast({ variant: 'destructive', title: 'Could not get advice', description: 'User or analytics data is not available.' });
            setIsGenerating(false);
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
                    }
                };
                const solutionsResult = await fetchCoachSolutions(solutionsInput);
                setSolutions(solutionsResult);
                setIsFetchingSolutions(false);
                setShowWizard(true); // Only show wizard for new advice
            }

        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Analysis Failed',
                description: 'Could not get advice from the Kitchen Coach. Please try again later.'
            });
        } finally {
            setIsGenerating(false);
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

    if (!analytics && !isGenerating) {
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
                 <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
                            <DotLottieReact
                              src="https://lottie.host/55c18eb1-89f2-4916-8211-c063d81a959d/Xf9C5RWU4z.lottie"
                              style={{width: '40px', height: '40px'}}
                              loop
                              autoplay
                            />
                            Kitchen Coach
                        </h1>
                    </div>
                     <Button
                        size="sm"
                        onClick={handleAskCoach} 
                        disabled={isGenerating || isFetchingSolutions}
                    >
                        {isGenerating || isFetchingSolutions ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Get New Advice
                            </>
                        )}
                    </Button>
                </div>

                {(isGenerating || isFetchingSolutions) && (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-16">
                        <Loader2 className="h-12 w-12 animate-spin mb-4" />
                        <p className="font-semibold text-lg">{loadingMessage}</p>
                        <p className="text-sm">Your new insights will be ready shortly.</p>
                    </div>
                )}

                {!isGenerating && !isFetchingSolutions && analysis && solutions && (
                    <div className="grid gap-6">
                        {/* Analysis Section */}
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <CardTitle className="flex items-center gap-2 text-lg"><Brain className="text-primary" /> The Analysis</CardTitle>
                                    </div>
                                    <Badge variant="outline" className="border-purple-300 bg-purple-50 text-purple-700">
                                        <Bot className="w-3 h-3 mr-1" />
                                        AI-Generated
                                    </Badge>
                                </div>
                                {lastGenerated && (
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(parseISO(lastGenerated), { addSuffix: true })}
                                    </p>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="font-semibold text-foreground">{analysis.title}</p>
                                <Accordion type="single" collapsible className="w-full">
                                    <AccordionItem value="situation">
                                        <AccordionTrigger>
                                            <span className="flex items-center gap-2 font-semibold"><Target className="text-primary" /> What's Happening</span>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 pl-2">
                                                {analysis.story.situation.map((s, i) => <li key={i}>{s}</li>)}
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                     <AccordionItem value="rootCause">
                                        <AccordionTrigger>
                                            <span className="flex items-center gap-2 font-semibold"><HelpCircle className="text-primary" /> The Root Cause</span>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 pl-2">
                                                {analysis.story.rootCause.map((s, i) => <li key={i}>{s}</li>)}
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="impact">
                                        <AccordionTrigger>
                                            <span className="flex items-center gap-2 font-semibold"><Wallet className="text-red-600" /> Financial Impact</span>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <p className="text-sm text-muted-foreground pl-2">{analysis.story.impact}</p>
                                        </AccordionContent>
                                    </AccordionItem>
                                    <AccordionItem value="prediction">
                                        <AccordionTrigger>
                                            <span className="flex items-center gap-2 font-semibold"><AlertTriangle className="text-amber-600" /> Prediction</span>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <p className="text-sm text-muted-foreground pl-2">{analysis.prediction}</p>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </CardContent>
                        </Card>

                        {/* Solutions Section */}
                        
                        <div>
                            <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2"><Lightbulb className="text-primary" />Actionable Solutions</h2>
                            <Carousel
                                opts={{
                                    align: "start",
                                }}
                                className="w-full"
                            >
                                <CarouselContent>
                                    {solutions.solutions.map((solution, index) => (
                                        <CarouselItem key={index} className="basis-[80%] sm:basis-1/2 lg:basis-1/3 pl-3">
                                            <div className="p-1 h-full">
                                                <SolutionCard 
                                                    solution={solution} 
                                                    onSelect={() => handleSelectSolution(solution.title)} 
                                                    isSelected={selectedSolutions.has(solution.title)}
                                                    isUpdating={isGenerating}
                                                />
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                            </Carousel>
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
                    isUpdatingSolution={isGenerating}
                    isBpiLinked={false}
                 />
            )}
        </>
    );
}
