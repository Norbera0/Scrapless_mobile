
'use server';

/**
 * @fileOverview Defines a Genkit flow for generating an insight based on waste breakdown.
 */

import { ai } from '@/ai/genkit';
import { 
    GetWasteBreakdownInsightInputSchema, 
    GetWasteBreakdownInsightOutputSchema, 
    type GetWasteBreakdownInsightInput, 
    type GetWasteBreakdownInsightOutput 
} from '@/ai/schemas';

export async function getWasteBreakdownInsight(input: GetWasteBreakdownInsightInput): Promise<GetWasteBreakdownInsightOutput> {
  return getWasteBreakdownInsightFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getWasteBreakdownInsightPrompt',
  input: { schema: GetWasteBreakdownInsightInputSchema },
  output: { schema: GetWasteBreakdownInsightOutputSchema },
  prompt: `You are an AI assistant for "Scrapless," an app helping users in the Philippines reduce food waste.

Your task is to provide one concise, practical, and actionable tip based on the user's top wasted food category.

The user's top wasted category is **{{topCategory}}**, which makes up **{{percentage}}%** of their total food waste.

Based on this, generate a single sentence tip to help them reduce waste in this specific category. The tip should be encouraging and easy to implement in a Filipino household.

Example for "Bread": "Bread is your top waste source. Try freezing extra slices to extend their shelf life and toast them directly from frozen."
Example for "Vegetables": "Vegetables are your largest waste category. Consider buying smaller quantities more frequently from a local 'talipapa' to ensure freshness."
`,
});


const getWasteBreakdownInsightFlow = ai.defineFlow(
  {
    name: 'getWasteBreakdownInsightFlow',
    inputSchema: GetWasteBreakdownInsightInputSchema,
    outputSchema: GetWasteBreakdownInsightOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);

    if (!output || !output.insight) {
      return { insight: `Focus on using up your ${input.topCategory.toLowerCase()}. Planning one or two meals around them can make a big difference.` };
    }

    return output;
  }
);
