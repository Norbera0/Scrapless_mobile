
'use client';

import { useMemo } from 'react';
import type { SavingsEvent } from '@/types';
import { useSavingsStore } from '@/stores/savings-store';
import { db } from './firebase';
import { doc, writeBatch, getDocs, collection, query, where, orderBy, addDoc } from 'firebase/firestore';


export async function planTransfer(userId: string, amount: number) {
  if (typeof window === 'undefined' || !userId || !amount || amount <= 0) return;

  // This function now creates a single "withdrawal" event to represent the transfer.
  // This is simpler and more accurate than trying to mark individual events.
  const savingsEventsRef = collection(db, `users/${userId}/savingsEvents`);
  
  // Create a new event representing the withdrawal from the virtual savings pool.
  // This event will reduce the "available" balance.
  const withdrawalEvent: Omit<SavingsEvent, 'id'> = {
      userId: userId,
      date: new Date().toISOString(),
      type: 'withdrawal',
      amount: -amount, // Use a negative amount to represent a transfer out
      description: `Transferred ₱${amount.toFixed(2)} to BPI #MySaveUp`,
      calculationMethod: 'User Initiated Transfer',
      transferredToBank: true, // This is immediately considered 'transferred'
      transferDate: new Date().toISOString(),
  };

  try {
    await addDoc(savingsEventsRef, withdrawalEvent);
    // The onSnapshot listener in data.ts will handle updating the Zustand store automatically.
  } catch (error) {
    console.error("Failed to create withdrawal event:", error);
    throw error; // Re-throw to be caught by the caller UI.
  }
}

export function useSavingsSummary(savingsEvents: SavingsEvent[]) {
  return useMemo(() => {
    // Total savings are the sum of all POSITIVE events.
    const totalPositiveSavings = savingsEvents
        .filter(e => e.amount > 0)
        .reduce((sum, e) => sum + e.amount, 0);

    // Available is the sum of ALL events (positive and negative withdrawals).
    const available = savingsEvents.reduce((sum, e) => sum + e.amount, 0);
    
    return { 
        total: totalPositiveSavings, 
        available: Math.max(0, available) // Ensure available doesn't go below zero
    };
  }, [savingsEvents]);
}
