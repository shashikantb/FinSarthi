'use server';

/**
 * @fileOverview A conversational financial coach AI agent.
 *
 * - financialCoach - A function that handles the financial coaching conversation.
 * - FinancialCoachInput - The input type for the financialCoach function.
 * - FinancialCoachOutput - The return type for the financialCoach function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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

const prompt = ai.definePrompt({
  name: 'financialCoachPrompt',
  input: {schema: FinancialCoachInputSchema},
  output: {schema: FinancialCoachOutputSchema},
  prompt: `You are FinSarthi, an expert financial coach. Your goal is to provide clear, simple, and personalized financial advice.
  You are an expert on topics like budgeting, saving, investing, and loans.
  The user is conversing with you in {{language}}. Make sure your response is in the same language.
  
  Converse with the user based on their query and the history of the conversation provided.
  Be friendly, empathetic, and encouraging.

  {{#if history}}
  Conversation History:
  {{#each history}}
    {{#if (eq this.role "user")}}User: {{this.content}}{{/if}}
    {{#if (eq this.role "model")}}FinSarthi: {{this.content}}{{/if}}
  {{/each}}
  {{/if}}

  User's latest message: {{{query}}}
  
  Your response:
  `,
  customize: (prompt, {input}) => {
    return {
      ...prompt,
      history: (input.history || []).map(message => ({
        ...message,
        isUser: message.role === 'user',
        isModel: message.role === 'model',
      })),
    };
  },
});

const financialCoachFlow = ai.defineFlow(
  {
    name: 'financialCoachFlow',
    inputSchema: FinancialCoachInputSchema,
    outputSchema: FinancialCoachOutputSchema,
  },
  async input => {
    // We need to re-map the history for the prompt context because the 'eq' helper is not standard.
    // A better approach is to use a structure Handlebars can work with easily.
    const historyForPrompt = (input.history || []).map(msg => ({
        role: msg.role,
        content: msg.content,
        isUser: msg.role === 'user',
        isModel: msg.role === 'model'
    }));

    const promptInput = { ...input, history: historyForPrompt };

    const {output} = await ai.generate({
        prompt: `You are FinSarthi, an expert financial coach. Your goal is to provide clear, simple, and personalized financial advice.
  You are an expert on topics like budgeting, saving, investing, and loans.
  The user is conversing with you in {{language}}. Make sure your response is in the same language.
  
  Converse with the user based on their query and the history of the conversation provided.
  Be friendly, empathetic, and encouraging.

  {{#if history}}
  Conversation History:
  {{#each history}}
    {{#if this.isUser}}User: {{this.content}}{{/if}}
    {{#if this.isModel}}FinSarthi: {{this.content}}{{/if}}
  {{/each}}
  {{/if}}

  User's latest message: {{{query}}}
  
  Your response:
  `,
        input: promptInput,
        output: { schema: FinancialCoachOutputSchema }
    });

    return { response: output!.response };
  }
);