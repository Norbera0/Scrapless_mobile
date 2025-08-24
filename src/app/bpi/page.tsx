
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, PiggyBank, Sparkles, ShieldCheck, Landmark } from 'lucide-react';
import Image from 'next/image';

export default function BpiPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            <div className="flex items-center gap-3">
                <Image src="/bpi-logo-2.png" alt="BPI Logo" width={40} height={40} />
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">BPI Partnership</h1>
                    <p className="text-muted-foreground text-sm">
                        Connect your Scrapless savings with your BPI account.
                    </p>
                </div>
            </div>

            <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push('/my-savings')}
            >
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <PiggyBank className="w-5 h-5 text-primary" />
                            Virtual Savings
                        </CardTitle>
                        <CardDescription>View your savings and transfer to your #MySaveUp account.</CardDescription>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardHeader>
            </Card>

            <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push('/rewards')}
            >
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                             <Sparkles className="w-5 h-5 text-primary" />
                            Green Points & Rewards
                        </CardTitle>
                        <CardDescription>Convert your Green Points to BPI Rewards via VYBE.</CardDescription>
                    </div>
                     <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardHeader>
            </Card>

             <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push('/bpi/green-score')}
            >
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                             <ShieldCheck className="w-5 h-5 text-primary" />
                            Green Score
                        </CardTitle>
                        <CardDescription>Check your sustainability score for potential eco-friendly financial products.</CardDescription>
                    </div>
                     <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardHeader>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Landmark className="text-primary" />
                        About BPI Partnership
                    </CardTitle>
                    <CardDescription>
                        Scrapless is proud to partner with BPI, a leader in sustainable finance, to connect your eco-friendly habits with tangible financial rewards.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Your responsible consumption, tracked through Scrapless, can now contribute to a better financial future. By using our app, you're not just saving money on groceries—you're building a "Green Score" that demonstrates your commitment to sustainability, potentially unlocking future eco-friendly financial products from BPI.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
