// NOTE: This component is used in two places: onboarding and the advice page.
// The form submission logic will likely need to be customized based on the context.
// For now, it just generates advice. In onboarding, it should probably lead to the next step.

"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  generatePersonalizedAdvice,
  type GeneratePersonalizedAdviceInput,
} from "@/ai/flows/generate-personalized-advice";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Wand2, ArrowRight } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { usePathname, useRouter } from "next/navigation";

const formSchema = z.object({
  income: z.coerce.number().positive({ message: "Income must be positive." }),
  expenses: z.coerce.number().positive({ message: "Expenses must be positive." }),
  financialGoals: z.string().min(10, "Please describe your goals in more detail."),
  literacyLevel: z.enum(["beginner", "intermediate", "advanced"]),
  language: z.enum(["en", "hi", "mr"]),
});

type FormValues = z.infer<typeof formSchema>;

export function AdviceForm() {
  const [advice, setAdvice] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  
  const pathname = usePathname();
  const router = useRouter();
  const isOnboarding = pathname.includes("/onboarding");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      income: 1000,
      expenses: 500,
      financialGoals: "Save for retirement and a down payment on a house.",
      literacyLevel: "beginner",
      language: "en",
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setAdvice("");
    setError("");
    try {
      // In a real app, you might want to save this data
      // and then redirect to the dashboard or a results page.
      if (isOnboarding) {
        // For onboarding, we'll just go to the dashboard for now.
        // A results page would be better.
        router.push("/dashboard");
        return;
      }
      
      const result = await generatePersonalizedAdvice(data as GeneratePersonalizedAdviceInput);
      setAdvice(result.advice);
    } catch (e) {
      setError("Failed to generate advice. Please try again.");
      console.error(e);
    }
    setIsLoading(false);
  };
  
  const FormFields = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="income"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly Income</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 5000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="expenses"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly Expenses</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 3000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="financialGoals"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Financial Goals</FormLabel>
            <FormControl>
              <Textarea
                placeholder="e.g., Save for a house, invest in stocks..."
                className="resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="literacyLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Financial Literacy</FormLabel>
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
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                  <SelectItem value="mr">Marathi</SelectItem>
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
            {isOnboarding ? 'Processing...' : 'Generating...'}
          </>
        ) : (
          <>
            {isOnboarding ? 'Complete Onboarding' : 'Generate Advice'}
            {isOnboarding ? <ArrowRight className="ml-2 h-4 w-4" /> : <Wand2 className="mr-2 h-4 w-4" />}
          </>
        )}
      </Button>
    </div>
  );


  if (isOnboarding) {
    return (
        <Card className="w-full">
             <CardContent className="pt-6">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        {FormFields}
                    </form>
                </Form>
             </CardContent>
        </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Your Financial Details</CardTitle>
          <CardDescription>
            Provide your financial information to get tailored advice.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {FormFields}
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Your Personalized Advice</CardTitle>
          <CardDescription>
            Here's AI-powered financial advice tailored just for you.
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
          {!isLoading && !error && !advice && <p>Your advice will appear here.</p>}
          {advice && <p>{advice}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
