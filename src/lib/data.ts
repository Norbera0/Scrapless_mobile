
'use client';
import type { WasteLog, PantryItem, PantryLog, FoodItem } from '@/types';

// Simplified mapping. In a real app, this would be in a database.
const FOOD_DATA: Record<string, { peso: number; co2e: number, shelfLifeDays: number }> = {
  'rice': { peso: 5, co2e: 0.1, shelfLifeDays: 365 }, // per cup
  'bread': { peso: 10, co2e: 0.05, shelfLifeDays: 7 }, // per slice
  'chicken': { peso: 40, co2e: 0.5, shelfLifeDays: 3 }, // per 100g
  'beef': { peso: 80, co2e: 2.5, shelfLifeDays: 4 }, // per 100g
  'pork': { peso: 60, co2e: 1.0, shelfLifeDays: 4 }, // per 100g
  'fish': { peso: 50, co2e: 0.3, shelfLifeDays: 2 }, // per 100g
  'lettuce': { peso: 15, co2e: 0.02, shelfLifeDays: 7 }, // per head
  'tomato': { peso: 8, co2e: 0.03, shelfLifeDays: 10 }, // per piece
  'apple': { peso: 20, co2e: 0.04, shelfLifeDays: 30 }, // per piece
  'banana': { peso: 10, co2e: 0.08, shelfLifeDays: 5 }, // per piece
  'orange': { peso: 15, co2e: 0.05, shelfLifeDays: 21 }, // per piece
  'pasta': { peso: 25, co2e: 0.15, shelfLifeDays: 365 }, // per cup cooked
  'potato': { peso: 12, co2e: 0.02, shelfLifeDays: 60 }, // per piece
  'cheese': { peso: 50, co2e: 0.8, shelfLifeDays: 21 }, // per 50g slice
  'egg': { peso: 9, co2e: 0.2, shelfLifeDays: 28 }, // per piece
  'milk': { peso: 60, co2e: 0.3, shelfLifeDays: 7 }, // per liter
  'yogurt': { peso: 30, co2e: 0.2, shelfLifeDays: 14 },
};

export function getImpact(itemName: string): { peso: number; co2e: number, shelfLifeDays: number } {
  const lowerCaseItem = itemName.toLowerCase();
  for (const key in FOOD_DATA) {
    if (lowerCaseItem.includes(key)) {
      return FOOD_DATA[key];
    }
  }
  return { peso: 5, co2e: 0.1, shelfLifeDays: 7 }; // Default for unrecognized items
}

const getFromStorage = <T>(key: string): T => {
    if (typeof window === 'undefined') return [] as T;
    const items = localStorage.getItem(key);
    return items ? JSON.parse(items) : [];
}

const saveToStorage = <T>(key: string, data: T) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(data));
}


export const saveWasteLog = async (newLog: Omit<WasteLog, 'id'>): Promise<string> => {
    const logs = getFromStorage<WasteLog[]>(`wasteLogs_${newLog.userId}`);
    const logWithId = { ...newLog, id: crypto.randomUUID() };
    logs.push(logWithId);
    saveToStorage(`wasteLogs_${newLog.userId}`, logs);
    return logWithId.id;
};

export const getWasteLogsForUser = async (userId: string): Promise<WasteLog[]> => {
    const logs = getFromStorage<WasteLog[]>(`wasteLogs_${userId}`);
    return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const deleteWasteLog = async (logId: string, userId: string) => {
    let logs = getFromStorage<WasteLog[]>(`wasteLogs_${userId}`);
    logs = logs.filter(log => log.id !== logId);
    saveToStorage(`wasteLogs_${userId}`, logs);
}

export const getPantryItemsForUser = async (userId: string): Promise<PantryItem[]> => {
    const items = getFromStorage<PantryItem[]>(`pantryItems_${userId}`);
    return items.sort((a, b) => new Date(a.estimatedExpirationDate).getTime() - new Date(b.estimatedExpirationDate).getTime());
};

export const savePantryLog = async (newLog: Omit<PantryLog, 'id' | 'date' | 'userId'>, userId: string): Promise<string> => {
    const items = getFromStorage<PantryItem[]>(`pantryItems_${userId}`);
    const newItemsWithIds = newLog.items.map(item => ({...item, id: crypto.randomUUID()}));
    const allItems = [...items, ...newItemsWithIds];
    saveToStorage(`pantryItems_${userId}`, allItems);
    
    // We don't really need to save the log itself, just the items.
    // We'll return a dummy ID.
    return crypto.randomUUID();
};


export const deletePantryItem = async (itemId: string, userId: string) => {
    let items = getFromStorage<PantryItem[]>(`pantryItems_${userId}`);
    items = items.filter(item => item.id !== itemId);
    saveToStorage(`pantryItems_${userId}`, items);
};
