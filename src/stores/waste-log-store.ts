
import { create } from 'zustand';
import type { WasteLog } from '@/types';

export interface WasteLogItem {
  id: string;
  name: string;
  estimatedAmount: string;
  wasteReason?: string;
}

interface WasteLogState {
  photoDataUri: string | null;
  photoPreview: string | null;
  items: WasteLogItem[];
  logs: WasteLog[];
  sessionWasteReason: string | null;
  otherWasteReasonText: string;
  setPhotoDataUri: (uri: string | null) => void;
  setPhotoPreview: (uri: string | null) => void;
  setItems: (items: WasteLogItem[]) => void;
  setLogs: (logs: WasteLog[]) => void;
  setSessionWasteReason: (reason: string | null) => void;
  setOtherWasteReasonText: (text: string) => void;
  reset: () => void;
}

const initialState = {
    photoDataUri: null,
    photoPreview: null,
    items: [],
    logs: [],
    sessionWasteReason: null,
    otherWasteReasonText: '',
};

export const useWasteLogStore = create<WasteLogState>()((set) => ({
  ...initialState,
  setPhotoDataUri: (uri) => set({ photoDataUri: uri }),
  setPhotoPreview: (uri) => set({ photoPreview: uri }),
  setItems: (items) => set({ items: items }),
  setLogs: (logs) => set({ logs }),
  setSessionWasteReason: (reason) => set({ sessionWasteReason: reason }),
  setOtherWasteReasonText: (text) => set({ otherWasteReasonText: text }),
  reset: () => set(initialState),
}));
