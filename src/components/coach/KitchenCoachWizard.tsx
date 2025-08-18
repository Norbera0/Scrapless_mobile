
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
                "bg-background flex flex-col justify-center items-center shadow-md h-full text-center p-4", 
                isBpiSolution && "bg-blue-50 border-blue-200"
            )}
        >
            <CardTitle className='text-base font-semibold flex items-center gap-2'>
                {isBpiSolution && <Landmark className="w-5 h-5 text-blue-600" />}
                {solution.title}
            </CardTitle>
        </Card>
    )
}

const WizardStepCard = ({ icon, title, children }: { icon: React.ElementType, title: string, children: React.ReactNode }) => {
    const Icon = icon;
    return (
        <Card className="h-full border-0 shadow-none bg-transparent">
            <CardHeader className="items-center text-center">
                 <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 border-4 border-primary/20">
                    <Icon className="w-8 h-8 text-primary" />
                 </div>
                <CardTitle className="text-xl md:text-2xl">{title}</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground text-sm md:text-base leading-relaxed px-2">
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
    isBpiLinked: boolean;
}

export function KitchenCoachWizard({ isOpen, onClose, analysis, solutions, onSelectSolution, selectedSolutions, isUpdatingSolution, isBpiLinked }: KitchenCoachWizardProps) {
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);

    const steps = useMemo(() => {
        const baseSteps = [
            { 
                id: 'title', 
                icon: Brain, 
                title: "Your New Focus", 
                content: <h3 className="text-lg md:text-xl font-semibold text-foreground">{analysis.title}</h3> 
            },
            { 
                id: 'situation', 
                icon: Target, 
                title: "What's Happening", 
                content: (
                    <ul className="list-disc list-inside text-left mx-auto max-w-md space-y-2">
                        {analysis.story.situation.map((s,i) => <li key={i}><strong className="font-semibold text-foreground">{s.split(':')[0]}</strong></li>)}
                    </ul>
                )
            },
            { 
                id: 'root-cause', 
                icon: Lightbulb, 
                title: 'The Root Cause', 
                content: (
                     <ul className="list-disc list-inside text-left mx-auto max-w-md space-y-2">
                        {analysis.story.rootCause.map((s,i) => <li key={i}><strong className="font-semibold text-foreground">{s.split(':')[0]}</strong></li>)}
                    </ul>
                )
            },
            { 
                id: 'impact', 
                icon: Wallet, 
                title: 'The Impact', 
                content: <p className="font-semibold text-foreground">{analysis.story.impact}</p> 
            },
            { 
                id: 'prediction', 
                icon: AlertTriangle, 
                title: 'The Prediction', 
                content: <p className="font-semibold text-foreground">{analysis.prediction}</p> 
            },
        ];
        
        const bpiSolution = solutions.solutions.find(s => s.title.toLowerCase().includes('bpi'));
        if (isBpiLinked && bpiSolution) {
            baseSteps.push({
                id: 'bpi-solution',
                icon: Landmark,
                title: bpiSolution.title,
                content: <p>{bpiSolution.description}</p>
            });
        }
        
        baseSteps.push({ id: 'solutions', icon: Check, title: 'Your Action Plan', content: 'solutions_placeholder' });
        
        return baseSteps;
    }, [analysis, solutions, isBpiLinked]);
    
    const totalSteps = steps.length;

    useEffect(() => {
        if (!api) return;
        setCurrent(api.selectedScrollSnap());
        api.on("select", () => {
            setCurrent(api.selectedScrollSnap());
        });
    }, [api]);

    const isLastStep = current === totalSteps - 1;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg w-[90vw] p-0 border-0 gap-0 flex flex-col h-auto max-h-[85vh] min-h-[500px]">
                <DialogHeader className="p-6 pb-2 shrink-0">
                    <DialogTitle>Your Kitchen Coach Plan</DialogTitle>
                    <DialogDescription>
                        A step-by-step guide to understanding and improving your kitchen habits.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto px-2 min-h-0">
                    <Carousel setApi={setApi} className="w-full h-full">
                        <CarouselContent className="h-full">
                            {steps.map((step, index) => (
                                <CarouselItem key={step.id} className="flex flex-col justify-center h-full">
                                    <div className="p-1 w-full h-full flex-1">
                                        {step.id === 'solutions' ? (
                                            <div className="w-full h-full flex flex-col items-center text-center">
                                                 <div className="shrink-0 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 border-4 border-primary/20">
                                                    <Check className="w-8 h-8 text-primary" />
                                                 </div>
                                                <h2 className="text-xl md:text-2xl font-bold mb-1 shrink-0">Your Action Plan</h2>
                                                <p className="text-muted-foreground mb-4 shrink-0">Choose one or more solutions to work on.</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full p-1 flex-1 overflow-y-auto">
                                                    {solutions.solutions.filter(s => !s.title.toLowerCase().includes('bpi')).map((s, i) => (
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
                        <CarouselPrevious className="left-[-0.5rem] sm:left-2" />
                        <CarouselNext className="right-[-0.5rem] sm:right-2"/>
                    </Carousel>
                </div>

                <div className="p-6 bg-secondary/50 border-t flex flex-col items-center gap-4 shrink-0">
                     <div className="w-full flex justify-center items-center gap-2">
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "h-1.5 rounded-full transition-all duration-300",
                                    i === current ? "w-6 bg-primary" : "w-1.5 bg-muted"
                                )}
                            />
                        ))}
                     </div>
                     <p className="text-xs text-muted-foreground font-medium">STEP {current + 1} OF {totalSteps}</p>
                     <Button onClick={() => isLastStep ? onClose() : api?.scrollNext()} className="w-full" size="lg">
                        {isLastStep ? 'I Understand, Let\'s Do This!' : 'Next'}
                        {!isLastStep && <ArrowRight className="w-4 h-4 ml-2" />}
                     </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
