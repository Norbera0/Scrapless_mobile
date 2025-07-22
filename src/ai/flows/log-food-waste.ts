'use server';

/**
 * @fileOverview This file defines a Genkit flow for logging food waste using AI from a photo.
 *
 * - logFoodWaste - The main function to initiate the food waste logging process.
 * - LogFoodWasteInput - The input type for the logFoodWaste function, including a photo of the waste.
 * - LogFoodWasteOutput - The output type, providing a list of detected food items and their estimated amounts.
 */

import {ai} from '@/ai/genkit';
import { LogFoodWasteInputSchema, LogFoodWasteOutputSchema, type LogFoodWasteInput, type LogFoodWasteOutput } from '@/ai/schemas';


export async function logFoodWaste(input: LogFoodWasteInput): Promise<LogFoodWasteOutput> {
  return logFoodWasteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'logFoodWastePrompt',
  input: {schema: LogFoodWasteInputSchema},
  output: {schema: LogFoodWasteOutputSchema},
  prompt: `You are an AI assistant that analyzes images of wasted food to identify the food items and estimate their amounts.

  Analyze the following photo and provide a list of the food items you detect, along with an estimated amount for each item.  Be as specific as possible.

  Photo: {{media url=photoDataUri}}
  `,
});

const logFoodWasteFlow = ai.defineFlow(
  {
    name: 'logFoodWasteFlow',
    inputSchema: LogFoodWasteInputSchema,
    outputSchema: LogFoodWasteOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
