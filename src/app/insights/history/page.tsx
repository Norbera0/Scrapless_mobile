
'use client';

import { useInsightStore } from '@/stores/insight-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lightbulb, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

const statusConfig = {
    new: { icon: Lightbulb, color: 'default', label: 'New' },
    acknowledged: { icon: CheckCircle, color: 'secondary', label: 'Seen' },
    acted_on: { icon: CheckCircle, color: 'default', label: 'Acted On' },
    ignored: { icon: AlertTriangle, color: 'destructive', label: 'Ignored' },
};


export default function InsightHistoryPage() {
    const router = useRouter();
    const { insights, insightsInitialized } = useInsightStore();

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6">
            <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" onClick={() => router.push('/insights')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Insight History</h1>
                    <p className="text-muted-foreground">
                        Review your past AI-powered insights and track your progress.
                    </p>
                </div>
            </div>
            
            <Card>
                <CardContent className="pt-6">
                {!insightsInitialized ? (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : insights.length > 0 ? (
                    <div className="space-y-4">
                        {insights.map((insight) => {
                            const SvgIcon = statusConfig[insight.status].icon;
                            return (
                                <Card 
                                    key={insight.id} 
                                    className="hover:bg-muted/50 cursor-pointer transition-colors"
                                    onClick={() => router.push(`/insights/${insight.id}`)}
                                >
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg">{insight.patternAlert}</CardTitle>
                                                <CardDescription>{format(new Date(insight.date), 'MMMM d, yyyy')}</CardDescription>
                                            </div>
                                            <Badge variant={statusConfig[insight.status].color as any}>
                                                <SvgIcon className="h-3 w-3 mr-1.5" />
                                                {statusConfig[insight.status].label}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">{insight.smartTip}</p>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-10">
                        <p>You don't have any insights yet.</p>
                        <p className="text-sm">Keep logging your pantry and waste to generate your first one!</p>
                    </div>
                )}
                </CardContent>
            </Card>
        </div>
    )
}

    