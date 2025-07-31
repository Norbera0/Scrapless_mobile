
'use client';

import { TrendsDashboard } from '@/components/dashboard/TrendsDashboard';

export default function TrendsPage() {
  return (
    <div className="bg-muted/30">
      <div className="bg-gradient-to-r from-red-600 to-red-500 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold">Waste Analytics</h1>
            <p className="opacity-90">Track patterns & reduce waste</p>
        </div>
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <TrendsDashboard />
      </div>
    </div>
  );
}
