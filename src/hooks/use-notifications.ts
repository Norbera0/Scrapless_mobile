
'use client';

import { useMemo } from 'react';
import { usePantryLogStore } from '@/stores/pantry-store';
import { useInsightStore } from '@/stores/insight-store';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { differenceInDays, startOfToday, parseISO } from 'date-fns';
import type { Notification } from '@/types';

export function useNotifications() {
    const { liveItems, pantryInitialized } = usePantryLogStore();
    const { insights, insightsInitialized } = useInsightStore();

    const notifications = useMemo(() => {
        const generated: Notification[] = [];
        const today = startOfToday();

        if (pantryInitialized) {
            // Critical: Expiring Today/Tomorrow
            const expiringSoon = liveItems.filter(item => {
                const daysLeft = differenceInDays(parseISO(item.estimatedExpirationDate), today);
                return daysLeft >= 0 && daysLeft <= 1;
            });

            if (expiringSoon.length > 0) {
                const itemNames = expiringSoon.map(i => i.name).slice(0, 2).join(', ');
                const additionalItems = expiringSoon.length > 2 ? ` and ${expiringSoon.length - 2} more` : '';
                generated.push({
                    id: `expiring-soon-${today.toISOString()}`,
                    category: 'critical',
                    title: `${expiringSoon.length} item(s) expire soon`,
                    message: `${itemNames}${additionalItems} need to be used!`,
                    date: new Date().toISOString(),
                    isRead: false,
                });
            }

            // Important: Expiring this week
            const expiringThisWeek = liveItems.filter(item => {
                const daysLeft = differenceInDays(parseISO(item.estimatedExpirationDate), today);
                return daysLeft > 1 && daysLeft <= 7;
            });
            if (expiringThisWeek.length > 0) {
                 generated.push({
                    id: `expiring-week-${today.toISOString()}`,
                    category: 'important',
                    title: `Plan ahead for ${expiringThisWeek.length} items`,
                    message: `You have items expiring in the next 7 days. Plan your meals to avoid waste.`,
                    date: new Date().toISOString(),
                    isRead: false,
                });
            }
        }
        
        if (insightsInitialized) {
            const newInsights = insights.filter(i => i.status === 'new');
            newInsights.forEach(insight => {
                 generated.push({
                    id: `insight-${insight.id}`,
                    category: 'important',
                    title: `New AI Insight: ${insight.patternAlert}`,
                    message: insight.smartTip,
                    date: insight.date,
                    isRead: false,
                });
            })
        }

        // Dummy success notification for demo
        generated.push({
            id: 'success-dummy-1',
            category: 'success',
            title: 'Great job!',
            message: 'You saved ₱150 this month by reducing waste.',
            date: new Date().toISOString(),
            isRead: false
        })

        return generated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    }, [liveItems, insights, pantryInitialized, insightsInitialized]);

    const totalNew = notifications.filter(n => !n.isRead).length;

    const priorityColor = useMemo(() => {
        if (notifications.some(n => n.category === 'critical' && !n.isRead)) return 'red';
        if (notifications.some(n => n.category === 'important' && !n.isRead)) return 'yellow';
        if (notifications.some(n => n.category === 'success' && !n.isRead)) return 'green';
        if (notifications.some(n => n.category === 'info' && !n.isRead)) return 'blue';
        return 'gray';
    }, [notifications]);

    return { notifications, totalNew, priorityColor };
}
