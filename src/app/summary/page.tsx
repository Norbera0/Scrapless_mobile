
import { WasteSummary } from '@/components/dashboard/WasteSummary';

export default function WasteSummaryPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Waste Summary</h1>
        <p className="text-muted-foreground text-sm">
          Here is the impact of the waste you logged.
        </p>
      </div>
      <WasteSummary />
    </div>
  );
}
