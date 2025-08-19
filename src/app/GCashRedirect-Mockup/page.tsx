
'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { estimateRiceKgFromPesos } from '@/lib/utils';

function GCashRedirectContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const amount = Number(searchParams.get('amount') || '120');

    // Default GCash balance for mockup
    const gcashWalletBalance = 30000;

    const co2Saved = estimateRiceKgFromPesos(amount) * 1.5; // Rough estimation

    const handleConfirm = () => {
        router.push(`/GCashConfirm-Mockup?amount=${amount}`);
    };

    const handleCancel = () => {
        router.back();
    };

    return (
        <div className="bg-blue-600 p-4 sm:p-8 flex justify-center items-center min-h-screen">
            <Card className="w-full max-w-sm">
                 <CardHeader className="bg-blue-500 text-center text-white">
                    <h2 className="font-semibold text-lg">GCash Transfer</h2>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="text-center mb-6">
                        <div className="text-4xl font-bold text-gray-800">₱{amount.toFixed(2)}</div>
                        <div className="text-sm text-gray-500">Amount to be transferred</div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-sm space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-500">From</span>
                            <span className="font-semibold text-gray-700">GCash Wallet (₱{gcashWalletBalance.toLocaleString()})</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">To</span>
                            <span className="font-semibold text-gray-700">Scrapless #MySaveUp</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Fee</span>
                            <span className="font-semibold text-green-600">FREE</span>
                        </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <div className="font-semibold text-green-800 text-sm mb-2">🌱 This Week's Impact</div>
                        <div className="text-sm text-green-700 space-y-1">
                            <div>• {estimateRiceKgFromPesos(amount).toFixed(1)}kg rice waste prevented</div>
                            <div>• {co2Saved.toFixed(1)}kg CO₂ emissions avoided</div>
                            <div>• Equivalent to ₱{amount.toFixed(2)} saved</div>
                        </div>
                    </div>

                </CardContent>
                 <CardFooter className="flex flex-col gap-3">
                    <Button className="w-full h-12 text-base bg-blue-500 hover:bg-blue-600" onClick={handleConfirm}>
                        Confirm
                    </Button>
                    <Button variant="ghost" className="w-full text-gray-600 h-12 text-base" onClick={handleCancel}>
                        Cancel
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}


export default function GCashRedirectMockupPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <GCashRedirectContent />
        </Suspense>
    );
}
