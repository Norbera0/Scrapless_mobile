

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Sparkles, Lightbulb, AlertTriangle, Wallet, Brain, Clock, Check, Target, HelpCircle, TrendingUp } from 'lucide-react';
import { usePantryLogStore } from '@/stores/pantry-store';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { getCoachAdvice } from '../actions';
import { type KitchenCoachOutput, type KitchenCoachInput } from '@/ai/schemas';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useAnalytics } from '@/hooks/use-analytics';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

function SolutionCard({ solution, onSelect, isSelected, isUpdating }: { solution: KitchenCoachOutput['solutions'][0], onSelect: () => void, isSelected: boolean, isUpdating: boolean }) {
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
    const { liveItems } = usePantryLogStore();
    const { logs } = useWasteLogStore();
    const [isLoading, setIsLoading] = useState(false);
    const [advice, setAdvice] = useState<KitchenCoachOutput | null>(null);
    const [selectedSolutions, setSelectedSolutions] = useState<Set<string>>(new Set());

    const { toast } = useToast();
    const analytics = useAnalytics();

    const handleAskCoach = async () => {
        setIsLoading(true);
        setAdvice(null);
        if (!user || !analytics) {
            toast({ variant: 'destructive', title: 'Could not get advice', description: 'User or analytics data is not available.' });
            setIsLoading(false);
            return;
        }

        try {
            const input: KitchenCoachInput = {
                userName: user?.name?.split(' ')[0] || 'User',
                userStage: 'regular_user',
                daysActive: analytics.waste.daysSinceLastLog > 0 ? analytics.waste.daysSinceLastLog : 0,
                hasBpiData: false,
                pantryItemsCount: liveItems.length,
                wasteLogsCount: logs.length,
                weather: analytics.weather ? {
                    temperature: analytics.weather.temperature,
                    condition: analytics.weather.condition,
                    humidity: analytics.weather.humidity,
                } : undefined,
                wasteData: {
                    logs: logs.slice(0, 30).map(l => ({
                        date: l.date,
                        items: l.items.map(i => ({ name: i.name, amount: i.estimatedAmount, category: 'unknown' })),
                        reason: l.sessionWasteReason || 'other',
                        totalValue: l.totalPesoValue,
                        dayOfWeek: new Date(l.date).toLocaleString('en-us', { weekday: 'long' })
                    })),
                    patterns: {
                        topWastedCategory: analytics.waste.topWastedCategoryByFrequency?.name || 'N/A',
                        avgWeeklyWaste: analytics.waste.avgWeeklyValue,
                        wasteFrequency: `${analytics.waste.wasteLogFrequency.toFixed(1)} times/week`,
                    }
                },
                pantryData: {
                    currentItems: liveItems.map(i => ({
                        name: i.name,
                        expiresIn: Math.max(0, Math.ceil((new Date(i.estimatedExpirationDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))),
                        category: 'unknown'
                    })),
                    healthScore: analytics.pantryHealthScore,
                },
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
        <div className="flex flex-col gap-6 p-4 md:p-6 bg-gray-50 min-h-full">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Kitchen Coach</h1>
                <p className="text-muted-foreground">
                    Your AI partner for a smarter, less wasteful kitchen.
                </p>
            </div>
            
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
                            Ask Your Coach for Advice
                        </>
                    )}
                </Button>
            </div>


            {advice && (
                <div className="grid gap-6">
                    <div className="space-y-1">
                        <h1 className="text-xl font-bold tracking-tight">{advice.title}</h1>
                        <p className="text-sm text-muted-foreground">Generated on {new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <Card className="bg-red-50 border-red-200">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-red-800">Financial Impact</CardTitle>
                                <Wallet className="h-4 w-4 text-red-700" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-red-900 font-semibold">{advice.story.impact}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-green-50 border-green-200">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-green-800">Quick Win</CardTitle>
                                <Sparkles className="h-4 w-4 text-green-700" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-green-900 font-semibold">{advice.quickWin}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base"><Target className="text-primary" /> What's Happening</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-2">
                                {advice.story.situation.map((line, i) => <li key={i}>{line}</li>)}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base"><HelpCircle className="text-primary" /> The Root Cause</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-2">
                                {advice.story.rootCause.map((line, i) => <li key={i}>{line}</li>)}
                            </ul>
                        </CardContent>
                    </Card>
                    
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                        <h4 className="font-semibold flex items-center gap-2 mb-1 text-red-800"><AlertTriangle className="w-5 h-5" /> Prediction</h4>
                        <p className="text-sm text-red-900">{advice.prediction}</p>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2"><Lightbulb className="text-primary" />Actionable Solutions</h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {advice.solutions.map((solution, index) => (
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
                </div>
            )}
        </div>
    );
}
