import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency formatting helpers
export function formatPeso(amount: number): string {
  if (!isFinite(amount)) return "₱0.00";
  return `₱${amount.toFixed(2)}`;
}

// Simple hackathon-grade estimators/converters
// Est. water saved from avoided purchases/waste (liters).
// Assumption: every ₱1 avoided corresponds to ~2.5L water footprint avoided (very rough proxy).
export function estimateWaterSavedLitersFromSavings(pesos: number): number {
  if (!isFinite(pesos) || pesos <= 0) return 0;
  return pesos * 2.5;
}

// Equivalence helpers for impact storytelling
// Assumption: ~₱60 per kg of rice (approx. PH retail baseline). Returns kg.
export function estimateRiceKgFromPesos(pesos: number): number {
  if (!isFinite(pesos) || pesos <= 0) return 0;
  return pesos / 60;
}

// Savings goal progress (0..100)
export function calculateSavingsGoalProgress(current: number, goalPesos: number): number {
  if (!isFinite(current) || current <= 0) return 0;
  if (!isFinite(goalPesos) || goalPesos <= 0) return 0;
  return Math.min(100, Math.max(0, (current / goalPesos) * 100));
}