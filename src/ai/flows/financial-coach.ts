
'use server';

/**
 * @fileOverview A conversational financial coach AI agent using Groq.
 *
 * - financialCoach - A function that handles the financial coaching conversation.
 * - FinancialCoachInput - The input type for the financialCoach function.
 * - FinancialCoachOutput - The return type for the financialCoach function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import OpenAI from 'openai';
import { getProducts } from '@/services/financial-product-service';

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

const FinancialCoachInputSchema = z.object({
  language: z
    .enum(['English', 'Hindi', 'Marathi'])
    .describe('The language for the conversation.'),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).describe('The entire conversation history, including the latest user message.'),
});
export type FinancialCoachInput = z.infer<typeof FinancialCoachInputSchema>;

const FinancialCoachOutputSchema = z.object({
  response: z.string().describe('The coach\'s response to the user.'),
});
export type FinancialCoachOutput = z.infer<typeof FinancialCoachOutputSchema>;

export async function financialCoach(
  input: FinancialCoachInput
): Promise<FinancialCoachOutput> {
  return financialCoachFlow(input);
}

const financialCoachFlow = ai.defineFlow(
  {
    name: 'financialCoachFlow',
    inputSchema: FinancialCoachInputSchema,
    outputSchema: FinancialCoachOutputSchema,
  },
  async (input) => {
    try {
        const [savings, investments, loans] = await Promise.all([
            getProducts('savings'),
            getProducts('investment'),
            getProducts('loan'),
        ]);

        const productContext = `
        Here is a list of available financial products. When the user asks for recommendations, you should use these products.
        Savings Products: ${JSON.stringify(savings)}
        Investment Products: ${JSON.stringify(investments)}
        Loan Products: ${JSON.stringify(loans)}
        `;

        const systemPrompt = `You are FinSarthi, an expert financial coach. Your goal is to provide clear, simple, and personalized financial advice.
You are an expert on topics like budgeting, saving, investing, and loans.
The user is conversing with you in ${input.language}. Your response MUST be in the same language.

${productContext}

Converse with the user based on the history of the conversation provided.
Be friendly, empathetic, and encouraging. DO NOT make up product names; only use the ones provided above.`;
        
        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemPrompt },
            ...input.history,
        ];
        
        const completion = await groq.chat.completions.create({
            messages,
            model: 'llama3-8b-8192',
            temperature: 0.7,
            max_tokens: 1024,
        });

        const responseText = completion.choices[0].message.content;

        if (!responseText) {
            return { response: "I'm sorry, I couldn't generate a response. Please try again." };
        }
        return { response: responseText };

    } catch (error) {
      console.error("Error in financialCoachFlow:", error);
      return { response: "I'm sorry, there was an error processing your request." };
    }
  }
);
