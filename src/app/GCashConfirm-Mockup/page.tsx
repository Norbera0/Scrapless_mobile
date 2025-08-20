
'use client';

import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSavingsStore } from '@/stores/savings-store';
import { useSavingsSummary } from '@/lib/bpi';

function GCashConfirmContent() {
    const searchParams = useSearchParams();
    const { savingsEvents } = useSavingsStore();
    const { total } = useSavingsSummary(savingsEvents);
    
    const amount = Number(searchParams.get('amount') || '120');
    // #MySaveUp balance is the total amount of savings events (which are all "transferred" at this point in the mock)
    const newBalance = total; 
    
    const recentTransfers = savingsEvents.filter(e => e.transferredToBank).slice(0, 3);

    return (
        <div className="bg-background p-4 sm:p-6 flex justify-center items-start min-h-screen">
            <div className="w-full max-w-sm space-y-6">
                <div className="text-center space-y-4">
                    <div className="text-5xl">✅</div>
                    <h1 className="text-xl font-bold text-green-600">Transfer Successful!</h1>
                    <p className="text-muted-foreground">₱{amount.toFixed(2)} moved to your #MySaveUp account</p>
                </div>

                <div>
                    <h2 className="font-bold text-lg mb-2">Recent Transfers</h2>
                    <Card>
                        <CardContent className="p-0">
                            {recentTransfers.map((item, index) => (
                                <div key={item.id} className="flex justify-between items-center p-4">
                                    <div>
                                        <p className="font-semibold">{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                                        <p className="text-sm text-muted-foreground">{item.description}</p>
                                    </div>
                                    <p className="font-bold text-green-600">+ ₱{item.amount.toFixed(2)}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
                
                <Card className="text-center">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Total Saved in #MySaveUp</p>
                        <p className="text-2xl font-bold text-green-600">₱{newBalance.toLocaleString()}</p>
                    </CardContent>
                </Card>

                <Button asChild className="w-full">
                    <Link href="/my-savings">
                        Confirm
                    </Link>
                </Button>
            </div>
        </div>
    );
}


export default function GCashConfirmMockupPage() {
    return (
        <Suspense fallback={<div>Loading confirmation...</div>}>
            <GCashConfirmContent />
        </Suspense>
    )
}
