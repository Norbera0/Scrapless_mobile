
'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { WasteLogger } from '@/components/dashboard/WasteLogger';

export default function LogWastePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const method = searchParams.get('method');
  const resetStore = useWasteLogStore((state) => state.reset);

  useEffect(() => {
    // Reset the store whenever the user lands on this page
    // to ensure a clean state for each new log.
    resetStore();
  }, [resetStore]);

  useEffect(() => {
    if (!method) {
      // If no method is specified, redirect to the dashboard.
      // This is wrapped in useEffect to prevent rendering errors.
      router.replace('/dashboard');
    }
  }, [method, router]);

  if (!method) {
    // Render nothing while we are redirecting
    return null;
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Log Food Waste</h1>
        <p className="text-muted-foreground">
          {method === 'camera'
            ? 'Capture your food waste using your camera.'
            : 'Record your food waste using your microphone.'}
        </p>
      </div>
      <WasteLogger method={method as 'camera' | 'voice'} />
    </div>
  );
}
