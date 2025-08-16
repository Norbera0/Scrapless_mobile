
'use server';

/**
 * @fileOverview Defines a Genkit flow for generating a food disposal tip.
 */

import { ai } from '@/ai/genkit';
import { GetDisposalTipInputSchema, GetDisposalTipOutputSchema, type GetDisposalTipInput, type GetDisposalTipOutput } from '@/ai/schemas';


export async function getDisposalTip(input: GetDisposalTipInput): Promise<GetDisposalTipOutput> {
  return getDisposalTipFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getDisposalTipPrompt',
  input: { schema: GetDisposalTipInputSchema },
  output: { schema: GetDisposalTipOutputSchema },
  prompt: `You are a waste management expert for "Scrapless," an app that helps users in the Philippines reduce food waste.

Your task is to provide one practical, actionable, and safe disposal tip for the following list of wasted food items. The tip should be relevant to a Filipino household.

Wasted items:
{{#each items}}
- {{this.name}} ({{this.estimatedAmount}})
{{/each}}

Consider options like composting, feeding to animals (if safe), or other local repurposing methods. Prioritize tips that are environmentally friendly.

Your tip should be concise and easy to understand.
`,
});


const getDisposalTipFlow = ai.defineFlow(
  {
    name: 'getDisposalTipFlow',
    inputSchema: GetDisposalTipInputSchema,
    outputSchema: GetDisposalTipOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);

    if (!output || !output.tip) {
      return { tip: "Remember to segregate your waste. Check with your local barangay for specific composting programs." };
    }

    return output;
  }
);
