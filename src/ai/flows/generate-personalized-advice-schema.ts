
import {z} from 'zod';

/**
 * @fileOverview Defines the Zod schema for the personalized advice output.
 * This is used for validation in the corresponding flow.
 */
export const GeneratePersonalizedAdviceOutputSchema = z.object({
  advice: z.string().describe('Personalized financial advice based on the input.'),
});
