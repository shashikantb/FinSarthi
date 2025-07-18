// Summarize Financial News flow using Genkit and LLMs to provide summaries of financial articles in multiple languages.
'use server';

/**
 * @fileOverview Summarizes financial news articles in a chosen language.
 *
 * - summarizeFinancialNews - A function that summarizes financial news.
 * - SummarizeFinancialNewsInput - The input type for the summarizeFinancialNews function.
 * - SummarizeFinancialNewsOutput - The return type for the summarizeFinancialNews function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeFinancialNewsInputSchema = z.object({
  articleContent: z
    .string()
    .describe('The content of the financial news article to summarize.'),
  language: z
    .enum(['English', 'Hindi', 'Marathi'])
    .describe('The language in which to provide the summary.'),
});
export type SummarizeFinancialNewsInput = z.infer<
  typeof SummarizeFinancialNewsInputSchema
>;

const SummarizeFinancialNewsOutputSchema = z.object({
  summary: z.string().describe('The summarized financial news article.'),
});
export type SummarizeFinancialNewsOutput = z.infer<
  typeof SummarizeFinancialNewsOutputSchema
>;

export async function summarizeFinancialNews(
  input: SummarizeFinancialNewsInput
): Promise<SummarizeFinancialNewsOutput> {
  return summarizeFinancialNewsFlow(input);
}

const summarizeFinancialNewsPrompt = ai.definePrompt({
  name: 'summarizeFinancialNewsPrompt',
  input: {schema: SummarizeFinancialNewsInputSchema},
  output: {schema: SummarizeFinancialNewsOutputSchema},
  prompt: `You are an AI that summarizes financial news articles.

  Summarize the following article in the specified language:

  Article Content: {{{articleContent}}}

  Language: {{{language}}}
  `,
});

const summarizeFinancialNewsFlow = ai.defineFlow(
  {
    name: 'summarizeFinancialNewsFlow',
    inputSchema: SummarizeFinancialNewsInputSchema,
    outputSchema: SummarizeFinancialNewsOutputSchema,
  },
  async input => {
    const {output} = await summarizeFinancialNewsPrompt(input);
    return output!;
  }
);
