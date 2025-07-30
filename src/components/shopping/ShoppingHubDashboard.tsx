
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usePantryLogStore } from '@/stores/pantry-store';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { generateShoppingRecommendations } from '@/ai/flows/generate-shopping-recommendations';
import { type GenerateShoppingRecommendationsOutput } from '@/ai/schemas';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BadgeCheck, BellRing, ShoppingBasket, Tomato, PackagePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '../ui/separator';

const iconMap: { [key: string]: React.ElementType } = {
    "Tomatoes": Tomato,
    "Default": ShoppingBasket,
};


export function ShoppingHubDashboard() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { liveItems: pantryItems, pantryInitialized } = usePantryLogStore();
    const { logs: wasteLogs, logsInitialized } = useWasteLogStore();

    const [recommendations, setRecommendations] = useState<GenerateShoppingRecommendationsOutput | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user && pantryInitialized && logsInitialized) {
            const fetchRecommendations = async () => {
                setIsLoading(true);
                try {
                    const topWasted = wasteLogs.flatMap(l => l.items).reduce((acc, item) => {
                        acc[item.name] = (acc[item.name] || 0) + 1;
                        return acc;
                    }, {} as Record<string, number>);

                    const topWastedCategory = Object.keys(topWasted).sort((a, b) => topWasted[b] - topWasted[a])[0] || 'Produce';

                    const result = await generateShoppingRecommendations({
                        userName: user.name || "User",
                        pantryItems,
                        wasteLogs,
                        topWastedCategory,
                    });
                    setRecommendations(result);
                } catch (error) {
                    console.error("Failed to fetch shopping recommendations:", error);
                    toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: 'Could not load shopping recommendations.',
                    });
                } finally {
                    setIsLoading(false);
                }
            };
            fetchRecommendations();
        }
    }, [user, pantryInitialized, logsInitialized, pantryItems, wasteLogs, toast]);

    const handleSetReminder = (itemName: string) => {
        toast({
            title: 'Reminder Set!',
            description: `We'll remind you about the ${itemName} recommendation.`,
        });
    }

    const handleTryingThis = (itemName: string) => {
        toast({
            title: 'Great!',
            description: `We'll track your progress on the ${itemName} recommendation.`,
        });
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        )
    }

    if (!recommendations) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground py-10">
                        Could not load shopping recommendations at this time.
                    </p>
                </CardContent>
            </Card>
        )
    }

    const { shoppingIntelligence, recommendations: recommendationItems } = recommendations;

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Your Shopping Intelligence</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="bg-secondary p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Typical Pattern</p>
                        <p className="text-lg font-semibold">{shoppingIntelligence.shoppingPattern}</p>
                    </div>
                    <div className="bg-secondary p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Top Optimization Area</p>
                        <p className="text-lg font-semibold">{shoppingIntelligence.topOptimizationCategory}</p>
                    </div>
                    <div className="bg-secondary p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Est. Monthly Savings</p>
                        <p className="text-lg font-semibold">₱{shoppingIntelligence.estimatedMonthlySavings.toFixed(2)}</p>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                 <h2 className="text-2xl font-bold tracking-tight">Active Recommendations</h2>
                {recommendationItems.map((item, index) => {
                    const Icon = iconMap[item.itemName] || iconMap['Default'];
                    return (
                        <Card key={index}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <Icon className="h-6 w-6 text-primary" />
                                    <span>{item.itemName}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Current:</span>
                                    <span>{item.currentBehavior}</span>
                                </div>
                                <div className="flex justify-between font-semibold">
                                    <span className="text-primary">Optimal:</span>
                                    <span>{item.optimalBehavior}</span>
                                </div>
                                <Separator className="my-3" />
                                <div className="flex justify-between items-center text-primary font-bold">
                                    <span>Result:</span>
                                    <span>{item.savingsOrResult}</span>
                                </div>
                            </CardContent>
                            <CardFooter className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleSetReminder(item.itemName)}>
                                    <BellRing className="mr-2 h-4 w-4" /> Set Reminder
                                </Button>
                                <Button size="sm" onClick={() => handleTryingThis(item.itemName)}>
                                    <BadgeCheck className="mr-2 h-4 w-4" /> Trying This
                                </Button>
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Generate Smart List</CardTitle>
                    <CardDescription>Create a shopping list based on your current pantry and waste patterns.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Button className="w-full">
                        <PackagePlus className="mr-2 h-4 w-4" /> Create This Week's List
                    </Button>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Shopping Insights History</CardTitle>
                    <CardDescription>Review past recommendations and track your progress.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="secondary" className="w-full">
                        View Past Recommendations
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
