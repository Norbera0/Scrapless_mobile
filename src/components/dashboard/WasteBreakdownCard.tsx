
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { WasteLog } from '@/types';
import { getWasteBreakdownInsight } from '@/app/actions';
import { Lightbulb, Loader2, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface WasteBreakdownCardProps {
    wasteLogs: WasteLog[];
}

const COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const EMOJIS: { [key: string]: string } = {
    'Vegetables': '🥬',
    'Fruits': '🍎',
    'Grains': '🍞',
    'Meat & Fish': '🥩',
    'Dairy': '🥛',
    'Other': '🍽️',
};

const getCategory = (itemName: string): string => {
    const lowerItem = itemName.toLowerCase();
    if (['lettuce', 'tomato', 'potato', 'onion', 'kangkong', 'pechay', 'carrots', 'vegetable'].some(v => lowerItem.includes(v))) return 'Vegetables';
    if (['apple', 'banana', 'orange', 'fruit'].some(v => lowerItem.includes(v))) return 'Fruits';
    if (['milk', 'cheese', 'yogurt', 'dairy'].some(v => lowerItem.includes(v))) return 'Dairy';
    if (['bread', 'rice', 'pasta', 'grain'].some(v => lowerItem.includes(v))) return 'Grains';
    if (['chicken', 'beef', 'pork', 'fish', 'meat'].some(v => lowerItem.includes(v))) return 'Meat & Fish';
    return 'Other';
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="p-2 bg-background border rounded-lg shadow-sm">
                <p className="font-semibold">{`${data.name}: ${data.value.toFixed(2)}%`}</p>
            </div>
        );
    }
    return null;
};

export function WasteBreakdownCard({ wasteLogs }: WasteBreakdownCardProps) {
    const [insight, setInsight] = useState<string | null>(null);
    const [isLoadingInsight, setIsLoadingInsight] = useState(false);
    const { toast } = useToast();

    const categoryData = useMemo(() => {
        const categoryMap = new Map<string, number>();
        let totalWasteValue = 0;

        wasteLogs.forEach(log => {
            log.items.forEach(item => {
                const category = getCategory(item.name);
                const currentValue = categoryMap.get(category) || 0;
                categoryMap.set(category, currentValue + item.pesoValue);
                totalWasteValue += item.pesoValue;
            });
        });

        if (totalWasteValue === 0) return [];

        return Array.from(categoryMap.entries())
            .map(([name, value]) => ({
                name,
                value: (value / totalWasteValue) * 100,
            }))
            .sort((a, b) => b.value - a.value);
    }, [wasteLogs]);

    useEffect(() => {
        if (categoryData.length > 0) {
            setIsLoadingInsight(true);
            const topCategory = categoryData[0];
            getWasteBreakdownInsight({
                topCategory: topCategory.name,
                percentage: topCategory.value,
            })
            .then(result => setInsight(result.insight))
            .catch(error => {
                console.error("Failed to get insight:", error);
                toast({ variant: 'destructive', title: 'Could not fetch AI insight.' });
                setInsight("Try planning meals to use up items from your largest waste category.");
            })
            .finally(() => setIsLoadingInsight(false));
        } else {
            setInsight("Log some waste to see your breakdown and get personalized tips!");
        }
    }, [categoryData, toast]);


    if (wasteLogs.length === 0) {
        return null; // Don't render the card if there's no waste data
    }
    
    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-primary" />
                    Waste Breakdown
                </CardTitle>
                <CardDescription>By food category based on cost.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="w-full h-[200px]">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    innerRadius={50}
                                    fill="#8884d8"
                                    dataKey="value"
                                    paddingAngle={2}
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 text-sm">
                        {categoryData.map((entry, index) => (
                           <div key={entry.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                     <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                     <span className="font-medium">{EMOJIS[entry.name] || '🍽️'} {entry.name}</span>
                                </div>
                                <span className="font-semibold">{entry.value.toFixed(1)}%</span>
                           </div>
                        ))}
                    </div>
                </div>

                <div className="mt-6 bg-secondary/50 p-3 rounded-lg border">
                    <div className="flex items-start gap-3">
                         <Lightbulb className="w-5 h-5 text-amber-500 mt-1 flex-shrink-0" />
                         <div className="flex-1">
                            <h4 className="font-semibold text-sm mb-1">AI-Powered Tip</h4>
                             {isLoadingInsight ? (
                                <div className="flex items-center text-muted-foreground text-xs">
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generating a smart tip for you...
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground">{insight}</p>
                            )}
                         </div>
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}
