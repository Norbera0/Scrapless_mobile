'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateFoodImageInputSchema = z.object({
  recipeName: z.string().describe('The name of the recipe.'),
});
const GenerateFoodImageOutputSchema = z.object({
  imageUrl: z.string().describe('URL of a generated photo.'),
});

export type GenerateFoodImageInput  = z.infer<typeof GenerateFoodImageInputSchema>;
export type GenerateFoodImageOutput = z.infer<typeof GenerateFoodImageOutputSchema>;

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
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `A delicious-looking photo of ${recipeName}, professionally shot for a cookbook, vibrant and appetizing.`,
      config: { responseModalities: ['TEXT', 'IMAGE'] },
    });
    if (!media?.url) throw new Error('Failed to generate image.');
    return { imageUrl: media.url };
  }
);
