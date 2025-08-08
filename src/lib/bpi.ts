'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SavingsEvent } from '@/types';

export type BpiAccount = {
  id: string;
  name: string;
  type: 'Savings' | 'Time Deposit' | 'Checking';
  maskedNumber: string;
  currency: 'PHP';
  availableBalance: number; // in PHP
};

export type BpiLinkState = {
  isLinked: boolean;
  linkedAt?: string; // ISO
  scopes?: string[];
};

const STORAGE_KEYS = {
  LINK: 'scrapless.bpi.linked',
  SCOPES: 'scrapless.bpi.scopes',
  MOCK_ACCOUNTS: 'scrapless.bpi.mock_accounts',
  TRANSFER_PLANS: 'scrapless.bpi.transfer_plans',
};

const defaultAccounts: BpiAccount[] = [
  {
    id: 'acc_sav_001',
    name: 'SaveUp by BPI',
    type: 'Savings',
    maskedNumber: '***-***-1234',
    currency: 'PHP',
    availableBalance: 10500,
  },
  {
    id: 'acc_td_green_001',
    name: 'Green Saver Time Deposit',
    type: 'Time Deposit',
    maskedNumber: '***-***-9876',
    currency: 'PHP',
    availableBalance: 25000,
  },
];

export function getStoredAccounts(): BpiAccount[] {
  if (typeof window === 'undefined') return defaultAccounts;
  const raw = localStorage.getItem(STORAGE_KEYS.MOCK_ACCOUNTS);
  if (!raw) return defaultAccounts;
  try {
    const parsed = JSON.parse(raw) as BpiAccount[];
    return parsed.length ? parsed : defaultAccounts;
  } catch {
    return defaultAccounts;
  }
}

export function setStoredAccounts(accounts: BpiAccount[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.MOCK_ACCOUNTS, JSON.stringify(accounts));
}

export function getLinkState(): BpiLinkState {
  if (typeof window === 'undefined') return { isLinked: false };
  const isLinked = localStorage.getItem(STORAGE_KEYS.LINK) === 'true';
  const scopesRaw = localStorage.getItem(STORAGE_KEYS.SCOPES);
  const scopes = scopesRaw ? (JSON.parse(scopesRaw) as string[]) : [];
  return { isLinked, linkedAt: isLinked ? new Date().toISOString() : undefined, scopes };
}

export function setLinkState(state: BpiLinkState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.LINK, state.isLinked ? 'true' : 'false');
  localStorage.setItem(STORAGE_KEYS.SCOPES, JSON.stringify(state.scopes ?? []));
}

export function planTransfer(amount: number, fromAccountId: string, toAccountId: string) {
  if (typeof window === 'undefined') return;
  const raw = localStorage.getItem(STORAGE_KEYS.TRANSFER_PLANS);
  const plans = raw ? (JSON.parse(raw) as any[]) : [];
  plans.push({ amount, fromAccountId, toAccountId, plannedAt: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEYS.TRANSFER_PLANS, JSON.stringify(plans));
}

export function useBpiLinking() {
  const [state, setState] = useState<BpiLinkState>({ isLinked: false });

  useEffect(() => {
    setState(getLinkState());
  }, []);

  const link = useCallback((scopes: string[]) => {
    setLinkState({ isLinked: true, linkedAt: new Date().toISOString(), scopes });
    setState(getLinkState());
  }, []);

  const unlink = useCallback(() => {
    setLinkState({ isLinked: false, scopes: [] });
    setState(getLinkState());
  }, []);

  return { state, link, unlink };
}

// --- Calculators ---

/** Estimate 6-month time deposit earnings at a nominal annual rate. */
export function estimateTimeDepositEarnings(principalPhp: number, annualRatePct = 4.25, months = 6) {
  const r = annualRatePct / 100;
  const period = months / 12;
  const interest = principalPhp * r * period;
  return Math.max(0, Math.round((interest + Number.EPSILON) * 100) / 100);
}

/** Convert simple eco-impact to mock financial terms. */
export function greenImpactToSavings(params: { co2eKgSaved?: number; waterLitersSaved?: number; foodWasteKgReduced?: number }) {
  const { co2eKgSaved = 0, waterLitersSaved = 0, foodWasteKgReduced = 0 } = params;
  // Mock heuristics tied to local context
  const pesoFromFoodWaste = foodWasteKgReduced * 80; // ₱80/kg avoided
  const rewardsFromWater = Math.floor(waterLitersSaved / 50); // 1 point per 50L
  const rateBoostFromCO2e = Math.min(1, co2eKgSaved / 100); // up to +1% boost suggestion
  return { pesoFromFoodWaste, rewardsFromWater, rateBoostFromCO2e };
}

export function useSavingsSummary(savingsEvents: SavingsEvent[]) {
  return useMemo(() => {
    const total = savingsEvents.reduce((sum, e) => sum + e.amount, 0);
    const available = savingsEvents.filter((e) => !e.transferredToBank).reduce((sum, e) => sum + e.amount, 0);
    return { total, available };
  }, [savingsEvents]);
}


