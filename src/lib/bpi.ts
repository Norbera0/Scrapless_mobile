
'use client';

import { useMemo } from 'react';
import type { SavingsEvent } from '@/types';
import { useSavingsStore } from '@/stores/savings-store';

export function planTransfer(amount: number) {
  if (typeof window === 'undefined') return;
  
  // Update the savings store to mark events as transferred
  const { savingsEvents, setSavingsEvents } = useSavingsStore.getState();
  let amountToMark = amount;
  
  const updatedEvents = savingsEvents.map(event => {
    if (!event.transferredToBank && amountToMark > 0) {
      const amountFromEvent = Math.min(amountToMark, event.amount);
      amountToMark -= amountFromEvent;
      // In a real app, you might split events, but here we'll just mark as transferred
      // For simplicity, we mark the whole event as transferred if any part of it is.
      return { ...event, transferredToBank: true, transferDate: new Date().toISOString() };
    }
    return event;
  });

  setSavingsEvents(updatedEvents);
}

export function useSavingsSummary(savingsEvents: SavingsEvent[]) {
  return useMemo(() => {
    const total = savingsEvents.reduce((sum, e) => sum + e.amount, 0);
    const available = savingsEvents.filter((e) => !e.transferredToBank).reduce((sum, e) => sum + e.amount, 0);
    return { total, available };
  }, [savingsEvents]);
}
