
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, CheckCircle, Landmark, Lightbulb, Loader2, Sparkles, Target, Users, Wallet, Brain, AlertTriangle } from 'lucide-react';
import type { KitchenCoachOutput, GetCoachSolutionsOutput } from '@/ai/schemas';
import { cn } from '@/lib/utils';


function SolutionCard({ solution, onSelect, isSelected, isUpdating }: { solution: GetCoachSolutionsOutput['solutions'][0], onSelect: () => void, isSelected: boolean, isUpdating: boolean }) {
    const isBpiSolution = solution.title.toLowerCase().includes('bpi');
    return (
        <Card 
            className={cn(
                "cursor-pointer bg-background flex flex-col shadow-md hover:shadow-lg transition-shadow duration-300 h-full", 
                isSelected && "ring-2 ring-primary",
                isBpiSolution && "bg-blue-50 border-blue-200"
            )}
            onClick={onSelect}
        >
            <CardHeader>
                <CardTitle className='text-base flex items-center gap-2'>
                    {isBpiSolution && <Landmark className="w-5 h-5 text-blue-600" />}
                    {solution.title}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                    <p className="text-sm text-muted-foreground mb-3">{solution.description}</p>
                    {solution.estimatedSavings && (
                         <p className="text-lg font-bold text-green-600">💰 Save ~₱{solution.estimatedSavings}/mo</p>
                    )}
                </div>
                 <div className="text-sm font-medium flex items-center justify-center pt-2 text-primary">
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
            <CardContent className="text-center text-muted-foreground leading-relaxed">
                {children}
            </CardContent>
        </Card>
    )
}

interface KitchenCoachWizardProps {
    isOpen: boolean;
    onClose: () => void;
    analysis: KitchenCoachOutput;
    solutions: GetCoachSolutionsOutput;
    onSelectSolution: (solutionTitle: string) => void;
    selectedSolutions: Set<string>;
    isUpdatingSolution: boolean;
}

export function KitchenCoachWizard({ isOpen, onClose, analysis, solutions, onSelectSolution, selectedSolutions, isUpdatingSolution }: KitchenCoachWizardProps) {
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);

    const steps = useMemo(() => {
        const baseSteps = [
            { id: 'title', icon: Brain, title: "Your New Focus", content: <h3 className="text-xl font-semibold text-foreground">{analysis.title}</h3> },
            { id: 'situation', icon: Target, title: "What's Happening", content: <ul>{analysis.story.situation.map((s,i) => <li key={i} className="mb-1">{s}</li>)}</ul> },
            { id: 'root-cause', icon: Lightbulb, title: 'The Root Cause', content: <ul>{analysis.story.rootCause.map((s,i) => <li key={i} className="mb-1">{s}</li>)}</ul> },
            { id: 'impact', icon: Wallet, title: 'The Impact', content: <p>{analysis.story.impact}</p> },
            { id: 'prediction', icon: AlertTriangle, title: 'The Prediction', content: <p>{analysis.prediction}</p> },
            { id: 'solutions', icon: Check, title: 'Your Action Plan', content: 'solutions_placeholder' },
        ];
        return baseSteps;
    }, [analysis]);
    
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
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg p-0 border-0 gap-0">
                <div className="p-6">
                    <Carousel setApi={setApi} className="w-full">
                        <CarouselContent>
                            {steps.map((step) => (
                                <CarouselItem key={step.id}>
                                    <div className="p-1 h-[55vh] flex items-center justify-center">
                                        {step.id === 'solutions' ? (
                                            <div className="w-full h-full flex flex-col items-center text-center">
                                                 <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                                                    <Check className="w-8 h-8 text-primary" />
                                                 </div>
                                                <h2 className="text-2xl font-bold mb-1">Your Action Plan</h2>
                                                <p className="text-muted-foreground mb-4">Choose one or more solutions to work on.</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full flex-1">
                                                    {solutions.solutions.map((s, i) => (
                                                         <SolutionCard 
                                                            key={i} 
                                                            solution={s} 
                                                            onSelect={() => onSelectSolution(s.title)} 
                                                            isSelected={selectedSolutions.has(s.title)}
                                                            isUpdating={isUpdatingSolution}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                             <WizardStepCard icon={step.icon} title={step.title}>
                                                {step.content}
                                            </WizardStepCard>
                                        )}
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="left-[-1rem] sm:left-2" />
                        <CarouselNext className="right-[-1rem] sm:right-2"/>
                    </Carousel>
                </div>
                <div className="p-6 bg-secondary/50 border-t flex flex-col items-center gap-4">
                     <Progress value={(current / totalSteps) * 100} className="w-full" />
                     <p className="text-sm text-muted-foreground">Step {current} of {totalSteps}</p>
                     <Button onClick={onClose} className="w-full" size="lg">
                        {isLastStep ? 'I Understand, Let\'s Do This!' : 'Next'}
                     </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
