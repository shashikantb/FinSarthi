
"use client";

import { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  summarizeFinancialNews,
  type SummarizeFinancialNewsInput,
} from "@/ai/flows/summarize-financial-news";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2 } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { useAppTranslations } from "@/providers/translations-provider";
import { languages } from "@/lib/translations";

const formSchema = z.object({
  articleContent: z.string().min(50, "Article content must be at least 50 characters."),
  language: z.enum(["English", "Hindi", "Marathi", "German"]),
});

type FormValues = z.infer<typeof formSchema>;

export function SummarizerForm() {
  const [summary, setSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const { t, languageCode } = useAppTranslations();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      articleContent: "",
      language: "English",
    },
  });

  useEffect(() => {
    const langName = languages[languageCode as keyof typeof languages]?.name;
    if (langName) {
      form.setValue("language", langName as "English" | "Hindi" | "Marathi" | "German");
    }
  }, [languageCode, form]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setSummary("");
    setError("");
    try {
      const result = await summarizeFinancialNews(data as SummarizeFinancialNewsInput);
      setSummary(result.summary);
    } catch (e) {
      setError("Failed to generate summary. Please try again.");
      console.error(e);
    }
    setIsLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t.summarizer.card_title}</CardTitle>
          <CardDescription>
            {t.summarizer.card_description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="articleContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.summarizer.article_content_label}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t.summarizer.article_content_placeholder}
                        className="resize-y min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.summarizer.language_label}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Hindi">Hindi</SelectItem>
                        <SelectItem value="Marathi">Marathi</SelectItem>
                        <SelectItem value="German">German</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.summarizer.summarizing_button}
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    {t.summarizer.summarize_button}
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t.summarizer.summary_card_title}</CardTitle>
          <CardDescription>
            {t.summarizer.summary_card_description}
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap font-body">
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          )}
          {error && <p className="text-destructive">{error}</p>}
          {!isLoading && !error && !summary && <p>{t.summarizer.summary_placeholder}</p>}
          {summary && <p>{summary}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
