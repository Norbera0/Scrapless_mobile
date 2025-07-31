
'use client';

import { BarChart, Globe, DollarSign } from 'lucide-react';

interface PantryOverviewProps {
    stats: {
        totalValue: number;
        totalFootprint: number;
    }
}

export function PantryOverview({ stats }: PantryOverviewProps) {
    return (
        <div className="glass-card rounded-2xl p-5 mb-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart className="w-5 h-5 mr-3 text-primary" />
                Pantry Overview
            </h2>
            <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-1">₱{stats.totalValue.toFixed(0)}</div>
                    <div className="text-sm text-gray-600 flex items-center justify-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        Total Food Value
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">{stats.totalFootprint.toFixed(1)}kg</div>
                    <div className="text-sm text-gray-600 flex items-center justify-center">
                       <Globe className="w-4 h-4 mr-1" />
                        Carbon Footprint
                    </div>
                </div>
            </div>
        </div>
    );
}
