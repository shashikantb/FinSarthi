
"use client";

import { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  translateFinancialTerms,
  type TranslateFinancialTermsInput,
} from "@/ai/flows/translate-financial-terms";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Wand2 } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { useAppTranslations } from "@/providers/translations-provider";
import { languages } from "@/lib/translations";

const formSchema = z.object({
  term: z.string().min(2, "Term must be at least 2 characters."),
  language: z.enum(["English", "Hindi", "Marathi", "German"]),
  userLiteracyLevel: z.enum(["beginner", "intermediate", "advanced"]),
});

type FormValues = z.infer<typeof formSchema>;

export function TranslatorForm() {
  const [explanation, setExplanation] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const { t, languageCode } = useAppTranslations();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      term: "Quantitative Easing",
      language: "English",
      userLiteracyLevel: "beginner",
    },
  });

  useEffect(() => {
    const langName = languages[languageCode as keyof typeof languages]?.name;
    if(langName) {
        form.setValue("language", langName as "English" | "Hindi" | "Marathi" | "German");
    }
  }, [languageCode, form]);


  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setExplanation("");
    setError("");
    try {
      const result = await translateFinancialTerms(data as TranslateFinancialTermsInput);
      setExplanation(result.simplifiedExplanation);
    } catch (e) {
      setError("Failed to generate explanation. Please try again.");
      console.error(e);
    }
    setIsLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t.translator.card_title}</CardTitle>
          <CardDescription>
            {t.translator.card_description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="term"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.translator.term_label}</FormLabel>
                    <FormControl>
                      <Input placeholder={t.translator.term_placeholder} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                  control={form.control}
                  name="userLiteracyLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.translator.understanding_label}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t.translator.understanding_placeholder} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">{t.translator.level_beginner}</SelectItem>
                          <SelectItem value="intermediate">{t.translator.level_intermediate}</SelectItem>
                          <SelectItem value="advanced">{t.translator.level_advanced}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.translator.language_label}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t.translator.language_placeholder} />
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
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.translator.translating_button}
                  </>
                ) : (
                   <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    {t.translator.explain_button}
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t.translator.explanation_card_title}</CardTitle>
          <CardDescription>
            {t.translator.explanation_card_description}
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
          {!isLoading && !error && !explanation && <p>{t.translator.explanation_placeholder}</p>}
          {explanation && <p>{explanation}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
