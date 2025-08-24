
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

const summarizationPrompt = ai.definePrompt({
    name: 'summarizeUserIntentPrompt',
    input: { schema: z.object({
        query: z.string(),
        history: z.array(z.object({
            role: z.enum(['user', 'model']),
            text: z.string(),
        })),
    })},
    output: { schema: z.object({
        requiresPantry: z.boolean().describe("Does the query require knowing what's in the pantry?"),
        requiresWaste: z.boolean().describe("Does the query require knowing the user's waste history?"),
    })},
    prompt: `Analyze the user's query and conversation history to determine if full context is needed.
    
    Conversation History:
    {{#each history}}
    - {{this.role}}: {{this.text}}
    {{/each}}

    User's new message:
    "{{{query}}}"
    `,
});

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

{{#if pantryItems}}
- Current Pantry Items (Name, Est. Expiry, Amount):
{{#each pantryItems}}
  - {{this.name}} (expires ~{{this.estimatedExpirationDate}}), {{this.estimatedAmount}}
{{/each}}
{{/if}}

{{#if wasteLogs}}
- Recent Waste Log Summary (Last 30 days):
  - Total Peso Value Wasted: ₱{{totalPesoValueWasted}}
  - Total Carbon Footprint: {{totalCarbonFootprintWasted}} kg CO₂e
  - Top Wasted Item: {{topWastedItem.name}} ({{topWastedItem.count}} times)
  - Most Common Waste Reason: "{{mostCommonWasteReason}}"
{{/if}}

{{#if preferences}}
- User Preferences:
  - Dietary Restrictions: {{#if preferences.dietaryRestrictions}}{{#each preferences.dietaryRestrictions}}{{this}}, {{/each}}{{else}}None{{/if}}
  - Favorite Cuisines: {{#if preferences.favoriteCuisines}}{{#each preferences.favoriteCuisines}}{{this}}, {{/each}}{{else}}None{{/if}}
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
    model: 'googleai/gemini-2.5-flash',
  },
  async (input) => {
    let userQuery = input.query;
    let transcribedQuery: string | undefined = undefined;

    // If audio is provided, transcribe it first.
    if (input.audioDataUri) {
      try {
        const { output: transcriptionOutput } = await transcriptionPrompt({ audioDataUri: input.audioDataUri });
        userQuery = transcriptionOutput?.transcribedText;
        transcribedQuery = userQuery;
      } catch (e) {
        console.error("Audio transcription failed:", e);
        return { response: "I'm sorry, I had trouble understanding your audio. Could you please try again or type your message?" };
      }
    }

    if (!userQuery) {
        return { response: "I couldn't hear you clearly. Could you please try again?" };
    }
    
    // Base input for the chat prompt
    const chatPromptInput: ChatWithAssistantInput = {
        userName: input.userName,
        history: input.history,
        query: userQuery,
        preferences: input.preferences
    };
    
    try {
        // First, check if full context is needed
        const { output: summary } = await summarizationPrompt({ query: userQuery, history: input.history });

        // Conditionally add context based on the summary
        if (summary?.requiresPantry) {
            chatPromptInput.pantryItems = input.pantryItems;
        }
        if (summary?.requiresWaste) {
            chatPromptInput.wasteLogs = input.wasteLogs;
            chatPromptInput.totalPesoValueWasted = input.totalPesoValueWasted;
            chatPromptInput.totalCarbonFootprintWasted = input.totalCarbonFootprintWasted;
            chatPromptInput.topWastedItem = input.topWastedItem;
            chatPromptInput.mostCommonWasteReason = input.mostCommonWasteReason;
        }

        const { output } = await mainPrompt(chatPromptInput);
    
        if (!output?.response) {
            return { response: "I'm not sure how to answer that. Can you try asking differently?" };
        }
    
        return { ...output, transcribedQuery };
    } catch (error) {
        console.error("Chat prompt failed:", error);
        return { response: "I'm sorry, I'm having a little trouble right now. Please try again in a moment." };
    }
  }
);
