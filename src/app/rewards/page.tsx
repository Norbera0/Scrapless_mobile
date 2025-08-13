
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useGreenPointsStore } from '@/stores/green-points-store';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Gift, CookingPot, CheckCircle, Lightbulb } from 'lucide-react';
import type { GreenPointsEvent } from '@/types';
import { format, parseISO } from 'date-fns';
import Image from 'next/image';

const eventIcons: Record<GreenPointsEvent['type'], React.ElementType> = {
    log_pantry_item: CheckCircle,
    use_pantry_item: Gift,
    cook_recipe: CookingPot,
    zero_waste_week: Sparkles,
    acted_on_insight: Lightbulb,
};

export default function GreenPointsPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const { events, pointsInitialized } = useGreenPointsStore();
    const [isLoading, setIsLoading] = useState(true);
    const [isConverting, setIsConverting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (!isAuthLoading && pointsInitialized) {
            setIsLoading(false);
        }
    }, [isAuthLoading, pointsInitialized]);

    const totalPoints = useMemo(() => {
        return events.reduce((acc, event) => acc + event.points, 0);
    }, [events]);

    const handleConvert = () => {
        setIsConverting(true);
        setTimeout(() => {
             toast({
                title: "Conversion Successful! (Mock)",
                description: `You have converted ${totalPoints} Green Points to your BPI VYBE account.`,
            });
            setIsConverting(false);
            // In a real app, you would clear the points or mark them as converted
        }, 1500);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6 bg-gray-50 min-h-screen">
             <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">✨ Green Points</h1>
                <p className="text-muted-foreground">
                    Earn points for your sustainable actions.
                </p>
            </div>

            <Card className="bg-gradient-to-br from-green-600 to-teal-700 text-white shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg">Total Green Points</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-5xl font-bold tracking-tighter">{totalPoints.toLocaleString()}</p>
                    <p className="text-green-200 mt-1">Ready to be converted.</p>
                </CardContent>
                <CardFooter>
                     <Button 
                        variant="secondary" 
                        className="bg-white/90 text-primary hover:bg-white w-full h-12 text-base"
                        onClick={handleConvert}
                        disabled={isConverting || totalPoints === 0}
                    >
                        {isConverting ? (
                             <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <Image src="/vybe-logo.png" alt="VYBE Logo" width={24} height={24} className="mr-2" />
                        )}
                        {isConverting ? 'Converting...' : 'Convert to BPI Points via VYBE'}
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>See how you've earned your points.</CardDescription>
                </CardHeader>
                <CardContent>
                     {events.length > 0 ? (
                        <div className="space-y-3">
                            {events.map(event => {
                                const Icon = eventIcons[event.type] || Sparkles;
                                return (
                                    <div key={event.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Icon className="w-5 h-5 text-primary" />
                                            <div>
                                                <p className="font-medium text-sm">{event.description}</p>
                                                <p className="text-xs text-muted-foreground">{format(parseISO(event.date), 'MMMM d, h:mm a')}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                             <p className="font-bold text-green-600 text-lg whitespace-nowrap">+ {event.points} pts</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                     ) : (
                         <div className="text-center text-muted-foreground py-10">
                            <p>You haven't earned any points yet.</p>
                            <p className="text-sm">Log items and use your pantry to start earning!</p>
                        </div>
                     )}
                </CardContent>
            </Card>
        </div>
    );
}
