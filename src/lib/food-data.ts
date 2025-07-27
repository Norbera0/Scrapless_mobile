
'use client';

// Simplified mapping. In a real app, this would be in a database.
export const FOOD_DATA_MAP: Record<string, { peso: number; co2e: number, shelfLifeDays: number }> = {
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
