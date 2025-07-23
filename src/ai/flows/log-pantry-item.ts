
'use server';

/**
 * @fileOverview This file defines a Genkit flow for logging new pantry items from a photo, voice, or text.
 *
 * - logPantryItem - The main function to process the input and add to the pantry.
 * - LogPantryItemInput - The input type, containing the source and data.
 * - LogPantryItemOutput - The output type, providing a list of detected food items with expiration dates.
 */

import { ai } from '@/ai/genkit';
import {
  LogPantryItemInputSchema,
  LogPantryItemOutputSchema,
  type LogPantryItemInput,
  type LogPantryItemOutput,
} from '@/ai/schemas';
import { getImpact } from '@/lib/data';
import { addDays, formatISO } from 'date-fns';

export async function logPantryItem(input: LogPantryItemInput): Promise<LogPantryItemOutput> {
  return logPantryItemFlow(input);
}

const cameraPrompt = ai.definePrompt({
    name: 'logPantryItemCameraPrompt',
    input: { schema: LogPantryItemInputSchema },
    output: { schema: LogPantryItemOutputSchema },
    prompt: `You are an AI assistant that analyzes images of groceries, receipts, or handwritten lists. Your task is to identify each food item, estimate its quantity, and predict its expiration date based on common shelf-life. Provide the current date for reference: ${new Date().toLocaleDateString()}
  
    Analyze the following photo and provide a structured list.
  
    Photo: {{media url=data}}
    `,
  });

const voicePrompt = ai.definePrompt({
    name: 'logPantryItemVoicePrompt',
    input: { schema: LogPantryItemInputSchema },
    output: { schema: LogPantryItemOutputSchema },
    prompt: `You are an AI assistant that transcribes audio of a person listing their new groceries. Your task is to intelligently extract only the food items and their quantities, filtering out all filler words, pauses, and irrelevant phrases. Then, predict an expiration date for each item based on common shelf-life. Provide the current date for reference: ${new Date().toLocaleDateString()}

    Listen to the following audio and provide a structured list.
    
    Audio: {{media url=data}}
      `,
});

const textPrompt = ai.definePrompt({
    name: 'logPantryItemTextPrompt',
    input: { schema: LogPantryItemInputSchema },
    output: { schema: LogPantryItemOutputSchema },
    prompt: `You are an AI assistant that processes a text list of new groceries. Your task is to identify each food item, estimate its quantity, and predict its expiration date based on common shelf-life. Provide the current date for reference: ${new Date().toLocaleDateString()}
    
    Analyze the following text and provide a structured list.

    Text: {{{data}}}
    `,
});

const logPantryItemFlow = ai.defineFlow(
  {
    name: 'logPantryItemFlow',
    inputSchema: LogPantryItemInputSchema,
    outputSchema: LogPantryItemOutputSchema,
  },
  async (input) => {
    let prompt;
    switch (input.source) {
      case 'camera':
        prompt = cameraPrompt;
        break;
      case 'voice':
        prompt = voicePrompt;
        break;
      case 'text':
        prompt = textPrompt;
        break;
    }

    const { output } = await prompt(input);
    
    if (!output || !output.items) {
        return { items: [] };
    }

    // Post-process to refine expiration dates using our internal data
    const processedItems = output.items.map(item => {
        const { shelfLifeDays } = getImpact(item.name);
        const expirationDate = addDays(new Date(), shelfLifeDays);
        return {
            ...item,
            // AI gives a good estimate, but we can override with our DB for consistency
            estimatedExpirationDate: formatISO(expirationDate, { representation: 'date' }),
        };
    });

    return { items: processedItems };
  }
);
