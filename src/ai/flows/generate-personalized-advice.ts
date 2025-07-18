// src/ai/flows/generate-personalized-advice.ts
'use server';

/**
 * @fileOverview Generates personalized financial advice based on user inputs.
 *
 * - generatePersonalizedAdvice - A function that generates personalized financial advice.
 * - GeneratePersonalizedAdviceInput - The input type for the generatePersonalizedAdvice function.
 * - GeneratePersonalizedAdviceOutput - The return type for the generatePersonalizedAdvice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePersonalizedAdviceInputSchema = z.object({
  income: z.number().describe('Your monthly income.'),
  expenses: z.number().describe('Your monthly expenses.'),
  financialGoals: z.string().describe('Your financial goals, e.g., saving for retirement, buying a house.'),
  literacyLevel: z.enum(['beginner', 'intermediate', 'advanced']).describe('Your financial literacy level.'),
  language: z.enum(['en', 'hi', 'mr']).describe('The language for the advice (en - English, hi - Hindi, mr - Marathi).'),
});

export type GeneratePersonalizedAdviceInput = z.infer<typeof GeneratePersonalizedAdviceInputSchema>;

const GeneratePersonalizedAdviceOutputSchema = z.object({
  advice: z.string().describe('Personalized financial advice based on the input.'),
});

export type GeneratePersonalizedAdviceOutput = z.infer<typeof GeneratePersonalizedAdviceOutputSchema>;

export async function generatePersonalizedAdvice(input: GeneratePersonalizedAdviceInput): Promise<GeneratePersonalizedAdviceOutput> {
  return generatePersonalizedAdviceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePersonalizedAdvicePrompt',
  input: {schema: GeneratePersonalizedAdviceInputSchema},
  output: {schema: GeneratePersonalizedAdviceOutputSchema},
  prompt: `You are a financial advisor providing personalized advice.

  Provide financial advice based on the following information:

  Income: {{income}}
  Expenses: {{expenses}}
  Financial Goals: {{financialGoals}}
  Literacy Level: {{literacyLevel}}

  The advice should be in {{language}}.
  Use simple terms that are appropriate for the literacy level.
  Focus on actionable steps the user can take.
  The advice should be concise and easy to understand.
  `,
});

const generatePersonalizedAdviceFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedAdviceFlow',
    inputSchema: GeneratePersonalizedAdviceInputSchema,
    outputSchema: GeneratePersonalizedAdviceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
