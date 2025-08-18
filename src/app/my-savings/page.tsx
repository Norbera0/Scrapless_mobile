
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useSavingsStore } from '@/stores/savings-store';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PiggyBank, Sparkles, CheckCircle, ArrowRight, Banknote } from 'lucide-react';
import type { SavingsEvent } from '@/types';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';

const eventIcons: Record<SavingsEvent['type'], React.ElementType> = {
    avoided_expiry: CheckCircle,
    recipe_followed: Sparkles,
    smart_shopping: Sparkles,
    waste_reduction: Sparkles,
    solution_implemented: Sparkles,
};

export default function MySavingsPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const { savingsEvents, savingsInitialized } = useSavingsStore();
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthLoading && savingsInitialized) {
            setIsLoading(false);
        }
    }, [isAuthLoading, savingsInitialized]);

    const totalSavings = useMemo(() => {
        return savingsEvents.reduce((acc, event) => acc + event.amount, 0);
    }, [savingsEvents]);

    const handleTransfer = () => {
        router.push('/bpi/transfer');
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
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">💰 My Savings</h1>
                <p className="text-muted-foreground text-sm">
                    Your virtual savings from reducing food waste.
                </p>
            </div>

            <Card className="bg-gradient-to-br from-primary to-emerald-700 text-white shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg">Total Virtual Savings</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-5xl font-bold tracking-tighter">₱{totalSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-green-200 mt-1 text-sm">Earned from your sustainable actions.</p>
                </CardContent>
                <CardFooter>
                     <Button 
                        variant="secondary" 
                        className="bg-white/90 text-primary hover:bg-white w-full h-12 text-base"
                        onClick={handleTransfer}
                    >
                        <Banknote className="mr-2" />
                        Transfer to BPI Green Saver
                    </Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Savings History</CardTitle>
                    <CardDescription className="text-sm">See how your smart habits are adding up.</CardDescription>
                </CardHeader>
                <CardContent>
                     {savingsEvents.length > 0 ? (
                        <div className="space-y-3">
                            {savingsEvents.map(event => {
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
                                             <p className="font-bold text-green-600 text-lg whitespace-nowrap">+ ₱{event.amount.toFixed(2)}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                     ) : (
                         <div className="text-center text-muted-foreground py-10">
                            <p>You haven't earned any savings yet.</p>
                            <p className="text-sm">Log items and use your pantry to start saving!</p>
                        </div>
                     )}
                </CardContent>
            </Card>
        </div>
    );
}
