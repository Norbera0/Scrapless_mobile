
import { PantryDashboard } from '@/components/pantry/PantryDashboard';

export default function PantryPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Virtual Pantry</h1>
        <p className="text-muted-foreground">
          Keep track of your food items to reduce waste.
        </p>
      </div>
      <PantryDashboard />
    </div>
  );
}
