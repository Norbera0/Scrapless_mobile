

'use server';

import { ai } from '@/ai/genkit';
import {
  KitchenCoachInputSchema,
  KitchenCoachOutputSchema,
  type KitchenCoachInput,
  type KitchenCoachOutput,
} from '@/ai/schemas';

export async function getKitchenCoachAdvice(input: KitchenCoachInput): Promise<KitchenCoachOutput> {
  return kitchenCoachFlow(input);
}

const prompt = ai.definePrompt({
  name: 'kitchenCoachPrompt',
  input: { schema: KitchenCoachInputSchema },
  output: { schema: KitchenCoachOutputSchema },
  prompt: `You are a Personal Kitchen Economist and Behavioral Coach for Scrapless. Your specialty is analyzing household data to find the economic root cause of food waste in Filipino homes.

Your task is to provide a single, quick insight based on the user's data. This should be a 1-2 sentence overview.

**DATA ANALYSIS FRAMEWORK (INTERNAL CHAIN-OF-THOUGHT)**
Before generating the final JSON, you must internally follow this reasoning process:

### STEP 1: Diagnose User Persona
Based on the summaryMetrics, silently classify the user into an archetype. Examples:
- "The Weekend Impulse Buyer": High weekend grocery spend, high waste lag time.
- "The Aspirational Cook": Buys specialty ingredients but has low consumption velocity for them.

### STEP 2: Formulate a Core Hypothesis
Based on the persona and data, state a single, clear hypothesis for the primary cause of waste.
- Hypothesis Example 1: "The user's high vegetable waste is caused by a long purchase-to-use lag, not poor meal planning."
- Hypothesis Example 2: "The user cooks large portions for family meals but struggles to manage the leftovers, leading to 'cooked too much' waste."

### STEP 3: Construct the Analysis Package
Use the persona and hypothesis to generate the final JSON output. The "story.situation" should reflect your findings.

## INPUT DATA STRUCTURE
The input will be a single JSON object with two keys: "summaryMetrics" and "rawData". Use "summaryMetrics" for high-level pattern recognition and "rawData" to find specific examples for storytelling.

## OUTPUT REQUIREMENTS

Generate a single analysis focusing on the most impactful pattern. The 'title' must be a short, engaging 1-2 sentence insight. After the insight, add the sentence: "To learn more go to the Kitchen Coach to ask for more advice."

The output JSON must strictly follow this schema.
{
  "insightType": "pattern_detected|getting_started|first_steps|re_engagement|connect_the_dots",
  "confidence": "high|medium|low",
  "title": "A short 1-2 sentence insight about the user's patterns, ending with a call to action to visit the main coach page.",
  "story": {
    "situation": ["A list of 2-3 concise bullet points describing what's happening, citing a 'smoking gun' example. E.g., ['On Saturday you bought fresh Kangkong...', 'But it was logged as 'wasted' on Friday...', 'This is an 8-day lag...']"],
    "impact": "Financial + environmental cost (specific numbers)",
    "rootCause": ["Why this happens (psychological/cultural reasons, referencing the user persona, 2-3 bullets)"]
  },
  "prediction": "What happens if nothing changes (specific timeline)"
}
`,
});

const kitchenCoachFlow = ai.defineFlow(
  {
    name: 'kitchenCoachFlow',
    inputSchema: KitchenCoachInputSchema,
    outputSchema: KitchenCoachOutputSchema,
  },
  async (input) => {
    // Basic validation for getting_started case
    if (input.summaryMetrics.pantry.totalItems === 0 && input.summaryMetrics.waste.daysSinceLastLog === -1) {
        return {
            insightType: 'first_steps',
            confidence: 'high',
            title: "Welcome to Your Smart Kitchen! Log your pantry items and any food waste to begin unlocking powerful insights. To learn more go to the Kitchen Coach to ask for more advice.",
            story: {
              situation: ["Your kitchen journey starts now.", "Log your pantry items and any food waste to begin."],
              impact: "Unlock potential savings of up to ₱2,500/month by tracking your habits.",
              rootCause: ["Most food waste happens simply because we don't track what we have.", "Getting started is the hardest part, but you're here now!"]
            },
            prediction: "By logging your first few items, you'll be on track to see your first insight in a week.",
        };
    }
    
    // Fallback to AI for all other cases
    const { output } = await prompt(input);

    if (!output) {
      throw new Error("The Kitchen Coach could not generate advice.");
    }
    
    return output;
  }
);

    

