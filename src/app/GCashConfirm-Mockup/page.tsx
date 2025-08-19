'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

const savingsHistory = [
    { date: 'Aug 19', description: '₱120 saved (rice waste reduced)', amount: '+ ₱120' },
    { date: 'Aug 10', description: '₱200 saved (bread + veggies)', amount: '+ ₱200' },
    { date: 'Jul 28', description: '₱150 saved (leftovers repurposed)', amount: '+ ₱150' },
];

export default function GCashConfirmMockupPage() {
    return (
        <div className="bg-background p-4 sm:p-6 flex justify-center items-start min-h-screen">
            <div className="w-full max-w-sm space-y-6">
                <div className="text-center space-y-4">
                    <div className="text-5xl">✅</div>
                    <h1 className="text-xl font-bold text-green-600">Transfer Successful!</h1>
                    <p className="text-muted-foreground">₱120 moved to your #MySaveUp account</p>
                </div>

                <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-baseline">
                            <span className="text-sm text-green-700">New Balance:</span>
                            <span className="font-bold text-green-800">₱1,320 / ₱3,000</span>
                        </div>
                        <Progress value={44} className="h-2 [&>div]:bg-green-600" />
                        <p className="text-sm text-green-700">44% toward your Air Fryer goal!</p>
                    </CardContent>
                </Card>

                <div>
                    <h2 className="font-bold text-lg mb-2">Recent Savings</h2>
                    <Card>
                        <CardContent className="p-0">
                            {savingsHistory.map((item, index) => (
                                <div key={index} className="flex justify-between items-center p-4">
                                    <div>
                                        <p className="font-semibold">{item.date}</p>
                                        <p className="text-sm text-muted-foreground">{item.description}</p>
                                    </div>
                                    <p className="font-bold text-green-600">{item.amount}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
                
                <Card className="text-center">
                    <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground">Total Saved</p>
                        <p className="text-2xl font-bold text-green-600">₱2,530</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
