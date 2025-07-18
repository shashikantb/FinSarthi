"use client";

import { useState } from "react";
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

const formSchema = z.object({
  term: z.string().min(2, "Term must be at least 2 characters."),
  language: z.enum(["English", "Hindi", "Marathi"]),
  userLiteracyLevel: z.enum(["beginner", "intermediate", "advanced"]),
});

type FormValues = z.infer<typeof formSchema>;

export function TranslatorForm() {
  const [explanation, setExplanation] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      term: "Quantitative Easing",
      language: "English",
      userLiteracyLevel: "beginner",
    },
  });

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
          <CardTitle>Financial Term</CardTitle>
          <CardDescription>
            Enter a term you want explained in simple language.
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
                    <FormLabel>Term/Concept</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Inflation, ETF" {...field} />
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
                      <FormLabel>My Understanding</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
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
                      <FormLabel>Language</FormLabel>
                      <Select
                        onValueChange={field.onChange}
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
                    Translating...
                  </>
                ) : (
                   <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Explain Term
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Simplified Explanation</CardTitle>
          <CardDescription>
            Here is the term explained in a way that's easy to understand.
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
          {!isLoading && !error && !explanation && <p>Your explanation will appear here.</p>}
          {explanation && <p>{explanation}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
