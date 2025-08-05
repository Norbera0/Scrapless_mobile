
'use client';

import { differenceInDays, startOfToday, parseISO } from 'date-fns';
import type { User, PantryItem, Recipe, SavingsEvent } from '@/types';
import { saveSavingsEvent, getUserWasteStats } from './data';

const RECIPE_ALTERNATIVE_COST = 150; // ₱150
const RECIPE_SAVINGS_CAP = 100; // ₱100

/**
 * Rounds a number to two decimal places.
 */
const roundToTwoDecimals = (num: number): number => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
};


/**
 * Mechanism 1: Avoided Expiry Savings (Advanced Formula)
 * Calculates savings based on a dynamic model of spoil probability and user behavior.
 */
export const calculateAndSaveAvoidedExpiry = async (user: User, item: PantryItem, usageEfficiency: number) => {
    // Ensure item has a cost and was used before expiry.
    const usedDate = startOfToday();
    const expiryDate = parseISO(item.estimatedExpirationDate);
    if (!item.estimatedCost || item.estimatedCost === 0 || usedDate > expiryDate) {
        return;
    }

    // 1. Get shelf life from the correct storage type
    const storageType = item.storageLocation as keyof PantryItem['shelfLifeByStorage'] || 'pantry';
    const shelfLife = item.shelfLifeByStorage?.[storageType] || 30; // Default to 30 days if not present

    // 2. Compute freshness ratio
    const daysUntilExpiry = differenceInDays(expiryDate, usedDate);
    const freshnessRatio = Math.max(0, daysUntilExpiry / shelfLife);

    // 3. Determine spoil probability from freshness ratio
    let spoilProbability;
    if (freshnessRatio <= 0.1) spoilProbability = 0.9;
    else if (freshnessRatio <= 0.25) spoilProbability = 0.7;
    else if (freshnessRatio <= 0.5) spoilProbability = 0.4;
    else if (freshnessRatio <= 0.75) spoilProbability = 0.2;
    else spoilProbability = 0.05;

    // 4. Get user's average waste rate
    const userStats = await getUserWasteStats(user.uid);
    const userWasteProb = userStats.logsCount >= 10 ? userStats.avgWasteRate : 0.25; // Fallback to 25%

    // 5. Usage efficiency is passed in directly (e.g., 1.0 for all, 0.5 for half)
    if (usageEfficiency <= 0) return;

    // 6. Final avoided expiry savings calculation
    const savings = item.estimatedCost * spoilProbability * userWasteProb * usageEfficiency;
    const finalSavings = roundToTwoDecimals(savings);
    
    if (finalSavings <= 0) return;

    // Create and save the savings event
    const savingsEvent: Omit<SavingsEvent, 'id'> = {
        userId: user.uid,
        date: new Date().toISOString(),
        type: 'avoided_expiry',
        amount: finalSavings,
        description: `Used ${(usageEfficiency * 100).toFixed(0)}% of "${item.name}" ${daysUntilExpiry} day(s) before expiry.`,
        relatedPantryItemId: item.id,
        calculationMethod: `Price (₱${item.estimatedCost}) × Spoil Prob. (${(spoilProbability*100).toFixed(0)}%) × User Waste Prob. (${(userWasteProb*100).toFixed(0)}%) × Usage (${(usageEfficiency*100).toFixed(0)}%)`,
        transferredToBank: false,
    };

    try {
        await saveSavingsEvent(user.uid, savingsEvent);
        console.log(`Saved ₱${finalSavings} for avoiding expiry of ${item.name}.`);
    } catch (error) {
        console.error('Failed to save avoided expiry event:', error);
    }
};

/**
 * Mechanism 2: Recipe Following Savings
 * Calculates savings when a user follows a recipe instead of choosing a more expensive alternative.
 */
export const calculateAndSaveRecipeSavings = async (user: User, recipe: Recipe) => {
    const neededIngredientsCost = recipe.ingredients
        .filter(ing => ing.status === 'Need' && ing.estimatedCost)
        .reduce((acc, ing) => acc + (ing.estimatedCost || 0), 0);

    let amountSaved = RECIPE_ALTERNATIVE_COST - neededIngredientsCost;
    amountSaved = Math.min(amountSaved, RECIPE_SAVINGS_CAP); // Apply cap

    if (amountSaved <= 0) {
        console.log(`No savings calculated for recipe "${recipe.name}".`);
        return;
    }
    
    const finalSavings = roundToTwoDecimals(amountSaved);

    const savingsEvent: Omit<SavingsEvent, 'id'> = {
        userId: user.uid,
        date: new Date().toISOString(),
        type: 'recipe_followed',
        amount: finalSavings,
        description: `Cooked "${recipe.name}" instead of opting for a more expensive meal.`,
        calculationMethod: `Alternative Meal Cost (₱${RECIPE_ALTERNATIVE_COST}) - Needed Ingredients (₱${neededIngredientsCost})`,
        transferredToBank: false,
    };

    try {
        await saveSavingsEvent(user.uid, savingsEvent);
        console.log(`Saved ₱${finalSavings} for following the recipe: ${recipe.name}.`);
    } catch (error) {
        console.error('Failed to save recipe following event:', error);
    }
};

// TODO: Implement Mechanism 3: Waste Reduction Savings (Monthly)
export const calculateWasteReductionSavings = async (user: User) => {
    // This will involve fetching baseline data and comparing monthly waste totals.
    // To be implemented in a future step.
};

// TODO: Implement Mechanism 4: Smart Shopping Savings
export const calculateSmartShoppingSavings = async (user: User, items: PantryItem[]) => {
    // This will involve comparing newly added pantry items against AI recommendations.
    // To be implemented in a future step.
};
