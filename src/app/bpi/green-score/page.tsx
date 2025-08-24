
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useGreenScoreStore } from '@/stores/greenScoreStore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, ShieldCheck, TrendingUp, Wallet, Zap, Award, Star, Info, BadgeCheck, Leaf, Brain, Repeat, CalendarClock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Gauge } from '@/components/ui/gauge';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

const scoreTiers = {
    legend: { min: 850, label: 'Eco-Legend', color: 'text-green-500' },
    champion: { min: 700, label: 'Eco-Champion', color: 'text-blue-500' },
    novice: { min: 500, label: 'Eco-Novice', color: 'text-yellow-500' },
    starter: { min: 300, label: 'Eco-Starter', color: 'text-gray-500' },
};

const getScoreTier = (score: number) => {
    if (score >= scoreTiers.legend.min) return scoreTiers.legend;
    if (score >= scoreTiers.champion.min) return scoreTiers.champion;
    if (score >= scoreTiers.novice.min) return scoreTiers.novice;
    return scoreTiers.starter;
};

const breakdownTooltips = {
  behavioral: "Measures how efficiently you use food. Higher points for using items vs. wasting them, with penalties for wasting high-impact items like meat.",
  financial: "Reflects your ability to generate savings relative to your waste. Higher points for saving more than you waste.",
  engagement: "Rewards consistency. Higher points for regular logging and maintaining waste-free streaks."
};

const BadgeDisplay = ({ badge }: { badge: string }) => {
    const badgeConfig: { [key: string]: { icon: React.ElementType, color: string }} = {
        'Eco-Legend': { icon: Award, color: 'bg-green-100 text-green-700' },
        'Eco-Champion': { icon: Star, color: 'bg-blue-100 text-blue-700' },
        'Eco-Novice': { icon: Leaf, color: 'bg-yellow-100 text-yellow-700' },
        'Pantry Pro': { icon: Brain, color: 'bg-purple-100 text-purple-700' },
        'Streak Keeper': { icon: CalendarClock, color: 'bg-indigo-100 text-indigo-700' },
    };
    const config = badgeConfig[badge] || { icon: BadgeCheck, color: 'bg-gray-100 text-gray-700' };
    const Icon = config.icon;

    return (
        <div className={`flex items-center gap-2 p-2 rounded-lg ${config.color}`}>
            <Icon className="w-5 h-5" />
            <span className="font-semibold text-sm">{badge}</span>
        </div>
    );
};

export default function GreenScorePage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const { score, breakdown, badges, calculateScore } = useGreenScoreStore();
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!isAuthLoading) {
            calculateScore();
            setIsLoading(false);
        }
    }, [isAuthLoading, calculateScore]);

    const tier = getScoreTier(score);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="flex flex-col gap-6 p-4 md:p-6 bg-gray-50 min-h-screen">
             <Button variant="ghost" onClick={() => router.push('/bpi')} className="self-start text-muted-foreground hover:text-foreground -ml-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to BPI Hub
            </Button>
            <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
                    <ShieldCheck className="w-8 h-8 text-primary" />
                    Green Score
                </h1>
                <p className="text-muted-foreground text-sm">
                    Your sustainability score, powered by your daily habits.
                </p>
            </div>

            <Card className="text-center">
                <CardHeader>
                    <CardTitle className={`text-2xl font-bold ${tier.color}`}>{tier.label}</CardTitle>
                    <CardDescription>Your current Green Score reflects your positive environmental and financial habits.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                    <Gauge value={score} max={1000} size={200} strokeWidth={20} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Score Breakdown</CardTitle>
                    <CardDescription>Your score is a mix of three key areas. See how you're doing.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <TooltipProvider>
                        {(Object.keys(breakdownTooltips) as Array<keyof typeof breakdownTooltips>).map(key => (
                           <div key={key}>
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-1.5">
                                        <Label className="capitalize font-medium">{key}</Label>
                                         <Tooltip>
                                            <TooltipTrigger>
                                                <Info className="w-3.5 h-3.5 text-muted-foreground cursor-pointer" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="max-w-xs">{breakdownTooltips[key]}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <span className="text-sm font-semibold">{breakdown[key]} pts</span>
                                </div>
                                <Progress value={(breakdown[key] / 420) * 100} />
                           </div>
                        ))}
                    </TooltipProvider>
                </CardContent>
            </Card>
            
             <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Your Badges</CardTitle>
                    <CardDescription>Achievements unlocked through your consistent efforts.</CardDescription>
                </CardHeader>
                <CardContent>
                     {badges.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {badges.map(badge => (
                                <BadgeDisplay key={badge} badge={badge} />
                            ))}
                        </div>
                     ) : (
                        <p className="text-muted-foreground text-center py-4">Keep logging to earn your first badge!</p>
                     )}
                </CardContent>
            </Card>
        </div>
    );
}
