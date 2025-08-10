
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, Sparkles, Landmark, TrendingUp, Info, BarChart, Leaf } from 'lucide-react';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import type { WasteLog, SavingsEvent } from '@/types';
import { isAfter, startOfMonth, subMonths } from 'date-fns';
import { estimateRiceKgFromPesos } from '@/lib/utils';

type Fact = {
  icon: React.ElementType;
  text: string;
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
        });
    }

    // Relatable Context
    personalizedFacts.push({
        icon: Info,
        category: 'Trivia',
        text: `Did you know? The average Filipino household wastes around ₱1,200 worth of food every month.`
    });
    
    // Base BPI Facts
    const baseFacts: Fact[] = [
      { icon: Landmark, category: 'BPI', text: 'By choosing BPI e-Statements instead of paper, you save at least 36 sheets of paper per account yearly!' },
      { icon: Landmark, category: 'BPI', text: 'Using the BPI Mobile App helps reduce your carbon footprint by eliminating trips to a branch.' },
      { icon: Landmark, category: 'BPI', text: 'BPI offers paperless ATM services, like on-screen balance checks, to reduce receipt waste.' },
      { icon: Landmark, category: 'BPI', text: "Fun fact! BPI Wealth adopted 280 pawikan (sea turtle) nests to celebrate its Sustainable Fund Suite." },
      { icon: Landmark, category: 'BPI', text: 'Did you know BPI was the first Philippine bank to get Green Building certification for its branches?' },
      { icon: Landmark, category: 'BPI', text: 'You can donate to charities like WWF directly from your BPI app using the eDonate feature.', cta: { label: 'Explore BPI Hub', href: '/bpi' }},
      { icon: Landmark, category: 'BPI', text: 'You can get a Solar Mortgage from BPI to help finance solar panels for your home.', cta: { label: 'Learn More in BPI Hub', href: '/bpi' }},
      { icon: Info, category: 'Tip', text: 'Revive wilted greens by soaking them in a bowl of ice water for 5-10 minutes.' },
      { icon: Lightbulb, category: 'Trivia', text: 'In the Philippines, food waste per capita is estimated at 20kg per year.' },
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
  const Icon = currentFact.icon;

  const categoryColors: Record<Fact['category'], string> = {
    Trivia: "bg-blue-100 text-blue-800",
    Tip: "bg-amber-100 text-amber-800",
    BPI: "bg-red-100 text-red-800",
    Personalized: "bg-green-100 text-green-800",
    Achievement: "bg-purple-100 text-purple-800",
  }

  return (
    <Card className="shadow-sm bg-white overflow-hidden">
      <CardContent className="p-4">
        <AnimatePresence mode="wait">
            <motion.div
                key={currentFactIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="flex items-start gap-4"
            >
                <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/5">
                    <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                    <p className={`text-xs font-bold uppercase tracking-wider ${categoryColors[currentFact.category]}`}>{currentFact.category}</p>
                    <p className="text-sm text-foreground mt-1">{currentFact.text}</p>
                    {currentFact.cta && (
                        <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto mt-2 text-primary"
                            onClick={() => router.push(currentFact.cta!.href)}
                        >
                            {currentFact.cta.label}
                        </Button>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
