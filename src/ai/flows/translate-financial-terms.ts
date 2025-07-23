
'use server';

/**
 * @fileOverview An AI agent for translating financial terms and concepts into simpler language using Groq.
 *
 * - translateFinancialTerms - A function that handles the translation process.
 * - TranslateFinancialTermsInput - The input type for the translateFinancialTerms function.
 * - TranslateFinancialTermsOutput - The return type for the translateFinancialTerms function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import OpenAI from 'openai';

const TranslateFinancialTermsInputSchema = z.object({
  term: z.string().describe('The financial term or concept to translate.'),
  language: z
    .string()
    .describe(
      'The target language for the translation (e.g., English, Hindi, Marathi, German).'
    ),
  userLiteracyLevel: z
    .enum(['beginner', 'intermediate', 'advanced'])
    .describe('The user literacy level to tailor the explanation.'),
});
export type TranslateFinancialTermsInput = z.infer<
  typeof TranslateFinancialTermsInputSchema
>;

const TranslateFinancialTermsOutputSchema = z.object({
  simplifiedExplanation: z
    .string()
    .describe('The simplified explanation of the financial term in the target language.'),
});
export type TranslateFinancialTermsOutput = z.infer<
  typeof TranslateFinancialTermsOutputSchema
>;

export async function translateFinancialTerms(
  input: TranslateFinancialTermsInput
): Promise<TranslateFinancialTermsOutput> {
  return translateFinancialTermsFlow(input);
}

const translateFinancialTermsFlow = ai.defineFlow(
  {
    name: 'translateFinancialTermsFlow',
    inputSchema: TranslateFinancialTermsInputSchema,
    outputSchema: TranslateFinancialTermsOutputSchema,
  },
  async (input) => {
    if (!process.env.GROQ_API_KEY) {
      return { simplifiedExplanation: "I'm sorry, the AI service is not configured. The GROQ_API_KEY is missing." };
    }

    const groq = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });

    try {
      const prompt = `You are a financial expert who can translate complex financial terms into easy-to-understand language.

      Term: "${input.term}"
      Language: ${input.language}
      Literacy Level: ${input.userLiteracyLevel}

      Please provide a simplified explanation of the term in the specified language, tailored to the user's literacy level.
      Your response should contain ONLY the explanation text. Do not add any other text, greetings, or markdown formatting.
      `;

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-8b-8192',
        temperature: 0.3,
        max_tokens: 1024,
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error("The AI model returned an empty response.");
      }

      console.log("AI Response for Term Translation:", content);
      
      return { simplifiedExplanation: content };
      
    } catch (error) {
      console.error("Error in translateFinancialTermsFlow:", error);
      return { simplifiedExplanation: "Failed to generate explanation." };
    }
  }
);
