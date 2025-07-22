import { WasteLogger } from '@/components/dashboard/WasteLogger';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
        <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Log Food Waste</h1>
            <p className="text-muted-foreground">
                Take a photo of your food waste, and we&apos;ll help you log it.
            </p>
        </div>
        <WasteLogger />
    </div>
  );
}
