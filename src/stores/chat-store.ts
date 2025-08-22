
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Message {
  role: 'user' | 'model';
  text: string;
}

interface ChatState {
  messages: Message[];
  addMessage: (message: Message) => void;
  clearMessages: () => void;
}

const isBrowser = typeof window !== 'undefined';

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      addMessage: (message) => set((state) => ({
        messages: [...state.messages, message]
      })),
      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: 'scrapless-chat-storage',
      storage: createJSONStorage(() => (isBrowser ? localStorage : undefined)),
      skipHydration: !isBrowser,
    }
  )
);
