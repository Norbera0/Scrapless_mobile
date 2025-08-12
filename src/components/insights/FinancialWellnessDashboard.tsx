
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Landmark, ArrowRight } from "lucide-react";

interface FinancialWellnessDashboardProps {
    monthlyWaste: number;
    bpiDiscretionarySpending: number;
}

export function FinancialWellnessDashboard({ monthlyWaste, bpiDiscretionarySpending }: FinancialWellnessDashboardProps) {
    
    const percentageOfSpending = bpiDiscretionarySpending > 0 ? (monthlyWaste / bpiDiscretionarySpending) * 100 : 0;

    const financialInsight = percentageOfSpending > 1 
        ? `Your food waste currently accounts for nearly ${percentageOfSpending.toFixed(0)}% of your total monthly discretionary spending. Plugging this leak is the single fastest way to increase your cash flow.`
        : "Your food waste is well-managed against your spending. Keep up the great work!";

    return (
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600/10 rounded-lg flex items-center justify-center">
                        <Landmark className="w-6 h-6 text-blue-700" />
                    </div>
                    <div>
                        <CardTitle className="text-blue-900">BPI Financial Wellness</CardTitle>
                        <CardDescription className="text-blue-700">Food Waste vs. Overall Spending</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/70 rounded-lg p-4 text-center">
                        <p className="text-sm font-medium text-red-600">Monthly Food Waste Leakage</p>
                        <p className="text-2xl font-bold text-red-700">-₱{monthlyWaste.toFixed(2)}</p>
                    </div>
                    <div className="bg-white/70 rounded-lg p-4 text-center">
                        <p className="text-sm font-medium text-green-600">BPI Discretionary Spending</p>
                        <p className="text-2xl font-bold text-green-700">₱{bpiDiscretionarySpending.toFixed(2)}</p>
                    </div>
                </div>
                <div className="bg-white/70 rounded-lg p-4">
                    <p className="text-sm font-semibold text-blue-800 mb-2">Financial Insight:</p>
                    <p className="text-sm text-blue-900">
                       {financialInsight}
                    </p>
                </div>
                <div>
                     <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        View Full Picture in BPI Track & Plan
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
