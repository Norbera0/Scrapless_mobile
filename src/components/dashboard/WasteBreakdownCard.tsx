
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { WasteLog } from '@/types';
import { BarChart2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';

interface WasteBreakdownCardProps {
    wasteLogs: WasteLog[];
}

const COLORS = ['#059669', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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
    const router = useRouter();

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

    if (wasteLogs.length === 0) {
        return null;
    }
    
    const topCategory = categoryData.length > 0 ? categoryData[0].name : 'various items';

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart2 className="w-5 h-5 text-primary" />
                    Waste Breakdown
                </CardTitle>
                <CardDescription className="text-xs">By food category based on cost.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="w-full md:w-1/2 h-[180px]">
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
                    <div className="w-full md:w-1/2 text-center md:text-left space-y-3">
                         <p className="text-sm text-muted-foreground leading-relaxed">
                            Most of your waste came from <span className="font-semibold text-primary">{topCategory}</span>. To learn more about your waste data, go to the Analytics.
                        </p>
                        <Button size="sm" onClick={() => router.push('/analytics')}>Go to Analytics</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
