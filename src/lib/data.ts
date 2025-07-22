import type { WasteLog } from '@/types';

// Simplified mapping. In a real app, this would be in a database.
const FOOD_DATA: Record<string, { peso: number; co2e: number }> = {
  'rice': { peso: 5, co2e: 0.1 }, // per cup
  'bread': { peso: 10, co2e: 0.05 }, // per slice
  'chicken': { peso: 40, co2e: 0.5 }, // per 100g
  'beef': { peso: 80, co2e: 2.5 }, // per 100g
  'pork': { peso: 60, co2e: 1.0 }, // per 100g
  'fish': { peso: 50, co2e: 0.3 }, // per 100g
  'lettuce': { peso: 15, co2e: 0.02 }, // per head
  'tomato': { peso: 8, co2e: 0.03 }, // per piece
  'apple': { peso: 20, co2e: 0.04 }, // per piece
  'banana': { peso: 10, co2e: 0.08 }, // per piece
  'orange': { peso: 15, co2e: 0.05 }, // per piece
  'pasta': { peso: 25, co2e: 0.15 }, // per cup cooked
  'potato': { peso: 12, co2e: 0.02 }, // per piece
  'cheese': { peso: 50, co2e: 0.8 }, // per 50g slice
  'egg': { peso: 9, co2e: 0.2 }, // per piece
};

export function getImpact(itemName: string): { peso: number; co2e: number } {
  const lowerCaseItem = itemName.toLowerCase();
  for (const key in FOOD_DATA) {
    if (lowerCaseItem.includes(key)) {
      return FOOD_DATA[key];
    }
  }
  return { peso: 5, co2e: 0.1 }; // Default for unrecognized items
}

const getLogsFromStorage = (): WasteLog[] => {
  if (typeof window === 'undefined') return [];
  try {
    const logsJson = localStorage.getItem('scrapless-logs');
    return logsJson ? JSON.parse(logsJson) : [];
  } catch (e) {
    console.error('Failed to parse logs from localStorage', e);
    return [];
  }
};

const saveLogsToStorage = (logs: WasteLog[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('scrapless-logs', JSON.stringify(logs));
};

export const saveWasteLog = (newLog: WasteLog) => {
  const allLogs = getLogsFromStorage();
  saveLogsToStorage([...allLogs, newLog]);
};

export const getWasteLogsForUser = (userEmail: string): WasteLog[] => {
  const allLogs = getLogsFromStorage();
  return allLogs.filter(log => log.userEmail === userEmail).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const deleteWasteLog = (logId: string) => {
    const allLogs = getLogsFromStorage();
    const updatedLogs = allLogs.filter(log => log.id !== logId);
    saveLogsToStorage(updatedLogs);
}
