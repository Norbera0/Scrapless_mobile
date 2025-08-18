
import { ReviewItems } from '@/components/dashboard/ReviewItems';

export default function ReviewItemsPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Review & Adjust</h1>
        <p className="text-muted-foreground text-sm">
          Edit, add, or remove items detected by the AI before saving.
        </p>
      </div>
      <ReviewItems />
    </div>
  );
}
