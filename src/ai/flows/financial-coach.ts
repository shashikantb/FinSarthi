
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
import { findFinancialProducts } from '../tools/financial-products-tool';

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

const FinancialCoachInputSchema = z.object({
  query: z.string().describe('The user\'s question or message to the financial coach.'),
  language: z
    .enum(['English', 'Hindi', 'Marathi'])
    .describe('The language for the conversation.'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).optional().describe('The conversation history.'),
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
        const systemPrompt = `You are FinSarthi, an expert financial coach. Your goal is to provide clear, simple, and personalized financial advice.
You are an expert on topics like budgeting, saving, investing, and loans.
The user is conversing with you in ${input.language}. Your response MUST be in the same language.

If the user asks for product recommendations (e.g., "which mutual fund..."), you MUST use the 'findFinancialProducts' tool to get a list of suitable product examples. Integrate these product suggestions naturally into your advice. DO NOT make up product names.

Converse with the user based on their query and the history of the conversation provided.
Be friendly, empathetic, and encouraging.`;

        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemPrompt },
            ...(input.history || []).map(h => ({ role: h.role, content: h.content })),
            { role: 'user', content: input.query }
        ];

        const completion = await groq.chat.completions.create({
            messages,
            model: 'llama3-8b-8192',
            temperature: 0.7,
            max_tokens: 1024,
            // @ts-ignore - Genkit tools are compatible
            tools: [{ type: 'function', function: findFinancialProducts.definition }],
            tool_choice: 'auto',
        });

        const message = completion.choices[0].message;

        if (message.tool_calls) {
            const toolCall = message.tool_calls[0];
            const toolName = toolCall.function.name;

            if (toolName === 'findFinancialProducts') {
                const toolInput = JSON.parse(toolCall.function.arguments);
                const toolResult = await findFinancialProducts(toolInput);

                messages.push(message);
                messages.push({
                    tool_call_id: toolCall.id,
                    role: 'tool',
                    name: toolName,
                    content: JSON.stringify(toolResult),
                });
                
                const secondCompletion = await groq.chat.completions.create({
                    messages,
                    model: 'llama3-8b-8192',
                });

                const finalResponse = secondCompletion.choices[0].message.content;
                 if (!finalResponse) {
                    return { response: "I'm sorry, I couldn't generate a response after looking up products. Please try again." };
                }
                return { response: finalResponse };
            }
        }
        
        const responseText = message.content;
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
