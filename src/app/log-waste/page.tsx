
'use client';

import { useState, useEffect } from 'react';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { WasteLogger } from '@/components/dashboard/WasteLogger';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Mic, ArrowLeft, Type } from 'lucide-react';

export default function LogWastePage() {
  const resetStore = useWasteLogStore((state) => state.reset);
  const [selectedMethod, setSelectedMethod] = useState<'camera' | 'voice' | 'text' | null>(null);

  useEffect(() => {
    // Reset the store whenever the user lands on this page
    // to ensure a clean state for each new log.
    resetStore();
  }, [resetStore]);

  if (selectedMethod) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-2xl mx-auto">
         <Button variant="ghost" onClick={() => setSelectedMethod(null)} className="self-start text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to methods
        </Button>
        <WasteLogger method={selectedMethod} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
       <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">Log Food Waste</h1>
            <p className="text-muted-foreground mt-2">
                Choose how you'd like to log your waste.
            </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto w-full">
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Camera /> Log with Camera</CardTitle>
                    <CardDescription>Snap a picture of your food waste. The AI will identify the items for you.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button className="w-full" onClick={() => setSelectedMethod('camera')}>Use Camera</Button>
                </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Mic /> Log with Voice</CardTitle>
                    <CardDescription>Simply say what you've wasted, and the AI will transcribe it into a list.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Button className="w-full" onClick={() => setSelectedMethod('voice')}>Use Voice</Button>
                </CardContent>
            </Card>
             <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Type /> Manual Entry</CardTitle>
                    <CardDescription>Type out the items you've wasted for a quick and simple log.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Button className="w-full" onClick={() => setSelectedMethod('text')}>Use Text</Button>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
