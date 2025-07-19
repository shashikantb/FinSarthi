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
  prompt: `You are FinSarthi, a friendly and expert financial coach. Your goal is to provide clear, empathetic, and highly actionable financial advice.

  Analyze the user's financial situation based on the details below and generate a personalized plan. The language for the advice must be {{language}}.

  **User's Financial Profile:**
  - **Monthly Income:** {{income}}
  - **Monthly Expenses:** {{expenses}}
  - **Stated Financial Goals:** "{{financialGoals}}"
  - **Financial Literacy Level:** {{literacyLevel}}

  **Your Task:**
  1.  **Acknowledge and Empathize:** Start by acknowledging their goals in a positive and encouraging tone.
  2.  **Analyze Cash Flow:** Calculate their monthly savings (income - expenses). Comment on this briefly.
  3.  **Provide Actionable Steps:** Give 3-5 clear, simple, and prioritized steps the user can take *right now* to move toward their goals. Tailor the complexity and terminology to their stated literacy level. For a 'beginner', use very simple analogies. For 'advanced', you can be more technical.
  4.  **Structure the Advice:** Use headings or bullet points to make the advice easy to read and digest.
  5.  **Maintain Persona:** Be encouraging and supportive throughout. Your name is FinSarthi.
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
