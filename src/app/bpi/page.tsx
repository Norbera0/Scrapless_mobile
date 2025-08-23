
'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, PiggyBank, Sparkles } from 'lucide-react';
import Image from 'next/image';

export default function BpiPage() {
    const router = useRouter();

    return (
        <div className="flex flex-col gap-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            <div className="flex items-center gap-3">
                <Image src="/bpi-logo.png" alt="BPI Logo" width={40} height={40} />
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">BPI Integration</h1>
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
        </div>
    );
}
