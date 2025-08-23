
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { v4 as uuidv4 } from 'uuid';
import { adminStorage } from '@/lib/firebase-admin'; // Use the new centralized admin storage

const GenerateFoodImageInputSchema = z.object({
  recipeName: z.string().describe('The name of the recipe.'),
});
const GenerateFoodImageOutputSchema = z.object({
  imageUrl: z
    .string()
    .describe('URL or data URI of the generated image.'),
});

export type GenerateFoodImageInput = z.infer<typeof GenerateFoodImageInputSchema>;
export type GenerateFoodImageOutput = z.infer<
  typeof GenerateFoodImageOutputSchema
>;

export async function generateFoodImage(
  input: GenerateFoodImageInput
): Promise<GenerateFoodImageOutput> {
  return generateFoodImageFlow(input);
}

const generateFoodImageFlow = ai.defineFlow(
  {
    name: 'generateFoodImageFlow',
    inputSchema: GenerateFoodImageInputSchema,
    outputSchema: GenerateFoodImageOutputSchema,
  },
  async ({ recipeName }) => {
    console.log(`[generateFoodImageFlow] Starting image generation for: ${recipeName}`);
    
    try {
        // 1. Generate the image using the AI model
        const { media } = await ai.generate({
          model: 'googleai/imagen-4.0-fast-generate-001',
          prompt: `High-resolution, hyper-realistic food photograph of ${recipeName}. 
Styled as if for a modern professional cookbook series: consistent look across all dishes. 
Always presented on a simple round white ceramic plate, centered in the frame. 
Shot from a consistent 45-degree angle, medium distance, with the entire plate visible. 
Background is a clean light-gray tabletop with soft natural lighting, minimal shadows, and no clutter. 
No props, no utensils, no drinks — just the dish on the plate. 
Cookbook-quality with uniform angle, plate, background, lighting, and framing for every image.`,
          config: { responseModalities: ['TEXT', 'IMAGE'] },
        });

        console.log('[generateFoodImageFlow] AI response received.');

        if (!media?.url) {
          throw new Error('Failed to generate image data: AI response did not contain media URL.');
        }

        console.log('[generateFoodImageFlow] Media URL (data URI) is present. Skipping upload and returning directly.');

        // 2. Return the data URI directly to the client for immediate display
        return { imageUrl: media.url };

    } catch (error) {
        console.error('[generateFoodImageFlow] An error occurred during the flow:', error);
        // Re-throw the original error to be caught by the caller
        throw new Error(`Error generating image for ${recipeName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);
