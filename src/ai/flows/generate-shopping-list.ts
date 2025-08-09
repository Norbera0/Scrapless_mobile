
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a smart shopping list.
 *
 * - generateShoppingList - The main function to create a shopping list.
 * - GenerateShoppingListInput - The input type.
 * - GenerateShoppingListOutput - The output type.
 */

import { ai } from '@/ai/genkit';
import {
  GenerateShoppingListInputSchema,
  GenerateShoppingListOutputSchema,
  type GenerateShoppingListInput,
  type GenerateShoppingListOutput,
} from '@/ai/schemas';

export async function generateShoppingList(input: GenerateShoppingListInput): Promise<GenerateShoppingListOutput> {
  return generateShoppingListFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateShoppingListPrompt',
  input: { schema: GenerateShoppingListInputSchema },
  output: { schema: GenerateShoppingListOutputSchema },
  prompt: `You are a Filipino household shopping expert for "Scrapless," a food waste reduction app. Your task is to generate a smart, data-driven shopping list for a user.

**DATA ANALYSIS:**
Analyze the user's pantry status and their last 60 days of food waste logs.
-   **Pantry Items (Name, Quantity, Expiry):** {{#each pantryItems}}{{this.name}} ({{this.quantity}} {{this.unit}}, expires {{this.estimatedExpirationDate}}), {{/each}}
-   **Waste Logs (last 60 days):** {{#each wasteLogs}}{{#each this.items}}{{this.name}} ({{this.estimatedAmount}}), {{/each}}{{/each}}

**SHOPPING LIST GENERATION RULES:**

1.  **ESSENTIAL STAPLES (Always Include, 'essential' priority):**
    -   These are fundamental to a Filipino kitchen. ALWAYS include them if they are not in the pantry or are running low.
    -   Staples: Rice, eggs, cooking oil, onions, garlic, salt.
    -   Category: 'staple'. Reasoning: "A Filipino kitchen essential."

2.  **DATA-DRIVEN ITEMS (High Priority, 'recommended' priority):**
    -   These items should be replenished based on the user's history.
    -   **Low Stock:** Add items from the pantry that are running low and have a high usage rate (low waste history). Category: 'low_stock'. Reasoning: "You're running low on this item which you use frequently."
    -   **Consumed & Not Wasted:** Add items the user has consumed in the past but hasn't wasted. Category: 'data_driven'. Reasoning: "Based on your history, you use this item effectively."

3.  **COMPLEMENTARY SUGGESTIONS (Medium Priority, 'recommended' priority):**
    -   Suggest items that go well with the user's existing pantry and habits.
    -   Example: If they have pasta, suggest tomato sauce. If they buy chicken, suggest marinade ingredients.
    -   Category: 'complementary'. Reasoning: e.g., "Goes well with the pasta in your pantry."

4.  **NEVER SUGGEST:**
    -   Items with a high waste rate (>50% of the time it's logged, it's wasted).
    -   Items wasted multiple times recently.
    -   Expensive, highly perishable items unless the user has a history of successfully consuming them.

**OUTPUT FORMATTING:**
-   For each item, provide a unique ID, name, category, recommended quantity, estimated cost in PHP, priority, and a clear reasoning.
-   Calculate the total estimated cost of the entire list.
-   Provide a summary of the data used for generation.
`,
});

const generateShoppingListFlow = ai.defineFlow(
  {
    name: 'generateShoppingListFlow',
    inputSchema: GenerateShoppingListInputSchema,
    outputSchema: GenerateShoppingListOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate shopping list.');
    }
    // Set default isChecked/isPurchased values
    const itemsWithDefaults = output.items.map(item => ({
        ...item,
        isChecked: false,
        isPurchased: false
    }));
    
    return { ...output, items: itemsWithDefaults };
  }
);
