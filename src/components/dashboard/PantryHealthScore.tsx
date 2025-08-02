
'use client';

import { useMemo } from 'react';
import { usePantryLogStore } from '@/stores/pantry-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { differenceInDays, startOfToday } from 'date-fns';

const getFreshness = (expirationDate: string) => {
    const today = startOfToday();
    const expiry = new Date(expirationDate);
    const daysLeft = differenceInDays(expiry, today);

    if (daysLeft < 0) return { status: 'expired', days: daysLeft };
    if (daysLeft <= 3) return { status: 'expiring', days: daysLeft };
    return { status: 'fresh', days: daysLeft };
};

const emojiMap: { [key: string]: string } = {
    tomatoes: '🍅',
    milk: '🥛',
    lettuce: '🥬',
    default: ' PantryHealthScore'
};

export function PantryHealthScore() {
    const { liveItems } = usePantryLogStore();

    const healthData = useMemo(() => {
        if (liveItems.length === 0) {
            return {
                score: 100,
                fresh: 0,
                expiring: 0,
                expired: 0,
                expiringThisWeek: []
            };
        }

        let fresh = 0;
        let expiring = 0;
        let expired = 0;
        const expiringThisWeek: { name: string; days: number }[] = [];

        liveItems.forEach(item => {
            const { status, days } = getFreshness(item.estimatedExpirationDate);
            switch (status) {
                case 'fresh':
                    fresh++;
                    break;
                case 'expiring':
                    expiring++;
                    expiringThisWeek.push({ name: item.name, days });
                    break;
                case 'expired':
                    expired++;
                    break;
            }
        });
        
        const totalItems = liveItems.length;
        const score = Math.round(((totalItems - expired) / totalItems) * 100);

        return { score, fresh, expiring, expired, expiringThisWeek };

    }, [liveItems]);
    
    const getEmoji = (name: string) => {
        const lowerName = name.toLowerCase();
        for (const key in emojiMap) {
            if (lowerName.includes(key)) {
                return emojiMap[key];
            }
        }
        return '💡';
    }


    return (
        <Card className="bg-card border-border rounded-xl shadow-sm text-card-foreground">
            <CardHeader>
                <CardTitle>Pantry Health Score</CardTitle>
                <CardDescription className="text-muted-foreground">Current inventory status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <div
                        className="relative h-20 w-20"
                        style={{
                            borderRadius: '50%',
                            background: `conic-gradient(hsl(var(--primary)) ${healthData.score * 3.6}deg, hsl(var(--muted)) 0deg)`,
                        }}
                    >
                        <div className="absolute inset-2 bg-background rounded-full flex items-center justify-center">
                            <span className="text-xl font-bold">{healthData.score}%</span>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Good Inventory Health</h3>
                        <p className="text-sm text-muted-foreground">
                            {healthData.fresh} items fresh, {healthData.expiring} expiring soon
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-green-500/20 text-green-800 p-2 rounded-lg">
                        <p className="font-bold text-lg">{healthData.fresh}</p>
                        <p className="text-xs">Fresh Items</p>
                    </div>
                     <div className="bg-yellow-500/20 text-yellow-800 p-2 rounded-lg">
                        <p className="font-bold text-lg">{healthData.expiring}</p>
                        <p className="text-xs">Expiring Soon</p>
                    </div>
                     <div className="bg-red-500/20 text-red-800 p-2 rounded-lg">
                        <p className="font-bold text-lg">{healthData.expired}</p>
                        <p className="text-xs">Expired</p>
                    </div>
                </div>
                
                {healthData.expiringThisWeek.length > 0 && (
                    <div className="bg-secondary/50 p-3 rounded-lg">
                        <h4 className="text-sm font-semibold mb-2">Expiring This Week:</h4>
                         <div className="flex flex-wrap gap-2">
                             {healthData.expiringThisWeek.map((item, index) => (
                                <Badge key={index} variant="destructive">
                                    {getEmoji(item.name)} {item.name} ({item.days} days)
                                </Badge>
                             ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
