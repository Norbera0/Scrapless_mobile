
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
import type { WasteLog } from '@/types';

interface PantryHealthScoreProps {
    wasteLogs: WasteLog[];
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

export function PantryHealthScore({ wasteLogs }: PantryHealthScoreProps) {
    const { liveItems } = usePantryLogStore();

    const healthData = useMemo(() => {
        let fresh = 0, expiring = 0, expiredInPantry = 0;
        const expiringThisWeek: { name: string; days: number }[] = [];

        liveItems.forEach(item => {
            const { status, days } = getFreshness(item.estimatedExpirationDate);
            switch (status) {
                case 'fresh': fresh++; break;
                case 'expiring':
                    expiring++;
                    if (days >= 0 && days <= 7) expiringThisWeek.push({ name: item.name, days });
                    break;
                case 'expired': expiredInPantry++; break;
            }
        });

        const expiredInLogs = wasteLogs.filter(log => log.sessionWasteReason === 'Past expiry date').reduce((acc, log) => acc + log.items.length, 0);
        const totalExpired = expiredInPantry + expiredInLogs;

        const totalItems = liveItems.length;
        const score = totalItems > 0 ? Math.round(((fresh * 100) + (expiring * 50)) / totalItems) : 100;

        const segments: ProgressSegment[] = totalItems > 0 ? [
            { value: fresh, color: '#10B981', label: 'Fresh' },
            { value: expiring, color: '#F59E0B', label: 'Expiring' },
            { value: totalExpired, color: '#EF4444', label: 'Expired' },
        ] : [];
        
        const pieChartData = [
            { name: 'Health', value: score, color: '#059669' },
            { name: 'Remainder', value: 100 - score, color: '#F3F4F6' },
        ];

        return { score, fresh, expiring, expired: totalExpired, expiringThisWeek, segments, pieChartData };

    }, [liveItems, wasteLogs]);
    
    const getEmoji = (name: string) => {
        const lowerName = name.toLowerCase();
        for (const key in emojiMap) {
            if (lowerName.includes(key)) return emojiMap[key];
        }
        return emojiMap.default;
    }

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-amber-600';
        return 'text-red-600';
    };

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <Card className="rounded-2xl shadow-sm border-gray-200 transition-shadow hover:shadow-md mb-8">
            <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                📊 Pantry Health Score
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center gap-8 p-6">
                <div className="relative w-32 h-32 md:w-36 md:h-36">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={healthData.pieChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius="70%"
                                outerRadius="100%"
                                startAngle={90}
                                endAngle={450}
                                dataKey="value"
                                stroke="none"
                            >
                                {healthData.pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-3xl font-bold ${getScoreColor(healthData.score)}`}>
                            {healthData.score}%
                        </span>
                        <span className="text-xs text-gray-500">Health Score</span>
                    </div>
                </div>

                <div className="flex-1 w-full">
                    <Progress value={healthData.score} segments={healthData.segments} className="h-3 mb-4 rounded-full" />
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-[#10B981] rounded-full"></div>
                            <div>
                                <p className="font-bold text-lg text-gray-800">{healthData.fresh}</p>
                                <p className="text-gray-500">Fresh</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-[#F59E0B] rounded-full"></div>
                             <div>
                                <p className="font-bold text-lg text-gray-800">{healthData.expiring}</p>
                                <p className="text-gray-500">Expiring</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-3 h-3 bg-[#EF4444] rounded-full"></div>
                             <div>
                                <p className="font-bold text-lg text-gray-800">{healthData.expired}</p>
                                <p className="text-gray-500">Expired</p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
        </motion.div>
    );
}
