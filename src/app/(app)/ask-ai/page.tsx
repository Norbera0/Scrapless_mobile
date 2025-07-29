
import { ChatAssistant } from '@/components/assistant/ChatAssistant';

export default function AskAiPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 p-4 md:p-6 border-b">
        <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Ask Assistant</h1>
            <p className="text-muted-foreground">
                Your personal AI guide to reducing food waste.
            </p>
        </div>
      </div>
      <ChatAssistant />
    </div>
  );
}
