
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PolicyDialogProps {
  linkText: string;
  title: string;
  content: string;
}

export function ProfilePolicyDialog({ linkText, title, content }: PolicyDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <span className="font-medium hover:underline cursor-pointer">{linkText}</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] w-full rounded-md border p-4 prose">
          <ReactMarkdown>{content}</ReactMarkdown>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
