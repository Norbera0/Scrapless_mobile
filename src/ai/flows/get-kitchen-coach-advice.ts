
'use server';

/**
 * @fileOverview A Genkit flow that provides coaching advice based on pantry contents.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import {
  KitchenCoachInputSchema,
  KitchenCoachOutputSchema,
  type KitchenCoachInput,
  type KitchenCoachOutput,
} from '@/ai/schemas';
import { generateFoodImage } from './food-image-generation';

export async function getKitchenCoachAdvice(input: KitchenCoachInput): Promise<KitchenCoachOutput> {
  return kitchenCoachFlow(input);
}

const prompt = ai.definePrompt({
  name: 'kitchenCoachPrompt',
  input: { schema: KitchenCoachInputSchema },
  output: { schema: KitchenCoachOutputSchema },
  prompt: `You are the "Kitchen Coach" for Scrapless, a food waste reduction app. Your tone is encouraging, knowledgeable, and helpful.
Analyze the user's current pantry items and provide a concise coaching package.

Pantry Items (sorted by soonest expiration date):
{{#each pantryItems}}
- {{this.name}} ({{this.quantity}} {{this.unit}}), expires around {{this.estimatedExpirationDate}}
{{/each}}

Your task is to generate the following three pieces of advice:

1.  **Quick Tip:** A single, immediately actionable sentence. This should be a clever little hack or a simple reminder.
    *Example: "Your bananas are perfect for freezing! Slice them up for smoothies."*

2.  **Deeper Insight:** A 2-3 sentence analysis focusing on what to use first and why. Prioritize items expiring soon.
    *Example: "Your chicken and lettuce are expiring in the next few days. I'd suggest using them together to prevent them from going to waste. You can make a simple chicken salad or a stir-fry."*

3.  **Recipe Idea:** A single, simple recipe concept that uses one or more of the priority items. Provide a name and a short, enticing description.
    *Example Recipe Name: "Quick Chicken & Veggie Stir-fry"*
    *Example Recipe Description: "A fast and flavorful way to use your chicken and vegetables. Ready in under 20 minutes!"*
`,
});

const kitchenCoachFlow = ai.defineFlow(
  {
    name: 'kitchenCoachFlow',
    inputSchema: KitchenCoachInputSchema,
    outputSchema: KitchenCoachOutputSchema,
  },
  async (input) => {
    // If there are no items, return a default/empty state message.
    if (!input.pantryItems || input.pantryItems.length === 0) {
      return {
        quickTip: "Your pantry is empty! Add some items to get personalized advice.",
        deeperInsight: "Once you stock your pantry, I can help you figure out what to cook first to minimize waste.",
        recipeIdea: {
          name: "Let's Get Cooking!",
          description: "Add items to your pantry and I'll suggest a recipe for you.",
        },
      };
    }

    // Call the main prompt to get the text-based advice
    const { output } = await prompt(input);

    if (!output) {
      throw new Error("The Kitchen Coach could not generate advice.");
    }

    // Generate an image for the recipe idea in parallel
    try {
        const { imageUrl } = await generateFoodImage({ recipeName: output.recipeIdea.name });
        output.recipeIdea.photoDataUri = imageUrl;
    } catch (error) {
        console.error(`Failed to generate image for recipe: ${output.recipeIdea.name}`, error);
        // Continue without an image if generation fails
    }

    return output;
  }
);
