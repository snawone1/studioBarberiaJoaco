'use server';
/**
 * @fileOverview An AI agent that provides style recommendations based on user input and considers available barbershop services.
 *
 * - getStyleRecommendationWithServices - A function that provides style recommendations considering barbershop services.
 * - StyleRecommendationWithServicesInput - The input type for the getStyleRecommendationWithServices function.
 * - StyleRecommendationWithServicesOutput - The return type for the getStyleRecommendationWithServices function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StyleRecommendationWithServicesInputSchema = z.object({
  hairType: z.string().describe('The user\'s hair type (e.g., curly, straight, wavy).'),
  faceShape: z.string().describe('The user\'s face shape (e.g., oval, square, round).'),
  preferences: z.string().describe('The user\'s style preferences and desired look.'),
});
export type StyleRecommendationWithServicesInput = z.infer<typeof StyleRecommendationWithServicesInputSchema>;

const StyleRecommendationWithServicesOutputSchema = z.object({
  styleRecommendation: z.string().describe('A detailed style recommendation based on the user input.'),
  relevantServices: z.array(z.string()).describe('A list of barbershop services that would be helpful in achieving the recommended style.'),
});
export type StyleRecommendationWithServicesOutput = z.infer<typeof StyleRecommendationWithServicesOutputSchema>;

export async function getStyleRecommendationWithServices(input: StyleRecommendationWithServicesInput): Promise<StyleRecommendationWithServicesOutput> {
  return styleRecommendationWithServicesFlow(input);
}

const barbershopServices = [
  'Haircut', 
  'Beard Trim',
  'Coloring', 
  'Highlights', 
  'Perm',
  'Straightening',
  'Scalp Treatment'
];

const checkServiceRelevanceTool = ai.defineTool({
  name: 'checkServiceRelevance',
  description: 'Determines whether a barbershop service is relevant to achieving a specific hairstyle or look.',
  inputSchema: z.object({
    styleRecommendation: z.string().describe('The style recommendation being made to the user.'),
    service: z.string().describe('A specific barbershop service to evaluate for relevance.'),
  }),
  outputSchema: z.boolean().describe('Whether the barbershop service is relevant to the style recommendation.'),
}, async (input) => {
  // Basic implementation - can be extended with more sophisticated logic.
  // This simple implementation checks if the service is mentioned in the style recommendation.
  return input.styleRecommendation.toLowerCase().includes(input.service.toLowerCase());
});

const styleRecommendationPrompt = ai.definePrompt({
  name: 'styleRecommendationPrompt',
  input: {schema: StyleRecommendationWithServicesInputSchema},
  output: {schema: StyleRecommendationWithServicesOutputSchema},
  tools: [checkServiceRelevanceTool],
  prompt: `You are a professional style advisor at a barbershop. Based on the user's hair type, face shape, and preferences, provide a style recommendation.

Hair Type: {{{hairType}}}
Face Shape: {{{faceShape}}}
Preferences: {{{preferences}}}

Consider if any of the following services available at the barbershop might be helpful in achieving this style:
${barbershopServices.join(', ')}

Use the checkServiceRelevance tool to determine if any of the barbershop's services would be helpful in achieving the recommended style. If a service is deemed relevant by the tool, mention it explicitly in the styleRecommendation output field.
`,
});

const styleRecommendationWithServicesFlow = ai.defineFlow(
  {
    name: 'styleRecommendationWithServicesFlow',
    inputSchema: StyleRecommendationWithServicesInputSchema,
    outputSchema: StyleRecommendationWithServicesOutputSchema,
  },
  async input => {
    const {output} = await styleRecommendationPrompt(input);
    return output!;
  }
);
