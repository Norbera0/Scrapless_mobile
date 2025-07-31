
'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { usePantryLogStore } from '@/stores/pantry-store';
import { useWasteLogStore } from '@/stores/waste-log-store';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Loader2, Send, Mic, Square } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { chatWithAssistant } from '@/ai/flows/chat-with-assistant';
import { type ChatWithAssistantInput } from '@/ai/schemas';
import type { WasteLog } from '@/types';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';


interface Message {
  role: 'user' | 'model';
  text: string;
}

const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    return name.charAt(0).toUpperCase();
}

function calculateWasteAnalysis(wasteLogs: WasteLog[]) {
    const analysis = wasteLogs.reduce((acc, log) => {
        acc.totalPesoValueWasted += log.totalPesoValue;
        acc.totalCarbonFootprintWasted += log.totalCarbonFootprint;
        
        log.items.forEach(item => {
            acc.itemCounts[item.name] = (acc.itemCounts[item.name] || 0) + 1;
            if(log.sessionWasteReason) {
                acc.reasonCounts[log.sessionWasteReason] = (acc.reasonCounts[log.sessionWasteReason] || 0) + 1;
            }
        });
        
        return acc;
    }, {
        totalPesoValueWasted: 0,
        totalCarbonFootprintWasted: 0,
        itemCounts: {} as Record<string, number>,
        reasonCounts: {} as Record<string, number>,
    });

    const topWastedItem = Object.entries(analysis.itemCounts).sort((a,b) => b[1] - a[1])[0] || ['None', 0];
    const mostCommonWasteReason = Object.entries(analysis.reasonCounts).sort((a,b) => b[1] - a[1])[0] || ['None', 0];

    return {
        totalPesoValueWasted: parseFloat(analysis.totalPesoValueWasted.toFixed(2)),
        totalCarbonFootprintWasted: parseFloat(analysis.totalCarbonFootprintWasted.toFixed(2)),
        topWastedItem: { name: topWastedItem[0], count: topWastedItem[1] },
        mostCommonWasteReason: mostCommonWasteReason[0],
    };
}

export function ChatAssistant() {
  const { user } = useAuth();
  const { liveItems: pantryItems } = usePantryLogStore();
  const { logs: wasteLogs } = useWasteLogStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div');
        if(viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);
  
  useEffect(() => {
    if (user && messages.length === 0) {
      setMessages([
        { role: 'model', text: `Hi ${user.name?.split(' ')[0] || ''}! How can I help you be less wasteful today? You can ask me for recipe ideas, why you're wasting food, or how to manage your pantry.` }
      ]);
    }
  }, [user, messages.length]);

  const processAndRespond = async (inputData: { query?: string; audioDataUri?: string; }) => {
    if (!user) return;
    
    // If it's a text message, add it to the chat immediately.
    // For audio, we'll add the transcribed message later.
    if (inputData.query) {
      const userMessage: Message = { role: 'user', text: inputData.query };
      setMessages(prev => [...prev, userMessage]);
    }
    
    setInput('');
    setIsLoading(true);
  
    try {
      const pantryData = pantryItems.map(item => ({
          name: item.name,
          estimatedExpirationDate: format(parseISO(item.estimatedExpirationDate), 'MMM d, yyyy'),
          estimatedAmount: item.estimatedAmount,
      }));
  
      const wasteAnalysis = calculateWasteAnalysis(wasteLogs);
      
      const assistantInput: ChatWithAssistantInput = {
          ...inputData,
          userName: user.name?.split(' ')[0] || 'User',
          history: messages,
          pantryItems: pantryData,
          wasteLogs,
          ...wasteAnalysis,
      };
      
      const result = await chatWithAssistant(assistantInput);
      
      // If the input was audio, display the transcribed text as the user's message.
      if (result.transcribedQuery) {
        const userMessage: Message = { role: 'user', text: result.transcribedQuery };
        setMessages(prev => [...prev, userMessage]);
      }

      const assistantMessage: Message = { role: 'model', text: result.response };
      setMessages(prev => [...prev, assistantMessage]);
  
    } catch (error) {
        console.error('Chat assistant error:', error);
        const errorMessage: Message = { role: 'model', text: 'Sorry, I ran into a problem. Please try again.' };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    await processAndRespond({ query: input });
  };
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = event => audioChunksRef.current.push(event.data);
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          await processAndRespond({ audioDataUri: base64Audio }); 
        };
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast({ title: 'Recording...', description: 'Tap the microphone again to stop.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Microphone Error', description: 'Could not access the microphone.' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-6">
          {messages.map((message, index) => (
            <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
              {message.role === 'model' && (
                <Avatar className="h-8 w-8 bg-primary text-primary-foreground flex items-center justify-center">
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              )}
              <Card className={cn("max-w-md", message.role === 'user' ? 'bg-primary text-primary-foreground' : '')}>
                <CardContent className="p-3 text-sm">
                  <p>{message.text}</p>
                </CardContent>
              </Card>
              {message.role === 'user' && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
             <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 bg-primary text-primary-foreground flex items-center justify-center">
                    <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <Card className="max-w-md">
                    <CardContent className="p-3 text-sm flex items-center">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        <span>Thinking...</span>
                    </CardContent>
                </Card>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for recipes, waste tips, etc."
            disabled={isLoading || isRecording}
            autoComplete='off'
          />
          <Button type="button" size="icon" onClick={handleMicClick} disabled={isLoading} variant={isRecording ? 'destructive' : 'outline'}>
            {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            <span className="sr-only">Record message</span>
          </Button>
          <Button type="submit" disabled={isLoading || isRecording || !input.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
