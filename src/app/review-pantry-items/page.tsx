
import { ReviewPantryItems } from '@/components/pantry/ReviewPantryItems';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bot } from 'lucide-react';

export default function ReviewPantryItemsPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Review & Confirm Pantry Items</h1>
        <p className="text-muted-foreground text-sm">
          Adjust the items detected by the AI before adding them to your pantry.
        </p>
      </div>
      <Alert>
        <Bot className="h-4 w-4" />
        <AlertTitle>AI-Powered Detection</AlertTitle>
        <AlertDescription>
          Our AI does its best, but it can sometimes make mistakes. Please double-check the item names, quantities, and especially the estimated costs to ensure everything is accurate.
        </AlertDescription>
      </Alert>
      <ReviewPantryItems />
    </div>
  );
}
