
'use client';

import { TrendsDashboard } from '@/components/dashboard/TrendsDashboard';

export default function TrendsPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Waste Analytics</h1>
        <p className="text-muted-foreground">
          Track patterns, view insights, and reduce your waste.
        </p>
      </div>
      <TrendsDashboard />
    </div>
  );
}
