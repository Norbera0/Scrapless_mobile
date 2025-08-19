
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';

export default function GCashRedirectMockupPage() {
    const router = useRouter();

    const showSuccessFlow = () => {
        alert('✅ Transfer successful!\\n\\n₱120 has been moved to your #MySaveUp account.');
        // In a real app, you'd navigate somewhere after success
    };

    const closeModal = () => {
        // In a real app, this would likely go back or close a modal/webview
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
                        <div className="text-4xl font-bold text-gray-800">₱120.00</div>
                        <div className="text-sm text-gray-500">Amount to be transferred</div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-sm space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-500">From</span>
                            <span className="font-semibold text-gray-700">GCash Wallet (₱1,560)</span>
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
                            <div>• 2kg rice waste prevented</div>
                            <div>• 1.5kg CO₂ emissions avoided</div>
                            <div>• Equivalent to ₱120 saved</div>
                        </div>
                    </div>

                </CardContent>
                 <CardFooter className="flex flex-col gap-3">
                    <Button className="w-full h-12 text-base bg-blue-500 hover:bg-blue-600" onClick={showSuccessFlow}>
                        Confirm
                    </button>
                    <Button variant="ghost" className="w-full text-gray-600 h-12 text-base" onClick={closeModal}>
                        Cancel
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
