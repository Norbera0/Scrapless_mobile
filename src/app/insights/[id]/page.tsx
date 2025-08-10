
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useInsightStore } from '@/stores/insight-store';
import { type Insight, type InsightSolution } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Lightbulb, Target, Wallet, Users, Check, Sparkles, AlertTriangle, HelpCircle, TrendingUp, Landmark } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { updateInsightStatus } from '@/lib/data';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { differenceInDays, isWithinInterval, startOfToday, subDays } from 'date-fns';
import { useBpiTrackPlanStore } from '@/stores/bpiTrackPlanStore';
import { generateNewInsight } from '@/app/actions';
import { usePantryLogStore } from '@/stores/pantry-store';

function SolutionCard({ solution, onSelect, isSelected, isUpdating }: { solution: InsightSolution, onSelect: () => void, isSelected: boolean, isUpdating: boolean }) {
    const isBpiSolution = solution.solution.toLowerCase().includes('bpi');
    return (
        <Card className={cn("bg-background flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300", isBpiSolution && "bg-blue-50 border-blue-200")}>
            <CardHeader>
                <CardTitle className='text-base flex items-center gap-2'>
                    {isBpiSolution && <Landmark className="w-5 h-5 text-blue-600" />}
                    {solution.solution}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                    {solution.estimatedSavings && (
                         <p className="text-lg font-bold text-green-600">💰 Save ~₱{solution.estimatedSavings}/mo</p>
                    )}
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

export default function InsightDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { insights, insightsInitialized } = useInsightStore();
    const [insight, setInsight] = useState<Insight | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [selectedSolutions, setSelectedSolutions] = useState<Set<string>>(new Set());
    const { logs } = useWasteLogStore();
    const { liveItems } = usePantryLogStore();
    const { isLinked: isBpiLinked, trackPlanData } = useBpiTrackPlanStore();
    const [isLevelingUp, setIsLevelingUp] = useState(false);
    const [bpiInsight, setBpiInsight] = useState<Insight | null>(null);

    useEffect(() => {
        if (insightsInitialized && id) {
            const foundInsight = insights.find(i => i.id === id);
            if (foundInsight) {
                setInsight(foundInsight);
                if (foundInsight.status === 'acted_on' && foundInsight.solutions) {
                    const solutionNames = new Set(foundInsight.solutions.map(s => s.solution));
                    setSelectedSolutions(solutionNames);
                }
            } else {
                setInsight(null);
            }
        }
    }, [id, insights, insightsInitialized]);

    const handleSelectSolution = async (solutionToSelect: InsightSolution) => {
        if (!user || !insight) return;
        setIsUpdatingStatus(true);
        try {
            const newSelectedSolutions = new Set(selectedSolutions);
            if (!newSelectedSolutions.has(solutionToSelect.solution)) {
                newSelectedSolutions.add(solutionToSelect.solution);
            }
            setSelectedSolutions(newSelectedSolutions);

            if (insight.status !== 'acted_on') {
                await updateInsightStatus(user.uid, insight.id, 'acted_on');
                setInsight(prev => prev ? { ...prev, status: 'acted_on' } : null);
                toast({ title: 'Great!', description: 'We\'ve marked this insight as something you\'re working on.' });
            }
            
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update insight status.' });
            const revertedSolutions = new Set(selectedSolutions);
            revertedSolutions.delete(solutionToSelect.solution);
            setSelectedSolutions(revertedSolutions);
        } finally {
            setIsUpdatingStatus(false);
        }
    }
    
    const handleLevelUp = async () => {
        if (!user) return;
        setIsLevelingUp(true);
        try {
            const input = {
                pantryItems: liveItems,
                wasteLogs: logs,
                bpiTrackPlanData: trackPlanData, // Always include BPI data for level up
            };

            // We generate a new insight but don't save it, just for display
            const analysisResult = await generateNewInsight(user, input, false);
            setBpiInsight(analysisResult as Insight); // Assume the action returns the full object
            toast({
                title: 'BPI Insights Unlocked!',
                description: 'Check out your enhanced analysis.',
            });

        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not generate BPI insights.',
            });
        } finally {
            setIsLevelingUp(false);
        }
    }

    const milestone = useMemo(() => {
        let days = -1;
        if (logs.length > 0) {
            const lastLogDate = new Date(logs[0].date);
            days = differenceInDays(startOfToday(), lastLogDate);
        }
        const today = startOfToday();
        const sevenDaysAgo = subDays(today, 7);
        const weekWaste = logs
            .filter(l => isWithinInterval(new Date(l.date), { start: sevenDaysAgo, end: today }))
            .reduce((acc, l) => acc + l.totalPesoValue, 0);
        const target = Math.max(0, weekWaste * 0.85);
        return { daysSinceLastWaste: days, weeklyWaste: weekWaste, weeklyTarget: target };
    }, [logs]);

    if (!insightsInitialized) {
        return (
            <div className="flex h-full w-full items-center justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }
    
    const displayInsight = bpiInsight || insight;

    if (!displayInsight) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <h2 className="text-2xl font-bold">Insight Not Found</h2>
                <p className="text-muted-foreground">This insight may have been deleted or never existed.</p>
                <Button onClick={() => router.push('/insights')} className="mt-4">Go to Insights Hub</Button>
            </div>
        )
    }
    
    const financialValue = displayInsight.financialImpact.match(/₱(\d+)/)?.[1];

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6 bg-gray-50 min-h-full">
            <div className="flex items-center gap-2 md:gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="space-y-1">
                    <h1 className="text-xl font-bold tracking-tight">{displayInsight.patternAlert}</h1>
                    <p className="text-sm text-muted-foreground">Insight from {new Date(displayInsight.date).toLocaleDateString()}</p>
                </div>
            </div>

            <div className="grid gap-6">
                 {bpiInsight && bpiInsight.predictionAlertBody && (
                    <Card className="bg-blue-50 border-blue-200">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2 text-blue-800"><Landmark /> BPI-Powered Prediction</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-blue-900">{bpiInsight.predictionAlertBody}</p>
                        </CardContent>
                    </Card>
                )}

                {!bpiInsight && isBpiLinked && (
                    <Card className="bg-bpi-brand/10 border-bpi-brand/20">
                        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Landmark className="w-8 h-8 text-bpi-brand" />
                                <div>
                                    <h3 className="font-bold text-bpi-brand">Level Up Your Insights</h3>
                                    <p className="text-sm text-bpi-brand/80">Connect your BPI data for a deeper financial analysis.</p>
                                </div>
                            </div>
                            <Button className="bg-bpi-brand hover:bg-bpi-brand/90 w-full sm:w-auto" onClick={handleLevelUp} disabled={isLevelingUp}>
                                {isLevelingUp ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Sparkles className="w-4 h-4 mr-2"/>}
                                Level Up with BPI
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                     <Card className="bg-red-50 border-red-200">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-red-800">Financial Impact</CardTitle>
                            <Wallet className="h-4 w-4 text-red-700" />
                        </CardHeader>
                        <CardContent>
                             <div className="text-2xl font-bold text-red-800">{financialValue ? `₱${financialValue}` : displayInsight.financialImpact.split(' ')[0]}</div>
                             <p className="text-xs text-red-600">
                                {financialValue ? `in wasted vegetables over 4 weekends` : `est. monthly loss`}
                            </p>
                        </CardContent>
                    </Card>
                     <Card className="bg-green-50 border-green-200">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-green-800">Top Tip</CardTitle>
                            <Sparkles className="h-4 w-4 text-green-700" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-green-900 font-semibold">{displayInsight.smartTip}</p>
                        </CardContent>
                    </Card>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base"><Target className="text-primary" /> What's Happening</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{displayInsight.whatsReallyHappening}</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base"><HelpCircle className="text-primary" /> The Root Cause</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{displayInsight.whyThisPatternExists}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="text-primary" /> Milestones & Weekly Challenge</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-md bg-green-50 border border-green-200 p-3">
                            <p className="text-sm text-green-900"><strong>Milestone:</strong> {milestone.daysSinceLastWaste >= 0 ? `${milestone.daysSinceLastWaste} day(s) since last waste log` : 'Start logging to unlock milestones'}</p>
                        </div>
                        <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                            <p className="text-sm text-amber-900"><strong>Challenge:</strong> Cut this week’s waste to ₱{milestone.weeklyTarget.toFixed(0)} or less.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
             <div>
                <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2"><Lightbulb className="text-primary" />Actionable Solutions</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {displayInsight.solutions.map((solution, index) => (
                        <SolutionCard 
                            key={index} 
                            solution={solution} 
                            onSelect={() => handleSelectSolution(solution)} 
                            isSelected={selectedSolutions.has(solution.solution)}
                            isUpdating={isUpdatingStatus}
                        />
                    ))}
                </div>
            </div>

            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base"><Users className="text-primary" /> You're Not Alone</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground italic">"{displayInsight.similarUserStory}"</p>
                </CardContent>
            </Card>

        </div>
    )
}
