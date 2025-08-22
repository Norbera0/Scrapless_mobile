

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
    model: 'googleai/gemini-1.5-pro',
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

    




