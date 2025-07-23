
'use server';

/**
 * @fileOverview Summarizes financial news articles in a chosen language using Groq.
 *
 * - summarizeFinancialNews - A function that summarizes financial news.
 * - SummarizeFinancialNewsInput - The input type for the summarizeFinancialNews function.
 * - SummarizeFinancialNewsOutput - The return type for the summarizeFinancialNews function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import OpenAI from 'openai';

const SummarizeFinancialNewsInputSchema = z.object({
  articleContent: z
    .string()
    .describe('The content of the financial news article to summarize.'),
  language: z
    .enum(['English', 'Hindi', 'Marathi', 'German'])
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

const summarizeFinancialNewsFlow = ai.defineFlow(
  {
    name: 'summarizeFinancialNewsFlow',
    inputSchema: SummarizeFinancialNewsInputSchema,
    outputSchema: SummarizeFinancialNewsOutputSchema,
  },
  async (input) => {
    if (!process.env.GROQ_API_KEY) {
      return { summary: "I'm sorry, the AI service is not configured. The GROQ_API_KEY is missing." };
    }

    const groq = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });
    
    try {
      const prompt = `You are an AI that summarizes financial news articles.

      Summarize the following article in the specified language. Your response MUST be ONLY a valid JSON object with a single key "summary". Do not add any other text, explanations, or markdown formatting.

      Article Content: """${input.articleContent}"""

      Language: ${input.language}
      `;

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-8b-8192',
        temperature: 0.2,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error("The AI model returned an empty response.");
      }
      
      console.log("AI Response for News Summary:", content);

      const output = SummarizeFinancialNewsOutputSchema.parse(JSON.parse(content));
      return output;
    } catch (error) {
      console.error("Error in summarizeFinancialNewsFlow:", error);
      return { summary: "Failed to generate summary." };
    }
  }
);
