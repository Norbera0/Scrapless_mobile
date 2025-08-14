
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Sparkles, Landmark, TrendingUp, Info, BarChart, Leaf, Recycle, Globe, ArrowRight, User } from 'lucide-react';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import type { WasteLog, SavingsEvent } from '@/types';
import { isAfter, startOfMonth, subMonths } from 'date-fns';
import { estimateRiceKgFromPesos } from '@/lib/utils';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

type Fact = {
  icon: React.ElementType;
  text: string;
  source: string;
  category: 'Trivia' | 'Tip' | 'BPI' | 'Personalized' | 'Achievement';
  imageUrl?: string;
  lottieUrl?: string;
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
        text: "Planning your pantry ahead of time saves more than ₱260 monthly. Smart planning = smart savings!",
        source: 'UN Environment Programme 2024 Food Waste Index Report',
        lottieUrl: 'https://lottie.host/2ccf0ba5-142e-452f-b207-7c5d355560b9/bsQHBXiFyo.lottie',
    };
    
    const baseFacts: Fact[] = [
      { 
        icon: Landmark, 
        category: 'BPI', 
        text: 'By choosing BPI e-Statements instead of paper, you save at least 36 sheets of paper per account yearly!', 
        source: 'BPI Internal Data',
        cta: { label: 'Go Paperless with BPI', href: '/bpi' },
        lottieUrl: 'https://lottie.host/4b09862a-3dc0-4ed2-bf19-3e9af473c76f/QqSSRVwczU.lottie'
      },
      {
        icon: Recycle,
        category: 'Tip',
        text: 'Revive wilted greens like lettuce or kangkong by soaking them in a bowl of ice water for 5-10 minutes.',
        source: 'Common Kitchen Hack',
        lottieUrl: 'https://lottie.host/c2e211e3-d07e-4fbc-9b76-f94f9ebb0637/WGXn7ipkeF.lottie',
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
     <Card className="shadow-sm">
        <CardHeader>
             <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Icon className="w-5 h-5" />
                Did You Know?
            </CardTitle>
        </CardHeader>
        <CardContent>
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentFactIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col h-full"
                >
                    <div className="flex-1 space-y-4">
                        <div className={cn("flex gap-4", (currentFact.imageUrl || currentFact.lottieUrl) ? 'flex-row items-start' : 'flex-col')}>
                            {currentFact.imageUrl && (
                                <div className="relative w-32 h-32 flex-shrink-0">
                                    <Image
                                        src={currentFact.imageUrl}
                                        alt={currentFact.text}
                                        layout="fill"
                                        objectFit="contain"
                                        className="rounded-lg"
                                    />
                                </div>
                            )}
                            {currentFact.lottieUrl && (
                                <div className="relative w-32 h-32 flex-shrink-0">
                                    <DotLottieReact
                                        src={currentFact.lottieUrl}
                                        loop
                                        autoplay
                                    />
                                </div>
                            )}
                             <div className="flex-1">
                                {currentFact.mainFact ? (
                                    <div className="mb-4">
                                        <p className="text-4xl font-bold text-primary">{currentFact.mainFact.value}</p>
                                        <p className="text-sm text-gray-600">{currentFact.mainFact.description}</p>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm leading-relaxed">{currentFact.text}</p>
                                )}

                                {currentFact.subFacts && (
                                    <div className="grid grid-cols-3 gap-2 text-center text-xs text-green-800 mt-4">
                                        {currentFact.subFacts.map(sub => (
                                            <div key={sub.label} className="bg-green-100/70 p-1.5 rounded-md">
                                                <p className="font-semibold">{sub.value}</p>
                                                <p className="opacity-80">{sub.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {currentFact.relatedTip && (
                            <div className="text-xs text-center text-gray-600 bg-yellow-100/60 p-2 rounded-md border border-yellow-200/80 mt-4">
                                <span className="font-semibold">💡 Quick Tip:</span> {currentFact.relatedTip}
                            </div>
                        )}
                    </div>
                    
                    {currentFact.cta && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-4"
                            onClick={() => router.push(currentFact.cta!.href)}
                        >
                            {currentFact.cta.label}
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    )}
                    <p className="text-xs text-muted-foreground mt-4 text-right">Source: {currentFact.source}</p>
                </motion.div>
            </AnimatePresence>
        </CardContent>
    </Card>
  );
}
