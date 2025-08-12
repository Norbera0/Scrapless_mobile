
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, Sparkles, Landmark, TrendingUp, Info, BarChart, Leaf, Recycle, Globe, ArrowRight, User } from 'lucide-react';
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
  mainFact?: {
    value: string;
    description: string;
  };
  subFacts?: {
      label: string;
      value: string;
  }[];
  relatedTip?: string;
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
    'Ocean Conservation': Globe, 
}

export function FunFactPanel({ wasteLogs, savingsEvents }: FunFactPanelProps) {
  const router = useRouter();
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  const facts: Fact[] = useMemo(() => {
    const personalizedFacts: Fact[] = [];
    
    const now = new Date();
    const startOfThisMonth = startOfMonth(now);
    const startOfLastMonth = startOfMonth(subMonths(now, 1));
    
    if(wasteLogs && wasteLogs.length > 0) {
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
    }

    if(savingsEvents && savingsEvents.length > 0) {
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
    }

    // New enhanced fact based on prompt
    const enhancedFact: Fact = {
        icon: Info,
        category: 'Trivia',
        text: 'Average Filipino household food waste.', // Fallback text
        mainFact: {
            value: "₱1,200",
            description: "per month"
        },
        subFacts: [
            { label: "Per week", value: "₱300" },
            { label: "Per person", value: "₱240" },
            { label: "Potential Savings", value: "60%" },
        ],
        relatedTip: "Meal planning can reduce waste by up to 40%.",
        source: 'FNRI-DOST Study',
        cta: {
            label: 'Beat the average!',
            href: '/log-waste?method=camera'
        }
    };
    
    const baseFacts: Fact[] = [
      { 
        icon: Landmark, 
        category: 'BPI', 
        text: 'By choosing BPI e-Statements instead of paper, you save at least 36 sheets of paper per account yearly!', 
        source: 'BPI Internal Data',
        cta: { label: 'Go Paperless with BPI', href: '/bpi' }
      },
      {
        icon: Recycle,
        category: 'Tip',
        text: 'Revive wilted greens like lettuce or kangkong by soaking them in a bowl of ice water for 5-10 minutes.',
        source: 'Common Kitchen Hack',
      }
    ];
    
    return [enhancedFact, ...baseFacts, ...personalizedFacts];
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
     <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50/50 to-white p-5 shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-md hover:-translate-y-1">
        <AnimatePresence mode="wait">
            <motion.div
                key={currentFactIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col h-full"
            >
                <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center icon-pulse shadow-lg">
                        <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-base text-green-900">Did You Know?</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Source: {currentFact.source}</p>
                    </div>
                </div>

                {currentFact.mainFact ? (
                    <div className="mb-4">
                        <p className="text-4xl font-bold text-[#2d5016]">{currentFact.mainFact.value}</p>
                        <p className="text-sm text-gray-600">{currentFact.mainFact.description}</p>
                    </div>
                ) : (
                    <p className="text-gray-700 text-sm mt-1 leading-relaxed mb-4">{currentFact.text}</p>
                )}

                {currentFact.subFacts && (
                    <div className="grid grid-cols-3 gap-2 text-center text-xs text-green-800 mb-4">
                        {currentFact.subFacts.map(sub => (
                            <div key={sub.label} className="bg-green-100/70 p-1.5 rounded-md">
                                <p className="font-semibold">{sub.value}</p>
                                <p className="opacity-80">{sub.label}</p>
                            </div>
                        ))}
                    </div>
                )}
                
                {currentFact.relatedTip && (
                     <div className="text-xs text-center text-gray-600 bg-yellow-100/60 p-2 rounded-md border border-yellow-200/80">
                        <span className="font-semibold">💡 Quick Tip:</span> {currentFact.relatedTip}
                    </div>
                )}
                
                {currentFact.cta && (
                    <Button
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg h-9 mt-4"
                        onClick={() => router.push(currentFact.cta!.href)}
                    >
                        {currentFact.cta.label}
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                )}
            </motion.div>
        </AnimatePresence>
    </div>
  );
}
