
'use server';

/**
 * @fileOverview This file defines a Genkit flow for the Scrapless AI Assistant.
 *
 * - chatWithAssistant - The main function to handle conversational chat.
 * - ChatWithAssistantInput - The input type, containing pantry, waste, and user query.
 * - ChatWithAssistantOutput - The output type, providing the AI's text response.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  ChatWithAssistantInputSchema,
  ChatWithAssistantOutputSchema,
  type ChatWithAssistantInput,
  type ChatWithAssistantOutput,
} from '@/ai/schemas';

export async function chatWithAssistant(input: ChatWithAssistantInput): Promise<ChatWithAssistantOutput> {
  return chatWithAssistantFlow(input);
}

const mainPrompt = ai.definePrompt({
  name: 'chatWithAssistantPrompt',
  input: { schema: ChatWithAssistantInputSchema },
  output: { schema: ChatWithAssistantOutputSchema },
  prompt: `You are Scrapless Assistant, a helpful Filipino food waste reduction chatbot. Your personality is friendly, encouraging, and uses a natural mix of English and Taglish. Focus on practical, actionable advice.

Your capabilities include:
1. Recipe suggestions based on available ingredients.
2. Expiry management advice.
3. Waste pattern analysis and tips.
4. Shopping suggestions to reduce future waste.
5. Environmental and budget impact explanations.

Always keep responses conversational but concise, and offer specific next steps. Reference their actual data when relevant.

Here is the user's current context:
- User Name: {{userName}}
- Today's Date: ${new Date().toLocaleDateString()}

- Current Pantry Items (Name, Est. Expiry, Amount):
{{#if pantryItems.length}}
  {{#each pantryItems}}
  - {{this.name}} (expires ~{{this.estimatedExpirationDate}}), {{this.estimatedAmount}}
  {{/each}}
{{else}}
  - The pantry is empty.
{{/if}}

- Recent Waste Log Summary (Last 30 days):
{{#if wasteLogs.length}}
  - Total Peso Value Wasted: ₱{{totalPesoValueWasted}}
  - Total Carbon Footprint: {{totalCarbonFootprintWasted}} kg CO₂e
  - Top Wasted Item: {{topWastedItem.name}} ({{topWastedItem.count}} times)
  - Most Common Waste Reason: "{{mostCommonWasteReason}}"
{{else}}
  - No waste has been logged recently.
{{/if}}

- User Preferences:
{{#if preferences}}
  - Dietary Restrictions: {{#if preferences.dietaryRestrictions}}{{#each preferences.dietaryRestrictions}}{{this}}, {{/each}}{{else}}None{{/if}}
  - Favorite Cuisines: {{#if preferences.favoriteCuisines}}{{#each preferences.favoriteCuisines}}{{this}}, {{/each}}{{else}}None{{/if}}
{{else}}
  - No preferences set.
{{/if}}

---

Conversation History:
{{#each history}}
- {{this.role}}: {{this.text}}
{{/each}}

User's new message:
"{{{query}}}"

Your response:
`,
});

const transcriptionPrompt = ai.definePrompt({
    name: 'transcribeUserQueryPrompt',
    input: { schema: z.object({ audioDataUri: z.string() }) },
    output: { schema: z.object({ transcribedText: z.string() }) },
    prompt: `Transcribe the following audio message accurately into text.
Audio: {{media url=audioDataUri}}`,
  });
  

const chatWithAssistantFlow = ai.defineFlow(
  {
    name: 'chatWithAssistantFlow',
    inputSchema: ChatWithAssistantInputSchema,
    outputSchema: ChatWithAssistantOutputSchema,
  },
  async (input) => {
    let userQuery = input.query;
    let transcribedQuery: string | undefined = undefined;

    // If audio is provided, transcribe it first.
    if (input.audioDataUri) {
      const { output: transcriptionOutput } = await transcriptionPrompt({ audioDataUri: input.audioDataUri });
      userQuery = transcriptionOutput?.transcribedText ?? '';
      transcribedQuery = userQuery;
    }

    if (!userQuery) {
        return { response: "I couldn't hear you clearly. Could you please try again?" };
    }
    
    // Construct the input for the main chat prompt
    const chatPromptInput = {
      ...input,
      query: userQuery,
    };
    
    const { output } = await mainPrompt(chatPromptInput);
    
    if (!output) {
      return { response: "I'm not sure how to answer that. Can you try asking differently?" };
    }

    return { ...output, transcribedQuery };
  }
);
