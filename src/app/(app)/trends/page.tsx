import { TrendsDashboard } from '@/components/dashboard/TrendsDashboard';

export default function TrendsPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Waste Trends</h1>
        <p className="text-muted-foreground">
          Review your food waste history and trends over time.
        </p>
      </div>
      <TrendsDashboard />
    </div>
  );
}
