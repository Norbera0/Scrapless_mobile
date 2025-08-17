
'use client';

import { useMemo } from 'react';
import { usePantryLogStore } from '@/stores/pantry-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { differenceInDays, startOfToday } from 'date-fns';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Progress, type ProgressSegment } from '@/components/ui/progress';
import type { WasteLog, PantryItem } from '@/types';

interface PantryHealthScoreProps {
    wasteLogs: WasteLog[];
    archivedItems: PantryItem[];
}

const getFreshness = (expirationDate: string) => {
    const today = startOfToday();
    const expiry = new Date(expirationDate);
    const daysLeft = differenceInDays(expiry, today);

    if (daysLeft < 0) return { status: 'expired', days: daysLeft };
    if (daysLeft <= 3) return { status: 'expiring', days: daysLeft };
    return { status: 'fresh', days: daysLeft };
};

const emojiMap: { [key: string]: string } = {
    tomatoes: '🍅', milk: '🥛', lettuce: '🥬', apple: '🍎', banana: '🍌',
    bread: '🍞', cheese: '🧀', egg: '🥚', meat: '🥩', fish: '🐟',
    potato: '🥔', onion: '🧅', carrot: '🥕', default: '🥬'
};

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

export function PantryHealthScore({ wasteLogs, archivedItems }: PantryHealthScoreProps) {
    const { liveItems } = usePantryLogStore();

    const healthData = useMemo(() => {
        let fresh = 0, expiring = 0, expiredInPantry = 0;
        
        liveItems.forEach(item => {
            const { status } = getFreshness(item.estimatedExpirationDate);
            switch (status) {
                case 'fresh': fresh++; break;
                case 'expiring': expiring++; break;
                case 'expired': expiredInPantry++; break;
            }
        });

        const expiredInLogs = wasteLogs.filter(log => log.sessionWasteReason === 'Past expiry date').reduce((acc, log) => acc + log.items.length, 0);
        const totalExpired = expiredInPantry + expiredInLogs;
        
        const usedItems = archivedItems.filter(item => item.status === 'used').length;

        const segments: ProgressSegment[] = [
            { value: fresh, color: '#10B981', label: 'Fresh' },
            { value: usedItems, color: '#3B82F6', label: 'Used' },
            { value: expiring, color: '#F59E0B', label: 'Expiring' },
            { value: totalExpired, color: '#EF4444', label: 'Expired' },
        ].filter(s => s.value > 0);
        
        return { fresh, expiring, expired: totalExpired, used: usedItems, segments };

    }, [liveItems, wasteLogs, archivedItems]);
    
    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <Card className="rounded-2xl shadow-sm border-gray-200 transition-shadow hover:shadow-md">
            <CardHeader className="p-4 pt-3 pb-2">
                <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                📊 Pantry Status
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <Progress segments={healthData.segments} className="h-3 mb-3 rounded-full" />
                <div className="grid grid-cols-4 gap-x-2 text-xs">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <div className="w-2 h-2 bg-[#10B981] rounded-full flex-shrink-0"></div>
                        <p className="text-gray-600"><span className="font-bold text-gray-800">{healthData.fresh}</span> Fresh</p>
                    </div>
                     <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <div className="w-2 h-2 bg-[#3B82F6] rounded-full flex-shrink-0"></div>
                        <p className="text-gray-600"><span className="font-bold text-gray-800">{healthData.used}</span> Used</p>
                    </div>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <div className="w-2 h-2 bg-[#F59E0B] rounded-full flex-shrink-0"></div>
                        <p className="text-gray-600"><span className="font-bold text-gray-800">{healthData.expiring}</span> Expiring</p>
                    </div>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                       <div className="w-2 h-2 bg-[#EF4444] rounded-full flex-shrink-0"></div>
                       <p className="text-gray-600"><span className="font-bold text-gray-800">{healthData.expired}</span> Expired</p>
                    </div>
                </div>
            </CardContent>
        </Card>
        </motion.div>
    );
}
