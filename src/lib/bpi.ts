
'use client';

import { useMemo } from 'react';
import type { SavingsEvent } from '@/types';
import { useSavingsStore } from '@/stores/savings-store';
import { db } from './firebase';
import { doc, writeBatch, getDocs, collection, query, where, orderBy } from 'firebase/firestore';


export async function planTransfer(userId: string, amount: number) {
  if (typeof window === 'undefined') return;

  const savingsEventsRef = collection(db, `users/${userId}/savingsEvents`);
  const q = query(savingsEventsRef, where('transferredToBank', '==', false), orderBy('date', 'asc'));
  
  const querySnapshot = await getDocs(q);
  const untransferredEvents = querySnapshot.docs.map(d => ({ ...d.data(), id: d.id } as SavingsEvent));

  let amountToMark = amount;
  const batch = writeBatch(db);

  for (const event of untransferredEvents) {
    if (amountToMark <= 0) break;
    
    // In a real app, you might handle partial transfers within an event.
    // For simplicity here, we'll mark the whole event as transferred.
    const amountFromEvent = event.amount;
    if (amountToMark >= amountFromEvent) {
      const eventRef = doc(db, `users/${userId}/savingsEvents`, event.id);
      batch.update(eventRef, { transferredToBank: true, transferDate: new Date().toISOString() });
      amountToMark -= amountFromEvent;
    }
  }

  if (amountToMark > 0 && querySnapshot.size > 0) {
    console.warn(`Could not mark the full amount. Short by ${amountToMark}. This might happen if event amounts are not divisible as needed.`);
  }

  await batch.commit();

  // The onSnapshot listener in data.ts will handle updating the Zustand store automatically.
}

export function useSavingsSummary(savingsEvents: SavingsEvent[]) {
  return useMemo(() => {
    const total = savingsEvents.reduce((sum, e) => sum + e.amount, 0);
    const available = savingsEvents.filter((e) => !e.transferredToBank).reduce((sum, e) => sum + e.amount, 0);
    return { total, available };
  }, [savingsEvents]);
}
