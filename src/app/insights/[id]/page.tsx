
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInsightStore } from '@/stores/insight-store';
import { type Insight, type InsightSolution } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Lightbulb, Target, Wallet, Users, Check, Sparkles, AlertTriangle, HelpCircle, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { updateInsightStatus } from '@/lib/data';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { differenceInDays, isWithinInterval, startOfToday } from 'date-fns';

function SolutionCard({ solution, onSelect, isSelected, isUpdating }: { solution: InsightSolution, onSelect: () => void, isSelected: boolean, isUpdating: boolean }) {
    return (
        <Card className="bg-background flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
                <CardTitle className='text-base'>{solution.solution}</CardTitle>
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

export default function InsightDetailPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { insights, insightsInitialized } = useInsightStore();
    const [insight, setInsight] = useState<Insight | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [selectedSolutions, setSelectedSolutions] = useState<Set<string>>(new Set());
    const { logs } = useWasteLogStore();
    const [showMore, setShowMore] = useState<{ what: boolean; why: boolean }>({ what: false, why: false });
    const touchStartX = useRef<number | null>(null);

    useEffect(() => {
        if (insightsInitialized) {
            const foundInsight = insights.find(i => i.id === id);
            if (foundInsight) {
                setInsight(foundInsight);
                if (foundInsight.status === 'acted_on' && foundInsight.solutions) {
                    // Pre-populate selections if the insight was already acted on.
                    // Assuming all solutions were selected previously for simplicity.
                    // A more advanced implementation might store selected solution IDs.
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
            // Update the local state for immediate feedback
            const newSelectedSolutions = new Set(selectedSolutions);
            if (newSelectedSolutions.has(solutionToSelect.solution)) {
                // For now, we only allow adding, not toggling off, to keep it simple.
                // A toggle could be added here if desired.
            } else {
                newSelectedSolutions.add(solutionToSelect.solution);
            }
            setSelectedSolutions(newSelectedSolutions);

            // If this is the first solution selected, update the insight's overall status
            if (insight.status !== 'acted_on') {
                await updateInsightStatus(user.uid, insight.id, 'acted_on');
                setInsight(prev => prev ? { ...prev, status: 'acted_on' } : null);
                toast({ title: 'Great!', description: 'We\'ve marked this insight as something you\'re working on.' });
            }
            
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update insight status.' });
            // Revert optimistic update on failure
            const revertedSolutions = new Set(selectedSolutions);
            revertedSolutions.delete(solutionToSelect.solution);
            setSelectedSolutions(revertedSolutions);
        } finally {
            setIsUpdatingStatus(false);
        }
    }

    const navigateToAdjacentInsight = (direction: 'prev' | 'next') => {
        if (!insight) return;
        const currentIndex = insights.findIndex(i => i.id === insight.id);
        if (currentIndex === -1) return;
        const targetIndex = direction === 'prev' ? currentIndex + 1 : currentIndex - 1; // insights sorted desc
        if (targetIndex >= 0 && targetIndex < insights.length) {
            const target = insights[targetIndex];
            router.replace(`/insights/${target.id}`);
        }
    }

    // Swipe navigation for mobile
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        const threshold = 60; // px
        if (dx > threshold) navigateToAdjacentInsight('prev');
        if (dx < -threshold) navigateToAdjacentInsight('next');
        touchStartX.current = null;
    };

    // Milestones & challenge data
    const milestone = useMemo(() => {
        let days = -1;
        if (logs.length > 0) {
            const lastLogDate = new Date(logs[0].date);
            days = differenceInDays(startOfToday(), lastLogDate);
        }
        const weekWaste = logs
            .filter(l => isWithinInterval(new Date(l.date), { start: new Date(new Date().setDate(new Date().getDate() - 7)), end: new Date() }))
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

    if (!insight) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <h2 className="text-2xl font-bold">Insight Not Found</h2>
                <p className="text-muted-foreground">This insight may have been deleted or never existed.</p>
                <Button onClick={() => router.push('/insights/history')} className="mt-4">Go to History</Button>
            </div>
        )
    }
    
    const financialValue = insight.financialImpact.match(/₱(\d+)/)?.[1];

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6 bg-gray-50 min-h-full" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <div className="flex items-center gap-2 md:gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="space-y-1">
                    <h1 className="text-xl font-bold tracking-tight">{insight.patternAlert}</h1>
                    <p className="text-sm text-muted-foreground">Insight from {new Date(insight.date).toLocaleDateString()}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigateToAdjacentInsight('next')} disabled={insights.length <= 1}>Next</Button>
                    <Button variant="outline" size="sm" onClick={() => navigateToAdjacentInsight('prev')} disabled={insights.length <= 1}>Previous</Button>
                </div>
            </div>

            <div className="grid gap-6">
                <div className="grid md:grid-cols-2 gap-4">
                     <Card className="bg-red-50 border-red-200">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-red-800">Financial Impact</CardTitle>
                            <Wallet className="h-4 w-4 text-red-700" />
                        </CardHeader>
                        <CardContent>
                             <div className="text-2xl font-bold text-red-800">{financialValue ? `₱${financialValue}` : insight.financialImpact.split(' ')[0]}</div>
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
                            <p className="text-sm text-green-900 font-semibold">{insight.smartTip}</p>
                        </CardContent>
                    </Card>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base"><Target className="text-primary" /> What's Happening</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{insight.whatsReallyHappening}</p>
                        <div className="mt-2">
                            <Button variant="outline" size="sm" onClick={() => setShowMore(s => ({ ...s, what: !s.what }))}>{showMore.what ? 'Show less' : 'Learn more'}</Button>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base"><HelpCircle className="text-primary" /> The Root Cause</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{insight.whyThisPatternExists}</p>
                        <div className="mt-2">
                            <Button variant="outline" size="sm" onClick={() => setShowMore(s => ({ ...s, why: !s.why }))}>{showMore.why ? 'Show less' : 'Learn more'}</Button>
                        </div>
                    </CardContent>
                </Card>
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
                    {insight.solutions.map((solution, index) => (
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
                    <p className="text-sm text-muted-foreground italic">"{insight.similarUserStory}"</p>
                </CardContent>
            </Card>

        </div>
    )
}

    