
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, Mic, Sparkles, AlertTriangle, Lightbulb, Check, History, MessageSquareMore } from 'lucide-react';
import type { User, Insight } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { useInsightStore } from '@/stores/insight-store';
import { isToday } from 'date-fns';

function PredictionAlertCard({ insight, onDismiss }: { insight: Insight; onDismiss: () => void }) {
    if (!insight.predictionAlertBody) return null;

    return (
        <Card className="border-primary/50 bg-primary/5 text-primary-foreground">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                    <Sparkles className="h-6 w-6" />
                    Prediction Alert
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-foreground">{insight.predictionAlertBody}</p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={onDismiss}>Not now</Button>
                <Button size="sm" onClick={() => { /* Placeholder for future action */ }}>Help me prevent this</Button>
            </CardFooter>
        </Card>
    );
}

function AiInsightCard() {
    const router = useRouter();
    const { insights, insightsInitialized } = useInsightStore();
    const [latestInsight, setLatestInsight] = useState<Insight | null>(null);
    const [showPrediction, setShowPrediction] = useState(true);

    useEffect(() => {
        if (insightsInitialized && insights.length > 0) {
            setLatestInsight(insights[0]); // Insights are sorted by date descending
            setShowPrediction(true); // Show prediction when a new insight arrives
        } else {
            setLatestInsight(null);
        }
    }, [insights, insightsInitialized]);

    const handleAcknowledge = () => {
        if (!latestInsight) return;
        // In a real app, you'd call a function to update the insight's status in Firestore
        // e.g., updateInsightStatus(latestInsight.id, 'acknowledged');
        console.log("Acknowledged insight:", latestInsight.id);
    };

    return (
        <div className="space-y-4">
            {latestInsight?.predictionAlertBody && showPrediction && (
                 <PredictionAlertCard insight={latestInsight} onDismiss={() => setShowPrediction(false)} />
            )}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-primary" />
                        This Week's Insights
                    </CardTitle>
                    <CardDescription>AI-powered tips to help you reduce waste.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!insightsInitialized ? (
                        <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : latestInsight ? (
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 flex-shrink-0">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">{latestInsight.keyObservation}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-1 flex-shrink-0">
                                    <AlertTriangle className="h-5 w-5 text-destructive" />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">Pattern Alert</p>
                                    <p className="text-sm text-muted-foreground">{latestInsight.patternAlert}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="mt-1 flex-shrink-0">
                                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">Smart Tip</p>
                                    <p className="text-sm text-muted-foreground">{latestInsight.smartTip}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground p-4">
                            Start logging your waste and pantry items to unlock personalized insights!
                        </p>
                    )}
                </CardContent>
                 {insightsInitialized && latestInsight && (
                    <CardFooter className="flex justify-end gap-2">
                        <Button variant="outline" onClick={handleAcknowledge}>
                            <Check className="mr-2 h-4 w-4" />
                            Got it
                        </Button>
                        <Button onClick={() => router.push(`/insights/${latestInsight.id}`)}>
                             <MessageSquareMore className="mr-2 h-4 w-4" />
                            Tell me more
                        </Button>
                         <Button variant="secondary" onClick={() => router.push('/insights/history')}>
                            <History className="mr-2 h-4 w-4" />
                            History
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}


export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { logs, logsInitialized } = useWasteLogStore();
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    // Determine loading state based on auth and store initialization
    if (!isAuthLoading && logsInitialized) {
        setIsDataLoading(false);
    }
  }, [isAuthLoading, logsInitialized]);

  const todayStats = logs
    .filter(log => isToday(new Date(log.date)))
    .reduce((acc, log) => {
        acc.totalPesoValue += log.totalPesoValue;
        acc.totalCarbonFootprint += log.totalCarbonFootprint;
        return acc;
    }, { totalPesoValue: 0, totalCarbonFootprint: 0 });

  const userName = user?.displayName?.split(' ')[0] || 'there';

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {userName}!</h1>
        <p className="text-muted-foreground">
          Ready to make a difference? Let&apos;s track your food waste.
        </p>
      </div>

      <AiInsightCard />

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Impact</CardTitle>
          <CardDescription>Your contribution to a less wasteful world today.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-center">
            {isDataLoading ? (
                <div className="col-span-2 flex justify-center items-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    <div className="bg-secondary p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Peso Value Saved</p>
                        <p className="text-3xl font-bold">₱{todayStats.totalPesoValue.toFixed(2)}</p>
                    </div>
                    <div className="bg-secondary p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">CO₂e Reduced</p>
                        <p className="text-3xl font-bold">{todayStats.totalCarbonFootprint.toFixed(2)}<span className="text-base">kg</span></p>
                    </div>
                </>
            )}
        </CardContent>
      </Card>
        
      <div className="grid md:grid-cols-2 gap-4">
          <Button size="lg" className="h-24 text-lg" onClick={() => router.push('/log-waste?method=camera')}>
            <Camera className="mr-4 h-8 w-8" /> Log with Camera
          </Button>
          <Button size="lg" variant="outline" className="h-24 text-lg" onClick={() => router.push('/log-waste?method=voice')}>
            <Mic className="mr-4 h-8 w-8" /> Log with Voice
          </Button>
      </div>

    </div>
  );
}
