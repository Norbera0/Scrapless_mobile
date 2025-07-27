
import { create } from 'zustand';
import type { WasteLog } from '@/types';

export interface WasteLogItem {
  id: string;
  name: string;
  estimatedAmount: string;
}

interface WasteLogState {
  photoDataUri: string | null;
  photoPreview: string | null;
  items: WasteLogItem[];
  logs: WasteLog[];
  setPhotoDataUri: (uri: string | null) => void;
  setPhotoPreview: (uri: string | null) => void;
  setItems: (items: WasteLogItem[]) => void;
  setLogs: (logs: WasteLog[]) => void;
  reset: () => void;
}

const initialState = {
    photoDataUri: null,
    photoPreview: null,
    items: [],
    logs: [],
};

export const useWasteLogStore = create<WasteLogState>()((set) => ({
  ...initialState,
  setPhotoDataUri: (uri) => set({ photoDataUri: uri }),
  setPhotoPreview: (uri) => set({ photoPreview: uri }),
  setItems: (items) => set({ items: items }),
  setLogs: (logs) => set({ logs }),
  reset: () => set(initialState),
}));
