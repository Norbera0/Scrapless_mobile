
'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing waste patterns for the "Analytics" page.
 *
 * - analyzeWastePatterns - The main function to get waste insights.
 * - AnalyzeWastePatternsInput - The input type.
 * - AnalyzeWastePatternsOutput - The output type.
 */

import { ai } from '@/ai/genkit';
import {
  AnalyzeWastePatternsInputSchema,
  AnalyzeWastePatternsOutputSchema,
  type AnalyzeWastePatternsInput,
  type AnalyzeWastePatternsOutput,
} from '@/ai/schemas';

export async function analyzeWastePatterns(input: AnalyzeWastePatternsInput): Promise<AnalyzeWastePatternsOutput> {
  return analyzeWastePatternsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeWastePatternsPrompt',
  input: { schema: AnalyzeWastePatternsInputSchema },
  output: { schema: AnalyzeWastePatternsOutputSchema },
  prompt: `You are a Filipino household waste reduction expert for the "Scrapless" app.
Your task is to analyze the user's recent waste logs and provide a single, actionable, and non-obvious insight package.

**CRITICAL INSTRUCTION:** The user can already see their top wasted categories and reasons in charts. DO NOT simply state what is already obvious from the charts (e.g., "You waste a lot of vegetables" or "Your most common waste reason is spoilage"). Your value is in finding the *hidden* patterns and providing *unique* solutions.

**CONTEXTUAL DATA:**
- **Recent Waste Logs (last 30 days):** 
{{#if wasteLogs.length}}
    {{#each wasteLogs}}
        - On {{this.date}}, threw out {{#each this.items}}{{this.name}} ({{this.estimatedAmount}}), {{/each}} because "{{this.sessionWasteReason}}".
    {{/each}}
{{else}}
    - No waste logged in the last 30 days.
{{/if}}

**YOUR TASK: Generate a concise insight package with three distinct parts.**

1.  **Hidden Pattern (hiddenPattern)**: Analyze the data to find a subtle or interesting pattern that is NOT immediately obvious from a simple chart.
    *   *Bad Example (Obvious)*: "You waste a lot of vegetables."
    *   *Good Example (Subtle)*: "It seems you waste vegetables bought on weekends more frequently, suggesting impulse buys during big grocery trips aren't being used during the week."
    *   *Good Example (Subtle)*: "You tend to waste single-ingredient items (like a tomato) more often than leftovers from a cooked dish. This might mean small ingredients are getting lost in the fridge."

2.  **Smart Disposal Tip (disposalTip)**: Based on the types of items wasted, provide one specific and practical tip for how to properly dispose of or repurpose that kind of waste in a Filipino context.
    *   *Example for spoiled vegetables*: "For spoiled vegetables like tomatoes and peels, consider starting a small compost pit in your backyard. It's a great way to create natural fertilizer for plants."
    *   *Example for rice*: "Leftover rice, even a day old, can be repurposed. Dry it out in the sun to make 'bahaw' which you can fry into crispy 'tutong' snacks."

3.  **Prevention Solutions (preventionSolutions)**: Provide a list of exactly TWO actionable, creative solutions to prevent this type of waste in the future.
    *   *Example*: "Solution 1: Try the 'one-in, one-out' rule for vegetables. Don't buy a new vegetable until you've used up the last one of the same type."
    *   *Example*: "Solution 2: Create a small 'Use First' basket in your fridge for items that are about to expire. Check it before you cook every meal."

If there is not enough data, provide a welcoming message encouraging the user to log more waste to unlock insights.
`,
});

const analyzeWastePatternsFlow = ai.defineFlow(
  {
    name: 'analyzeWastePatternsFlow',
    inputSchema: AnalyzeWastePatternsInputSchema,
    outputSchema: AnalyzeWastePatternsOutputSchema,
  },
  async (input) => {
    if (!input.wasteLogs || input.wasteLogs.length < 3) {
      return {
        hiddenPattern: "We need a bit more data to identify your unique patterns.",
        disposalTip: "Start by logging your food waste for at least a week. The more data you provide, the smarter your insights will be!",
        preventionSolutions: [
            "Use the camera to quickly log your next food waste.",
            "Try to log the reason why the food was wasted for even better insights."
        ]
      };
    }

    const { output } = await prompt(input);
    if (!output) {
      throw new Error("The AI failed to generate a waste pattern analysis.");
    }
    
    return output;
  }
);
