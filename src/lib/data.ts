import { collection, addDoc, getDocs, query, where, deleteDoc, doc, orderBy } from 'firebase/firestore';
import type { WasteLog, FoodItem } from '@/types';
import { db } from './firebase';

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
