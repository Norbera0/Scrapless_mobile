
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, Sparkles, Landmark, TrendingUp, Info } from 'lucide-react';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { usePantryLogStore } from '@/stores/pantry-store';
import { useSavingsStore } from '@/stores/savings-store';
import { Button } from '../ui/button';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

type Fact = {
  icon: React.ElementType;
  text: string;
  category: 'Trivia' | 'Tip' | 'BPI' | 'Personalized';
  cta?: {
    label: string;
    href: string;
  };
};

export function FunFactPanel() {
  const router = useRouter();
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  const { logs } = useWasteLogStore();
  const { savingsEvents } = useSavingsStore();

  const facts: Fact[] = useMemo(() => {
    const personalizedFacts: Fact[] = [];
    
    if (logs.length > 2) {
      const topWastedCategory = logs
        .flatMap(l => l.items)
        .reduce((acc, item) => {
            // A simple categorization logic
            const category = item.name.includes('vegetable') ? 'vegetables' : item.name.includes('rice') ? 'rice' : 'other';
            acc[category] = (acc[category] || 0) + item.pesoValue;
            return acc;
        }, {} as Record<string, number>);

      const topCategory = Object.keys(topWastedCategory).sort((a, b) => topWastedCategory[b] - topWastedCategory[a])[0];
      if (topCategory !== 'other') {
        personalizedFacts.push({
            icon: TrendingUp,
            category: 'Personalized',
            text: `You've been wasting a lot of ${topCategory}. Try buying smaller portions to save money.`,
        });
      }
    }

    const totalSavings = savingsEvents.reduce((acc, e) => acc + e.amount, 0);
    if(totalSavings > 100) {
         personalizedFacts.push({
            icon: Sparkles,
            category: 'Personalized',
            text: `You've saved over ₱${totalSavings.toFixed(0)}! Keep up the great work reducing waste.`,
        });
    }

    const baseFacts: Fact[] = [
      { icon: Lightbulb, category: 'Trivia', text: 'Did you know? About one-third of all food produced globally for human consumption is lost or wasted.' },
      { icon: Info, category: 'Tip', text: 'Store potatoes and onions separately to prevent them from sprouting prematurely.' },
      { icon: Landmark, category: 'BPI', text: 'Link your BPI account to transfer your eco-savings and earn exclusive rewards.', cta: { label: 'Link Account', href: '/bpi' }},
      { icon: Info, category: 'Tip', text: 'Revive wilted greens by soaking them in a bowl of ice water for 5-10 minutes.' },
      { icon: Lightbulb, category: 'Trivia', text: 'In the Philippines, food waste per capita is estimated at 20kg per year.' },
      { icon: Landmark, category: 'BPI', text: 'Use your BPI card at partner eco-merchants to get up to 8% cashback.', cta: { label: 'See Partners', href: '/bpi/marketplace' }},
    ];
    
    return [...baseFacts, ...personalizedFacts];
  }, [logs, savingsEvents]);


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
