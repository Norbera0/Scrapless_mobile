
'use client';

import { useState, useEffect } from 'react';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { WasteLogger } from '@/components/dashboard/WasteLogger';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Mic, ArrowLeft, Type, Trash2, TrendingUp, Flame } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function LogWastePage() {
  const resetStore = useWasteLogStore((state) => state.reset);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<'camera' | 'voice' | 'text' | null>(null);

  useEffect(() => {
    resetStore();
    const method = searchParams.get('method');
    if (method === 'camera' || method === 'voice' || method === 'text') {
        setSelectedMethod(method);
    }
  }, [resetStore, searchParams]);

  if (selectedMethod) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6 max-w-2xl mx-auto">
         <Button variant="ghost" onClick={() => router.push('/analytics')} className="self-start text-muted-foreground hover:text-foreground -ml-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Analytics
        </Button>
        <WasteLogger method={selectedMethod} />
      </div>
    );
  }

  return null; // Return null or a loader if no method is selected
}
