import { TrendsDashboard } from '@/components/dashboard/TrendsDashboard';

export default function TrendsPage() {
  return (
    <div className="bg-muted/30">
      <div className="bg-gradient-to-b from-primary to-primary/90 text-primary-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold">Trends & Analytics</h1>
            <p className="opacity-90">Your waste patterns & insights</p>
        </div>
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <TrendsDashboard />
      </div>
    </div>
  );
}
