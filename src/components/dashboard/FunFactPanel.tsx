
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, Sparkles, Landmark, TrendingUp, Info, BarChart, Leaf, Recycle, Globe } from 'lucide-react';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import type { WasteLog, SavingsEvent } from '@/types';
import { isAfter, startOfMonth, subMonths } from 'date-fns';
import { estimateRiceKgFromPesos } from '@/lib/utils';
import { cn } from '@/lib/utils';

type Fact = {
  icon: React.ElementType;
  text: string;
  source: string;
  category: 'Trivia' | 'Tip' | 'BPI' | 'Personalized' | 'Achievement';
  cta?: {
    label: string;
    href: string;
  };
};

interface FunFactPanelProps {
    wasteLogs: WasteLog[];
    savingsEvents: SavingsEvent[];
}

const categoryIcons = {
    'Trivia': Lightbulb,
    'Tip': Recycle,
    'BPI': Landmark,
    'Personalized': Sparkles,
    'Achievement': Leaf,
    'Ocean Conservation': Globe, // Added for sample
}

export function FunFactPanel({ wasteLogs, savingsEvents }: FunFactPanelProps) {
  const router = useRouter();
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  const facts: Fact[] = useMemo(() => {
    const personalizedFacts: Fact[] = [];
    
    // Performance comparison: this month vs last month
    const now = new Date();
    const startOfThisMonth = startOfMonth(now);
    const startOfLastMonth = startOfMonth(subMonths(now, 1));
    const thisMonthWaste = wasteLogs.filter(log => isAfter(new Date(log.date), startOfThisMonth)).reduce((acc, log) => acc + log.totalPesoValue, 0);
    const lastMonthWaste = wasteLogs.filter(log => isAfter(new Date(log.date), startOfLastMonth) && !isAfter(new Date(log.date), startOfThisMonth)).reduce((acc, log) => acc + log.totalPesoValue, 0);

    if (lastMonthWaste > 0 && thisMonthWaste > 0) {
        const percentageChange = ((thisMonthWaste - lastMonthWaste) / lastMonthWaste) * 100;
        const trend = percentageChange > 0 ? 'higher' : 'lower';
        personalizedFacts.push({
            icon: BarChart,
            category: 'Personalized',
            text: `Your food waste is ${Math.abs(percentageChange).toFixed(0)}% ${trend} than last month.`,
            source: 'Scrapless Analytics',
        });
    }

    // Achievement Framing
    const totalSavings = savingsEvents.reduce((acc, e) => acc + e.amount, 0);
    if (totalSavings > 50) {
        const riceSaved = estimateRiceKgFromPesos(totalSavings);
        personalizedFacts.push({
            icon: Leaf,
            category: 'Achievement',
            text: `You've avoided ₱${totalSavings.toFixed(0)} in waste so far. That's like saving ${riceSaved.toFixed(1)}kg of rice!`,
            source: 'Your Savings History',
        });
    }

    // Relatable Context
    personalizedFacts.push({
        icon: Info,
        category: 'Trivia',
        text: `The average Filipino household wastes around ₱1,200 worth of food every month.`,
        source: 'FNRI-DOST Study'
    });
    
    // Base BPI Facts
    const baseFacts: Fact[] = [
      { icon: Landmark, category: 'BPI', text: 'By choosing BPI e-Statements instead of paper, you save at least 36 sheets of paper per account yearly!', source: 'BPI Internal Data' },
      { icon: Landmark, category: 'BPI', text: 'BPI was the first Philippine bank to get Green Building certification for its branches.', source: 'BPI Sustainability Report' },
      { icon: Globe, category: 'BPI', text: 'BPI Wealth adopted 280 pawikan (sea turtle) nests to celebrate its Sustainable Fund Suite, helping protect endangered species.', source: 'BPI Foundation' },
      { icon: Lightbulb, category: 'Tip', text: 'Revive wilted greens by soaking them in a bowl of ice water for 5-10 minutes.', source: 'Common Kitchen Hack' },
    ];
    
    return [...baseFacts, ...personalizedFacts];
  }, [wasteLogs, savingsEvents]);


  useEffect(() => {
    if (facts.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentFactIndex((prevIndex) => (prevIndex + 1) % facts.length);
    }, 10000); // Rotate every 10 seconds
    return () => clearInterval(timer);
  }, [facts.length]);

  if (facts.length === 0) return null;

  const currentFact = facts[currentFactIndex];
  const Icon = categoryIcons[currentFact.category as keyof typeof categoryIcons] || Lightbulb;

  return (
    <div 
        className={cn(
            "relative overflow-hidden rounded-2xl p-6 min-h-[140px] flex items-center",
            "bg-gradient-to-br from-green-500 to-green-700 text-white",
            "shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        )}
    >
        {/* Glassmorphism background effect */}
        <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>

        <div className="relative z-10 flex items-center gap-6 w-full">
            {/* Icon Section */}
            <div className="flex-shrink-0 w-20 h-20 bg-white/30 rounded-full flex items-center justify-center icon-pulse">
                <Icon className="w-10 h-10 text-white" />
            </div>

            {/* Content Section */}
            <div className="flex-1">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentFactIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h3 className="font-bold text-lg text-white drop-shadow-sm">Did You Know?</h3>
                        <p className="text-white/90 text-sm mt-1 leading-relaxed">{currentFact.text}</p>
                        <p className="text-xs text-white/60 mt-2">Source: {currentFact.source}</p>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    </div>
  );
}
