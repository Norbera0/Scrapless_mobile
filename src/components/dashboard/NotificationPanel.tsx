
'use client';

import { useState } from 'react';
import type { Notification } from '@/types';
import { CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Lightbulb, CheckCircle, BellRing, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface NotificationPanelProps {
    notifications: Notification[];
}

const categoryConfig = {
    critical: {
        icon: AlertTriangle,
        color: 'border-l-red-500 bg-red-50 text-red-800',
        badgeColor: 'destructive' as const,
        title: 'Critical Alerts',
    },
    important: {
        icon: BellRing,
        color: 'border-l-yellow-500 bg-yellow-50 text-yellow-800',
        badgeColor: 'secondary' as const,
        title: 'Important Reminders',
    },
    info: {
        icon: Lightbulb,
        color: 'border-l-blue-500 bg-blue-50 text-blue-800',
        badgeColor: 'default' as const,
        title: 'Helpful Tips',
    },
    success: {
        icon: CheckCircle,
        color: 'border-l-green-500 bg-green-50 text-green-800',
        badgeColor: 'default' as const,
        title: 'Success!',
    }
};

export function NotificationPanel({ notifications }: NotificationPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const groupedNotifications = notifications.reduce((acc, notif) => {
        const category = notif.category;
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(notif);
        return acc;
    }, {} as Record<Notification['category'], Notification[]>);

    const orderedCategories: Notification['category'][] = ['critical', 'important', 'success', 'info'];
    const notificationsToShow = isExpanded ? notifications : notifications.slice(0, 3);

    const renderNotifications = (notificationsToRender: Notification[]) => {
        const groupedToRender = notificationsToRender.reduce((acc, notif) => {
            const category = notif.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(notif);
            return acc;
        }, {} as Record<Notification['category'], Notification[]>);

        return orderedCategories.map(category => {
            const categoryNotifications = groupedToRender[category];
            if (!categoryNotifications || categoryNotifications.length === 0) return null;

            return (
                <div key={category} className="p-4 border-b last:border-none">
                    <h4 className="text-sm font-semibold mb-2">{categoryConfig[category].title}</h4>
                    <div className="space-y-3">
                    {categoryNotifications.map(notif => {
                        const Icon = categoryConfig[notif.category].icon;
                        return (
                            <div key={notif.id} className={cn("flex items-start gap-3 p-3 rounded-lg border", categoryConfig[notif.category].color)}>
                                <Icon className="h-5 w-5 mt-1 flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="font-semibold text-sm">{notif.title}</p>
                                    <p className="text-xs">{notif.message}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatDistanceToNow(new Date(notif.date), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                    </div>
                </div>
            )
        })
    }

    return (
        <div className="flex flex-col h-full">
            <CardHeader className="border-b">
                <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <ScrollArea className="h-80">
                <CardContent className="p-0">
                    {notifications.length > 0 ? (
                        renderNotifications(notificationsToShow)
                    ) : (
                        <div className="text-center p-10 text-muted-foreground">
                            <BellOff className="mx-auto h-10 w-10 mb-4" />
                            <p className="font-semibold">No new notifications</p>
                            <p className="text-sm">You're all caught up!</p>
                        </div>
                    )}
                </CardContent>
            </ScrollArea>
            {notifications.length > 3 && !isExpanded && (
                <CardFooter className="p-2 border-t">
                    <Button variant="ghost" className="w-full" onClick={() => setIsExpanded(true)}>View All</Button>
                </CardFooter>
            )}
        </div>
    );
}
