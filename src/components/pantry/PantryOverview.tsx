
'use client';

import { BarChart, Globe, DollarSign, Target } from 'lucide-react';
import { usePantryLogStore } from '@/stores/pantry-store';
import { useMemo } from 'react';

interface PantryOverviewProps {
    stats: {
        totalValue: number;
        totalFootprint: number;
    }
}

export function PantryOverview({ stats }: PantryOverviewProps) {
    const { archivedItems } = usePantryLogStore();

    const successRate = useMemo(() => {
        const usedCount = archivedItems.filter(item => item.status === 'used').length;
        const wastedCount = archivedItems.filter(item => item.status === 'wasted').length;
        const totalArchived = usedCount + wastedCount;

        if (totalArchived === 0) return 100; // If nothing's been used/wasted yet, success is 100%
        return Math.round((usedCount / totalArchived) * 100);
    }, [archivedItems]);

    return (
        <div className="bg-card rounded-2xl p-5 mb-6 shadow-md">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <BarChart className="w-5 h-5 mr-3 text-primary" />
                Pantry Overview
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">₱{stats.totalValue.toFixed(0)}</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        Total Food Value
                    </div>
                </div>
                 <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-1">{successRate}%</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center">
                       <Target className="w-4 h-4 mr-1" />
                        Pantry Success Rate
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">{stats.totalFootprint.toFixed(1)}kg</div>
                    <div className="text-sm text-muted-foreground flex items-center justify-center">
                       <Globe className="w-4 h-4 mr-1" />
                        Carbon Footprint
                    </div>
                </div>
            </div>
        </div>
    );
}
