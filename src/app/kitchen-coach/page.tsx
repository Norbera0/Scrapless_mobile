
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Sparkles, Lightbulb, ChefHat, AlertTriangle } from 'lucide-react';
import { usePantryLogStore } from '@/stores/pantry-store';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { getCoachAdvice } from '../actions';
import { type KitchenCoachOutput } from '@/ai/flows/get-kitchen-coach-advice';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

export default function KitchenCoachPage() {
    const { liveItems, pantryInitialized } = usePantryLogStore();
    const { logs, logsInitialized } = useWasteLogStore();
    const [isLoading, setIsLoading] = useState(false);
    const [advice, setAdvice] = useState<KitchenCoachOutput | null>(null);
    const { toast } = useToast();

    const pantrySummary = useMemo(() => {
        if (!pantryInitialized) return { totalItems: 0, expiringSoon: 0, topCategory: 'N/A' };

        const expiringSoon = liveItems.filter(item => {
            const daysLeft = (new Date(item.estimatedExpirationDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
            return daysLeft <= 3;
        }).length;

        const categoryCounts: Record<string, number> = {};
        liveItems.forEach(item => {
            // A simple categorization logic for summary
            if (item.name.toLowerCase().includes('chicken') || item.name.toLowerCase().includes('beef') || item.name.toLowerCase().includes('pork')) {
                categoryCounts['Meat'] = (categoryCounts['Meat'] || 0) + 1;
            } else if (item.name.toLowerCase().includes('lettuce') || item.name.toLowerCase().includes('tomato') || item.name.toLowerCase().includes('carrot')) {
                categoryCounts['Vegetables'] = (categoryCounts['Vegetables'] || 0) + 1;
            } else {
                categoryCounts['Other'] = (categoryCounts['Other'] || 0) + 1;
            }
        });

        const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
        
        return {
            totalItems: liveItems.length,
            expiringSoon,
            topCategory
        };
    }, [liveItems, pantryInitialized]);

    const handleAskCoach = async () => {
        setIsLoading(true);
        setAdvice(null);
        try {
            const pantryData = liveItems.map(item => ({
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                estimatedExpirationDate: item.estimatedExpirationDate
            }));

            const result = await getCoachAdvice({ pantryItems: pantryData, wasteLogs: logs });
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

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight">Kitchen Coach</h1>
                <p className="text-muted-foreground">
                    Get personalized advice on how to use your pantry items effectively.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pantry Snapshot</CardTitle>
                    <CardDescription>Here's a quick look at your current pantry.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-secondary rounded-lg">
                        <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                        <p className="text-2xl font-bold">{pantrySummary.totalItems}</p>
                    </div>
                    <div className="p-4 bg-secondary rounded-lg">
                        <p className="text-sm font-medium text-muted-foreground">Expiring Soon</p>
                        <p className="text-2xl font-bold">{pantrySummary.expiringSoon}</p>
                    </div>
                    <div className="p-4 bg-secondary rounded-lg">
                        <p className="text-sm font-medium text-muted-foreground">Top Category</p>
                        <p className="text-2xl font-bold">{pantrySummary.topCategory}</p>
                    </div>
                </CardContent>
            </Card>

            <div className="text-center">
                <Button 
                    size="lg" 
                    onClick={handleAskCoach} 
                    disabled={isLoading || liveItems.length === 0}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Analyzing your kitchen...
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2 h-5 w-5" />
                            Ask Kitchen Coach
                        </>
                    )}
                </Button>
                {liveItems.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">Add items to your pantry to get advice.</p>
                )}
            </div>

            {advice && (
                <div className="grid gap-6 mt-4">
                    <Card className="bg-blue-50 border-blue-200">
                        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                            <Lightbulb className="w-6 h-6 text-blue-600" />
                            <CardTitle className="text-blue-800">Quick Tip</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-blue-900">{advice.quickTip}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-green-50 border-green-200">
                        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                            <AlertTriangle className="w-6 h-6 text-green-600" />
                            <CardTitle className="text-green-800">What to Prioritize</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-green-900">{advice.deeperInsight}</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-amber-50 border-amber-200">
                        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                            <ChefHat className="w-6 h-6 text-amber-600" />
                            <CardTitle className="text-amber-800">Recipe Idea</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col sm:flex-row items-start gap-4">
                            {advice.recipeIdea.photoDataUri && (
                                <Image 
                                    src={advice.recipeIdea.photoDataUri}
                                    alt={advice.recipeIdea.name}
                                    width={120}
                                    height={120}
                                    className="rounded-lg object-cover w-full sm:w-32 h-32"
                                />
                            )}
                            <div className="flex-1">
                                <h4 className="font-bold">{advice.recipeIdea.name}</h4>
                                <p className="text-sm text-muted-foreground">{advice.recipeIdea.description}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
