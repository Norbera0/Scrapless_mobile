
import { ReviewItems } from '@/components/dashboard/ReviewItems';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bot } from 'lucide-react';

export default function ReviewItemsPage() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Review & Adjust</h1>
        <p className="text-muted-foreground text-sm">
          Edit, add, or remove items detected by the AI before saving.
        </p>
      </div>
       <Alert>
        <Bot className="h-4 w-4" />
        <AlertTitle>AI-Powered Detection</AlertTitle>
        <AlertDescription>
          Our AI does its best to identify items from your photo, voice, or text. Please double-check the names and amounts to ensure everything is accurate before saving your log.
        </AlertDescription>
      </Alert>
      <ReviewItems />
    </div>
  );
}
