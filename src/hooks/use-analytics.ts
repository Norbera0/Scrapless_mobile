
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { usePantryLogStore } from '@/stores/pantry-store';
import { useSavingsStore } from '@/stores/savings-store';
import type { AnalyticsData, PantryItem, SavingsEvent, WasteLog, WeatherData } from '@/types';
import { differenceInDays, isAfter, isBefore, startOfDay, subDays, parseISO, startOfMonth, subMonths } from 'date-fns';
import { getWeatherForMakati } from '@/services/weather';

const getFoodCategory = (itemName: string): string => {
    const lowerItem = itemName.toLowerCase();
    if (['lettuce', 'tomato', 'potato', 'onion', 'kangkong', 'pechay', 'carrots', 'vegetable'].some(v => lowerItem.includes(v))) return 'Vegetables';
    if (['apple', 'banana', 'orange', 'fruit'].some(v => lowerItem.includes(v))) return 'Fruits';
    if (['milk', 'cheese', 'yogurt', 'dairy'].some(v => lowerItem.includes(v))) return 'Dairy';
    if (['bread', 'rice', 'pasta', 'grain'].some(v => lowerItem.includes(v))) return 'Grains';
    if (['chicken', 'beef', 'pork', 'fish', 'meat'].some(v => lowerItem.includes(v))) return 'Meat & Fish';
    return 'Other';
};


export function useAnalytics(): AnalyticsData | null {
    const { logs, logsInitialized } = useWasteLogStore();
    const { liveItems, archivedItems, pantryInitialized } = usePantryLogStore();
    const { savingsEvents, savingsInitialized } = useSavingsStore();
    const [weather, setWeather] = useState<WeatherData | null>(null);

    useEffect(() => {
        getWeatherForMakati().then(setWeather);
    }, []);

    const analyticsData = useMemo(() => {
        if (!logsInitialized || !pantryInitialized || !savingsInitialized) {
            return null;
        }

        const now = new Date();
        const today = startOfDay(now);
        const sevenDaysAgo = subDays(today, 7);
        const fourteenDaysAgo = subDays(today, 14);
        const startOfThisMonth = startOfMonth(today);
        const startOfLastMonth = subMonths(startOfThisMonth, 1);

        // --- WASTE ANALYSIS ---
        const thisWeekLogs = logs.filter(log => isAfter(parseISO(log.date), sevenDaysAgo));
        const lastWeekLogs = logs.filter(log => isAfter(parseISO(log.date), fourteenDaysAgo) && isBefore(parseISO(log.date), sevenDaysAgo));
        const thisMonthLogs = logs.filter(log => isAfter(parseISO(log.date), startOfThisMonth));
        const lastMonthLogs = logs.filter(log => isAfter(parseISO(log.date), startOfLastMonth) && isBefore(parseISO(log.date), startOfThisMonth));

        const thisWeekValue = thisWeekLogs.reduce((sum, log) => sum + log.totalPesoValue, 0);
        const lastWeekValue = lastWeekLogs.reduce((sum, log) => sum + log.totalPesoValue, 0);
        const weekOverWeekChange = lastWeekValue > 0 ? ((thisWeekValue - lastWeekValue) / lastWeekValue) * 100 : (thisWeekValue > 0 ? Infinity : 0);

        const thisMonthValue = thisMonthLogs.reduce((sum, log) => sum + log.totalPesoValue, 0);
        const lastMonthValue = lastMonthLogs.reduce((sum, log) => sum + log.totalPesoValue, 0);
        const monthOverMonthChange = lastMonthValue > 0 ? ((thisMonthValue - lastMonthValue) / lastMonthValue) * 100 : (thisMonthValue > 0 ? Infinity : 0);
        
        const totalWasteValue = logs.reduce((sum, log) => sum + log.totalPesoValue, 0);
        const totalWasteCO2e = logs.reduce((sum, log) => sum + log.totalCarbonFootprint, 0);
        const avgWeeklyValue = logs.length > 0 ? (totalWasteValue / (differenceInDays(today, parseISO(logs[logs.length - 1].date)) / 7)) : 0;
        
        const wasteLogFrequency = logs.length > 0 ? (logs.length / (differenceInDays(today, parseISO(logs[logs.length - 1].date)) / 7)) : 0;
        const daysSinceLastLog = logs.length > 0 ? differenceInDays(today, parseISO(logs[0].date)) : -1;

        const categoryValueMap: Record<string, number> = {};
        const categoryFrequencyMap: Record<string, number> = {};
        const reasonFrequencyMap: Record<string, number> = {};
        logs.forEach(log => {
            if (log.sessionWasteReason) {
                reasonFrequencyMap[log.sessionWasteReason] = (reasonFrequencyMap[log.sessionWasteReason] || 0) + 1;
            }
            log.items.forEach(item => {
                const category = getFoodCategory(item.name);
                categoryValueMap[category] = (categoryValueMap[category] || 0) + item.pesoValue;
                categoryFrequencyMap[category] = (categoryFrequencyMap[category] || 0) + 1;
            });
        });

        const topWastedCategoryByValue = Object.entries(categoryValueMap).sort((a,b) => b[1] - a[1])[0];
        const topWastedCategoryByFrequency = Object.entries(categoryFrequencyMap).sort((a,b) => b[1] - a[1])[0];
        const topWasteReason = Object.entries(reasonFrequencyMap).sort((a,b) => b[1] - a[1])[0];
        
        // --- PANTRY ANALYSIS ---
        const totalPantryValue = liveItems.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
        let freshItems = 0, expiringSoonItems = 0, expiredItems = 0;
        liveItems.forEach(item => {
            const daysLeft = differenceInDays(parseISO(item.estimatedExpirationDate), today);
            if (daysLeft < 0) expiredItems++;
            else if (daysLeft <= 3) expiringSoonItems++;
            else freshItems++;
        });
        const pantryHealthScore = liveItems.length > 0 ? Math.round(((freshItems * 100) + (expiringSoonItems * 50)) / liveItems.length) : 100;

        const usedItems = archivedItems.filter(i => i.status === 'used');
        const totalArchivedDuration = archivedItems.reduce((sum, item) => {
            if (item.usedDate) {
                return sum + differenceInDays(parseISO(item.usedDate), parseISO(item.addedDate));
            }
            return sum;
        }, 0);
        const avgItemDuration = usedItems.length > 0 ? totalArchivedDuration / usedItems.length : 0;
        const turnoverRate = liveItems.length > 0 && usedItems.length > 0 ? (usedItems.length / (liveItems.length + usedItems.length)) * 100 : 0;

        // --- SAVINGS ANALYSIS ---
        const totalVirtualSavings = savingsEvents.reduce((sum, e) => sum + e.amount, 0);
        const thisWeekSavings = savingsEvents.filter(e => isAfter(parseISO(e.date), sevenDaysAgo));
        const thisMonthSavings = savingsEvents.filter(e => isAfter(parseISO(e.date), startOfThisMonth));
        const avgAmountPerEvent = savingsEvents.length > 0 ? totalVirtualSavings / savingsEvents.length : 0;
        const savingsByType = savingsEvents.reduce((acc, event) => {
            acc[event.type] = (acc[event.type] || 0) + event.amount;
            return acc;
        }, {} as Record<SavingsEvent['type'], number>);
        
        // --- FEATURE ENGINEERING ---
        const wastedItems = archivedItems.filter(i => i.status === 'wasted');
        const useRate = (usedItems.length + wastedItems.length) > 0 ? (usedItems.length / (usedItems.length + wastedItems.length)) * 100 : 100;
        const savingsPerWastePeso = totalWasteValue > 0 ? totalVirtualSavings / totalWasteValue : totalVirtualSavings;

        const categoryUsage = archivedItems.reduce((acc, item) => {
            const category = getFoodCategory(item.name);
            if (!acc[category]) {
                acc[category] = { used: 0, wasted: 0 };
            }
            if (item.status === 'used') {
                acc[category].used++;
            } else {
                acc[category].wasted++;
            }
            return acc;
        }, {} as Record<string, { used: number, wasted: number }>);
        
        const wasteRateByCategory = Object.entries(categoryUsage).reduce((acc, [category, counts]) => {
            const total = counts.used + counts.wasted;
            acc[category] = total > 0 ? (counts.wasted / total) * 100 : 0;
            return acc;
        }, {} as Record<string, number>);

        const totalWasteLagTime = wastedItems.reduce((sum, item) => {
             if (item.usedDate) { // 'usedDate' is when it was archived (used or wasted)
                return sum + differenceInDays(parseISO(item.usedDate), parseISO(item.addedDate));
            }
            return sum;
        }, 0);
        const avgWasteLagTime = wastedItems.length > 0 ? totalWasteLagTime / wastedItems.length : 0;

        const consumptionVelocity = usedItems.reduce((acc, item) => {
            const category = getFoodCategory(item.name);
            const duration = item.usedDate ? differenceInDays(parseISO(item.usedDate), parseISO(item.addedDate)) : avgItemDuration;
            if (!acc[category]) {
                acc[category] = { totalDuration: 0, count: 0, avgDays: 0};
            }
            acc[category].totalDuration += duration;
            acc[category].count++;
            acc[category].avgDays = acc[category].totalDuration / acc[category].count;
            return acc;
        }, {} as Record<string, { totalDuration: number; count: number; avgDays: number; }>);
        
        const engagementScore = Math.min(10, (pantryInitialized ? 2 : 0) + (logsInitialized ? 2 : 0) + Math.min(6, Math.floor(logs.length / 5)));

        return {
            pantryHealthScore,
            totalVirtualSavings,
            totalWasteValue,
            totalWasteCO2e,
            engagementScore,
            weather,
            waste: {
                thisWeekValue,
                lastWeekValue,
                weekOverWeekChange: isFinite(weekOverWeekChange) ? weekOverWeekChange : null,
                thisMonthValue,
                lastMonthValue,
                monthOverMonthChange: isFinite(monthOverMonthChange) ? monthOverMonthChange : null,
                avgWeeklyValue,
                topWastedCategoryByValue: topWastedCategoryByValue ? { name: topWastedCategoryByValue[0], value: topWastedCategoryByValue[1] } : null,
                topWastedCategoryByFrequency: topWastedCategoryByFrequency ? { name: topWastedCategoryByFrequency[0], count: topWastedCategoryByFrequency[1] } : null,
                topWasteReason: topWasteReason ? { name: topWasteReason[0], count: topWasteReason[1] } : null,
                wasteLogFrequency,
                daysSinceLastLog,
                wasteRateByCategory,
                avgWasteLagTime,
            },
            pantry: {
                totalValue: totalPantryValue,
                totalItems: liveItems.length,
                freshItems,
                expiringSoonItems,
                expiredItems,
                avgItemDuration,
                turnoverRate,
                consumptionVelocity,
            },
            savings: {
                thisWeekAmount: thisWeekSavings.reduce((sum, e) => sum + e.amount, 0),
                thisMonthAmount: thisMonthSavings.reduce((sum, e) => sum + e.amount, 0),
                avgAmountPerEvent,
                byType: savingsByType,
            },
            useRate,
            savingsPerWastePeso,
        };

    }, [logs, liveItems, archivedItems, savingsEvents, logsInitialized, pantryInitialized, savingsInitialized, weather]);

    return analyticsData;
}
