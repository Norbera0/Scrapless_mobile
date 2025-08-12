
/**
 * @fileOverview Central configuration for the Green Points rewards system.
 * This file serves as the single source of truth for how many points are awarded for each user action.
 */
import type { GreenPointsEvent } from "@/types";

export const GREEN_POINTS_CONFIG: Record<GreenPointsEvent['type'], { points: number, defaultDescription: (param?: string) => string }> = {
    log_pantry_item: {
        points: 10,
        defaultDescription: (itemName?: string) => `Logged "${itemName || 'item'}" in pantry.`
    },
    use_pantry_item: {
        points: 25,
        defaultDescription: (itemName?: string) => `Used "${itemName || 'item'}" from pantry.`
    },
    cook_recipe: {
        points: 50,
        defaultDescription: (recipeName?: string) => `Cooked the recipe: ${recipeName || 'a suggested meal'}.`
    },
    zero_waste_week: {
        points: 250,
        defaultDescription: () => `Completed a zero-waste week!`
    },
    acted_on_insight: {
        points: 100,
        defaultDescription: (insightTitle?: string) => `Committed to the insight: "${insightTitle || 'AI suggestion'}".`
    }
};
