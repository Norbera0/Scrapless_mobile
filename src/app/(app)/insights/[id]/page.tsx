
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useInsightStore } from '@/stores/insight-store';
import { type Insight, type InsightSolution } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Lightbulb, AlertTriangle, Sparkles, Target, Wallet, Users, Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { updateInsightStatus } from '@/lib/data';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

function SolutionCard({ solution, onSelect }: { solution: InsightSolution, onSelect: () => void }) {
    return (
        <Card className="bg-secondary/50">
            <CardContent className="p-4 space-y-3">
                <p className="font-semibold">{solution.solution}</p>
                <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>Success Rate</span>
                        <span>{Math.round(solution.successRate * 100)}%</span>
                    </div>
                    <Progress value={solution.successRate * 100} className="h-2" />
                </div>
                 <Button size="sm" className="w-full" onClick={onSelect}>
                    <Check className="mr-2 h-4 w-4" /> I'll try this
                 </Button>
            </CardContent>
        </Card>
    )
}

export default function InsightDetailPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const { insights, insightsInitialized } = useInsightStore();
    const [insight, setInsight] = useState<Insight | null>(null);

    useEffect(() => {
        if (insightsInitialized) {
            const foundInsight = insights.find(i => i.id === params.id);
            setInsight(foundInsight || null);
        }
    }, [params.id, insights, insightsInitialized]);

    const handleMarkAsActedOn = async () => {
        if (!user || !insight) return;
        try {
            await updateInsightStatus(user.uid, insight.id, 'acted_on');
            toast({ title: 'Great!', description: 'We\'ve marked this insight as something you\'re working on.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update insight status.' });
        }
    }

    if (!insightsInitialized) {
        return (
            <div className="flex h-full w-full items-center justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (!insight) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <h2 className="text-2xl font-bold">Insight Not Found</h2>
                <p className="text-muted-foreground">This insight may have been deleted or never existed.</p>
                <Button onClick={() => router.push('/insights/history')} className="mt-4">Go to History</Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">{insight.patternAlert}</h1>
                    <p className="text-muted-foreground">A deep dive into this pattern from {new Date(insight.date).toLocaleDateString()}</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Target className="text-primary" /> What's Really Happening</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{insight.whatsReallyHappening}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Wallet className="text-primary" /> Financial Impact</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{insight.financialImpact}</p>
                    </CardContent>
                </Card>
                 <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary" /> Why This Pattern Exists</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{insight.whyThisPatternExists}</p>
                    </CardContent>
                </Card>
            </div>
            
             <div>
                <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2"><Lightbulb className="text-primary" />Solutions</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {insight.solutions.map((solution, index) => (
                        <SolutionCard key={index} solution={solution} onSelect={handleMarkAsActedOn} />
                    ))}
                </div>
            </div>

            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Users className="text-primary" /> Similar User Story</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground italic">"{insight.similarUserStory}"</p>
                </CardContent>
            </Card>

        </div>
    )
}
