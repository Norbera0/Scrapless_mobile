
'use client';

import { useState, useEffect } from 'react';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { WasteLogger } from '@/components/dashboard/WasteLogger';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Mic, ArrowLeft, Type, Trash2, TrendingUp, Flame } from 'lucide-react';

export default function LogWastePage() {
  const resetStore = useWasteLogStore((state) => state.reset);
  const [selectedMethod, setSelectedMethod] = useState<'camera' | 'voice' | 'text' | null>(null);

  useEffect(() => {
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Log Food Waste 🗑️</h1>
          <p className="text-lg text-teal-600">Track your waste to reduce it and save money</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-900">2</p>
                  <p className="text-sm font-medium text-red-700">Logged Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-900">₱45</p>
                  <p className="text-sm font-medium text-green-700">Weekly Impact</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Flame className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-900">7</p>
                  <p className="text-sm font-medium text-yellow-700">Logging Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
            <h2 className="text-2xl font-semibold text-center mb-6 text-gray-700">How would you like to log your waste?</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                <Card className="border border-gray-200 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardContent className="p-6 text-center flex-1 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                      <Camera className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Log with Camera</h3>
                    <p className="text-gray-500 mb-6 text-sm">Snap a picture of your food waste. The AI will identify the items for you.</p>
                    <Button className="w-full mt-auto bg-primary hover:bg-primary/90" onClick={() => setSelectedMethod('camera')}>Use Camera</Button>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col bg-gradient-to-br from-purple-50 to-purple-100">
                  <CardContent className="p-6 text-center flex-1 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                      <Mic className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Log with Voice</h3>
                    <p className="text-gray-500 mb-6 text-sm">Simply say what you've wasted, and the AI will transcribe it into a list.</p>
                     <Button className="w-full mt-auto bg-primary hover:bg-primary/90" onClick={() => setSelectedMethod('voice')}>Use Voice</Button>
                  </CardContent>
                </Card>

                 <Card className="border border-gray-200 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col bg-gradient-to-br from-orange-50 to-orange-100">
                  <CardContent className="p-6 text-center flex-1 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                      <Type className="w-8 h-8 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Manual Entry</h3>
                    <p className="text-gray-500 mb-6 text-sm">Type out the items you've wasted for a quick and simple log.</p>
                     <Button className="w-full mt-auto bg-primary hover:bg-primary/90" onClick={() => setSelectedMethod('text')}>Use Text</Button>
                  </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}
