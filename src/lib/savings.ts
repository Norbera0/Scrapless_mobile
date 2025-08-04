
'use client';

import { differenceInDays, startOfToday } from 'date-fns';
import type { User, PantryItem, Recipe, SavingsEvent } from '@/types';
import { saveSavingsEvent } from './data';

const AVOIDED_EXPIRY_WINDOW_DAYS = 2;
const AVOIDED_EXPIRY_WASTE_PROBABILITY = 0.25; // 25%
const RECIPE_ALTERNATIVE_COST = 150; // ₱150
const RECIPE_SAVINGS_CAP = 100; // ₱100

/**
 * Mechanism 1: Avoided Expiry Savings
 * Calculates savings when a user consumes an item that was close to expiring.
 */
export const calculateAndSaveAvoidedExpiry = async (user: User, item: PantryItem) => {
    if (!item.estimatedCost || item.estimatedCost === 0) {
        console.log(`No savings calculated for ${item.name}: no cost associated.`);
        return; // Cannot calculate savings without a cost
    }

    const today = startOfToday();
    const expiry = new Date(item.estimatedExpirationDate);
    const daysUntilExpiry = differenceInDays(expiry, today);

    if (daysUntilExpiry <= AVOIDED_EXPIRY_WINDOW_DAYS) {
        const amountSaved = item.estimatedCost * AVOIDED_EXPIRY_WASTE_PROBABILITY;

        const savingsEvent: Omit<SavingsEvent, 'id'> = {
            userId: user.uid,
            date: new Date().toISOString(),
            type: 'avoided_expiry',
            amount: amountSaved,
            description: `Used "${item.name}" ${daysUntilExpiry} day(s) before it expired, avoiding potential waste.`,
            relatedPantryItemId: item.id,
            calculationMethod: `Item cost (₱${item.estimatedCost}) * Waste Probability (${AVOIDED_EXPIRY_WASTE_PROBABILITY * 100}%)`,
            transferredToBank: false,
        };

        try {
            await saveSavingsEvent(user.uid, savingsEvent);
            console.log(`Saved ₱${amountSaved.toFixed(2)} for avoiding expiry of ${item.name}.`);
        } catch (error) {
            console.error('Failed to save avoided expiry event:', error);
        }
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

    const savingsEvent: Omit<SavingsEvent, 'id'> = {
        userId: user.uid,
        date: new Date().toISOString(),
        type: 'recipe_followed',
        amount: amountSaved,
        description: `Cooked "${recipe.name}" instead of opting for a more expensive meal.`,
        calculationMethod: `Alternative Meal Cost (₱${RECIPE_ALTERNATIVE_COST}) - Needed Ingredients (₱${neededIngredientsCost})`,
        transferredToBank: false,
    };

    try {
        await saveSavingsEvent(user.uid, savingsEvent);
        console.log(`Saved ₱${amountSaved.toFixed(2)} for following the recipe: ${recipe.name}.`);
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
