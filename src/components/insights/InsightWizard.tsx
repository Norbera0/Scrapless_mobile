
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, CheckCircle, Landmark, Lightbulb, Loader2, Sparkles, Target, Users, Wallet } from 'lucide-react';
import type { Insight, InsightSolution } from '@/types';
import { cn } from '@/lib/utils';


function SolutionCard({ solution, onSelect, isSelected, isUpdating }: { solution: InsightSolution, onSelect: () => void, isSelected: boolean, isUpdating: boolean }) {
    const isBpiSolution = solution.solution.toLowerCase().includes('bpi');
    return (
        <Card 
            className={cn(
                "cursor-pointer bg-background flex flex-col shadow-md hover:shadow-lg transition-shadow duration-300", 
                isSelected && "ring-2 ring-primary",
                isBpiSolution && "bg-blue-50 border-blue-200"
            )}
            onClick={onSelect}
        >
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
                 <div className="text-sm font-medium flex items-center justify-center pt-2">
                    {isUpdating && isSelected ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : isSelected ? (
                        <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                    ) : null}
                    {isSelected ? "I'll try this!" : `I'll try this`}
                 </div>
            </CardContent>
        </Card>
    )
}

const WizardStepCard = ({ icon, title, children }: { icon: React.ElementType, title: string, children: React.ReactNode }) => {
    const Icon = icon;
    return (
        <Card className="h-full border-0 shadow-none">
            <CardHeader className="items-center text-center">
                 <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                    <Icon className="w-8 h-8 text-primary" />
                 </div>
                <CardTitle className="text-2xl">{title}</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-lg text-muted-foreground leading-relaxed">
                {children}
            </CardContent>
        </Card>
    )
}

interface InsightWizardProps {
    insight: Insight;
    isBpiLinked: boolean;
    onClose: () => void;
    onSelectSolution: (solution: InsightSolution) => void;
    selectedSolutions: Set<string>;
    isUpdatingSolution: boolean;
}

export function InsightWizard({ insight, isBpiLinked, onClose, onSelectSolution, selectedSolutions, isUpdatingSolution }: InsightWizardProps) {
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);

    const steps = useMemo(() => {
        const baseSteps = [
            { id: 'whats-happening', title: "What's Happening", icon: Target, content: insight.whatsReallyHappening },
            { id: 'root-cause', title: 'The Root Cause', icon: Lightbulb, content: insight.whyThisPatternExists },
            { id: 'financial-impact', title: 'Financial Impact', icon: Wallet, content: insight.financialImpact },
            { id: 'smart-tip', title: 'Top Tip', icon: Sparkles, content: insight.smartTip },
            { id: 'shopping-plan', title: 'Smart Shopping Plan', icon: Users, content: insight.smartShoppingPlan },
        ];
        
        if (insight.predictionAlertBody && isBpiLinked) {
            baseSteps.push({ id: 'bpi-prediction', title: 'BPI-Powered Prediction', icon: Landmark, content: insight.predictionAlertBody });
        }
        
        baseSteps.push({ id: 'solutions', title: 'Actionable Solutions', icon: Check, content: 'solutions_placeholder' });
        
        return baseSteps;
    }, [insight, isBpiLinked]);
    
    const totalSteps = steps.length;

    useEffect(() => {
        if (!api) return;
        setCurrent(api.selectedScrollSnap() + 1);
        api.on("select", () => {
            setCurrent(api.selectedScrollSnap() + 1);
        });
    }, [api]);

    const isLastStep = current === totalSteps;

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg p-0 border-0 gap-0">
                <div className="p-6">
                    <Carousel setApi={setApi} className="w-full">
                        <CarouselContent>
                            {steps.map((step) => (
                                <CarouselItem key={step.id}>
                                    <div className="p-1 h-[50vh] flex items-center justify-center">
                                        {step.id === 'solutions' ? (
                                            <div className="w-full h-full flex flex-col items-center text-center">
                                                 <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                                                    <Check className="w-8 h-8 text-primary" />
                                                 </div>
                                                <h2 className="text-2xl font-bold mb-2">Actionable Solutions</h2>
                                                <p className="text-muted-foreground mb-4">Choose one or more solutions to work on.</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full">
                                                    {insight.solutions.map((s, i) => (
                                                         <SolutionCard 
                                                            key={i} 
                                                            solution={s} 
                                                            onSelect={() => onSelectSolution(s)} 
                                                            isSelected={selectedSolutions.has(s.solution)}
                                                            isUpdating={isUpdatingSolution}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                             <WizardStepCard icon={step.icon} title={step.title}>
                                                <p>{step.content}</p>
                                            </WizardStepCard>
                                        )}
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="left-2" />
                        <CarouselNext className="right-2"/>
                    </Carousel>
                </div>
                <div className="p-6 bg-secondary/50 border-t flex flex-col items-center gap-4">
                     <Progress value={(current / totalSteps) * 100} className="w-full" />
                     <p className="text-sm text-muted-foreground">Step {current} of {totalSteps}</p>
                     <Button onClick={onClose} className="w-full" size="lg">
                        {isLastStep ? 'Done' : 'I Understand'}
                     </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
