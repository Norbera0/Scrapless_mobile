
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, orderBy, writeBatch } from 'firebase/firestore';
import type { WasteLog, PantryItem, PantryLog } from '@/types';
import { db } from './firebase';

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


export const saveWasteLog = async (newLog: Omit<WasteLog, 'id'>) => {
    try {
        const docRef = await addDoc(collection(db, 'wasteLogs'), newLog);
        return docRef.id;
    } catch (e) {
        console.error('Error adding document: ', e);
        throw new Error("Could not save waste log.");
    }
};

export const getWasteLogsForUser = async (userId: string): Promise<WasteLog[]> => {
    try {
        const q = query(collection(db, 'wasteLogs'), where('userId', '==', userId), orderBy('date', 'desc'));
        const querySnapshot = await getDocs(q);
        const logs: WasteLog[] = [];
        querySnapshot.forEach((doc) => {
            logs.push({ id: doc.id, ...doc.data() } as WasteLog);
        });
        return logs;
    } catch (e) {
        console.error('Error getting documents: ', e);
        return [];
    }
};

export const deleteWasteLog = async (logId: string) => {
    try {
        await deleteDoc(doc(db, 'wasteLogs', logId));
    } catch (e) {
        console.error('Error deleting document: ', e);
        throw new Error("Could not delete waste log.");
    }
}


export const getPantryItemsForUser = async (userId: string): Promise<PantryItem[]> => {
    try {
        const q = query(collection(db, 'pantryItems'), where('userId', '==', userId), orderBy('estimatedExpirationDate', 'asc'));
        const querySnapshot = await getDocs(q);
        const items: PantryItem[] = [];
        querySnapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() } as PantryItem);
        });
        return items;
    } catch (e) {
        console.error('Error getting pantry items: ', e);
        return [];
    }
};

export const savePantryLog = async (newLog: Omit<PantryLog, 'id' | 'date' | 'userId'>, userId: string) => {
    try {
        const batch = writeBatch(db);

        // Add the main log document
        const logDocRef = doc(collection(db, 'pantryLogs'));
        batch.set(logDocRef, { ...newLog, userId, date: new Date().toISOString() });

        // Add each item as a separate document in the pantryItems collection
        newLog.items.forEach(item => {
            const itemDocRef = doc(collection(db, 'pantryItems'));
            batch.set(itemDocRef, { ...item, userId });
        });

        await batch.commit();
        return logDocRef.id;
    } catch (e) {
        console.error('Error adding pantry log: ', e);
        throw new Error("Could not save pantry log.");
    }
};

export const deletePantryItem = async (itemId: string) => {
    try {
        await deleteDoc(doc(db, 'pantryItems', itemId));
    } catch (e) {
        console.error('Error deleting document: ', e);
        throw new Error("Could not delete pantry item.");
    }
};
