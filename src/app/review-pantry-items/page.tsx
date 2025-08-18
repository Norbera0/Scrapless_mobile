
import { ReviewPantryItems } from '@/components/pantry/ReviewPantryItems';

export default function ReviewPantryItemsPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Review & Confirm Pantry Items</h1>
        <p className="text-muted-foreground text-sm">
          Adjust the items detected by the AI before adding them to your pantry.
        </p>
      </div>
      <ReviewPantryItems />
    </div>
  );
}
