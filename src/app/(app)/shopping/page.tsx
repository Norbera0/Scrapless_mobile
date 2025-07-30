
'use client';

import { ShoppingHubDashboard } from '@/components/shopping/ShoppingHubDashboard';

export default function ShoppingHubPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Smart Shopping Hub</h1>
        <p className="text-muted-foreground">
          AI-powered recommendations to help you shop smarter and waste less.
        </p>
      </div>
      <ShoppingHubDashboard />
    </div>
  );
}
