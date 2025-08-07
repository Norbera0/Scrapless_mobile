
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
  textInput: string;
  items: WasteLogItem[];
  logs: WasteLog[];
  logsInitialized: boolean;
  sessionWasteReason: string | null;
  otherWasteReasonText: string;
  setPhotoDataUri: (uri: string | null) => void;
  setPhotoPreview: (uri: string | null) => void;
  setTextInput: (text: string) => void;
  setItems: (items: WasteLogItem[]) => void;
  setLogs: (logs: WasteLog[]) => void;
  setLogsInitialized: (initialized: boolean) => void;
  setSessionWasteReason: (reason: string | null) => void;
  setOtherWasteReasonText: (text: string) => void;
  reset: () => void;
}

const initialState = {
    photoDataUri: null,
    photoPreview: null,
    textInput: '',
    items: [],
    logs: [],
    logsInitialized: false,
    sessionWasteReason: null,
    otherWasteReasonText: '',
};

export const useWasteLogStore = create<WasteLogState>()((set) => ({
  ...initialState,
  setPhotoDataUri: (uri) => set({ photoDataUri: uri }),
  setPhotoPreview: (uri) => set({ photoPreview: uri }),
  setTextInput: (text) => set({ textInput: text }),
  setItems: (items) => set({ items: items }),
  setLogs: (logs) => set({ logs }),
  setLogsInitialized: (initialized) => set({ logsInitialized: initialized }),
  setSessionWasteReason: (reason) => set({ sessionWasteReason: reason }),
  setOtherWasteReasonText: (text) => set({ otherWasteReasonText: text }),
  reset: () => set({
    ...initialState,
    logs: [], // Keep logs from previous sessions
    logsInitialized: true,
  }),
}));
