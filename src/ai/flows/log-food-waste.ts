'use server';

/**
 * @fileOverview This file defines a Genkit flow for logging food waste using AI.
 *
 * - logFoodWaste - The main function to initiate the food waste logging process.
 * - LogFoodWasteInput - The input type for the logFoodWaste function, including a photo of the waste.
 * - LogFoodWasteOutput - The output type, providing a list of detected food items and their estimated amounts.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LogFoodWasteInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A photo of the wasted food, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' 
    ),
});
export type LogFoodWasteInput = z.infer<typeof LogFoodWasteInputSchema>;

const LogFoodWasteOutputSchema = z.object({
  items: z.array(
    z.object({
      name: z.string().describe('The name of the food item.'),
      estimatedAmount: z
        .string()
        .describe('The estimated amount of the food item (e.g., 1/2 cup, 1 slice).'),
    })
  ).describe('A list of detected food items and their estimated amounts.'),
});
export type LogFoodWasteOutput = z.infer<typeof LogFoodWasteOutputSchema>;

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

