
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ChatAssistant } from './ChatAssistant';
import { X, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { cn } from '@/lib/utils';
import { useChatStore } from '@/stores/chat-store';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function FloatingChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const { clearMessages } = useChatStore();

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                size="icon"
                className="h-16 w-16 rounded-full shadow-lg p-2 overflow-hidden bg-[#e5ebe9] hover:bg-[#e5ebe9]/90 border-[2px] border-[#00382a]"
                onClick={() => setIsOpen(true)}
                aria-label="Open Chat"
              >
                <DotLottieReact
                    src="https://lottie.host/554cd717-e4e3-413b-8033-6cf6f70826fc/4y6zuy7Onc.lottie"
                    loop
                    autoplay
                />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-24 right-6 z-50 w-[calc(100vw-48px)] max-w-md"
          >
            <Card className="h-[70vh] shadow-2xl flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                        <DotLottieReact 
                           src="https://lottie.host/554cd717-e4e3-413b-8033-6cf6f70826fc/4y6zuy7Onc.lottie"
                           loop
                           autoplay
                           style={{ width: '24px', height: '24px' }} 
                        />
                    </div>
                    <div className='space-y-1'>
                        <CardTitle>AI Assistant</CardTitle>
                        <CardDescription>Your guide to reducing waste.</CardDescription>
                    </div>
                </div>
                <div className="flex items-center">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete your conversation history.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={clearMessages} className="bg-destructive hover:bg-destructive/90">
                                Delete
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                </div>
              </CardHeader>
              <ChatAssistant />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
