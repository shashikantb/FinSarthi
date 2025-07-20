
// src/components/onboarding-stepper.tsx
"use client";

import { useState, useEffect } from "react";
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
import {
  Loader2,
  Wand2,
  ArrowRight,
  ArrowLeft,
  Mic,
  Volume2,
  Play,
  MicOff,
  X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import React from "react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { Progress } from "@/components/ui/progress";
import { useBrowserTts } from "@/hooks/use-browser-tts";
import { useRouter } from "next/navigation";
import { translations, languages } from "@/lib/translations";
import type { AdviceRecord } from "@/app/(main)/advice/page";

const formSchema = z.object({
  language: z.enum(["en", "hi", "mr"], {
    required_error: "Please select a language.",
  }),
  income: z.coerce.number().positive({ message: "Income must be positive." }),
  expenses: z.coerce.number().positive({ message: "Expenses must be positive." }),
  financialGoals: z
    .string()
    .min(10, "Please describe your goals in more detail."),
  literacyLevel: z.enum(["beginner", "intermediate", "advanced"]),
});

export type FormValues = z.infer<typeof formSchema>;
type LanguageCode = keyof typeof translations;

function AudioPlayer({ text, lang }: { text?: string; lang: string }) {
  const { speak, isPlaying } = useBrowserTts();
  if (!text) return null;

  return (
    <div className="inline-flex items-center">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => speak(text, lang)}
        className="h-7 w-7"
      >
        {isPlaying ? (
          <Volume2 className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        <span className="sr-only">Play audio</span>
      </Button>
    </div>
  );
}

interface OnboardingStepperProps {
    onComplete?: (newAdvice: AdviceRecord) => void;
    onCancel?: () => void;
}

export function OnboardingStepper({ onComplete, onCancel }: OnboardingStepperProps) {
  const [step, setStep] = useState(1);
  const [advice, setAdvice] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  const { speak: playQuestionAudio } = useBrowserTts();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      language: "en",
      income: "" as any,
      expenses: "" as any,
      financialGoals: "",
      literacyLevel: "beginner",
    },
  });

  const { trigger, setValue, getValues, handleSubmit, formState, watch } = form;
  const selectedLanguage = watch("language") as LanguageCode;
  const T = translations[selectedLanguage] || translations.en;
  const TOTAL_STEPS = 5;

  // Set initial language from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem("finsarthi_language") as LanguageCode | null;
    if (savedLang) {
      setValue("language", savedLang);
    }
  }, [setValue]);

  // Update localStorage when language changes
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "language" && value.language) {
        localStorage.setItem("finsarthi_language", value.language);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const { isListening, startListening, stopListening } =
    useSpeechRecognition({
      onTranscript: (text) => {
        const field =
          step === 2
            ? "income"
            : step === 3
            ? "expenses"
            : "financialGoals";
        if (step > 1 && step < 5) {
          setValue(field, text, { shouldValidate: true });
        }
      },
    });

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 5;
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setProgress(0);
    setAdvice("");
    setError("");
    try {
      const result = await generatePersonalizedAdvice(
        data as GeneratePersonalizedAdviceInput
      );
      setAdvice(result.advice);
      
      const newRecord: AdviceRecord = {
        id: crypto.randomUUID(),
        ...data,
        advice: result.advice,
        timestamp: new Date().toISOString(),
      };

      if(onComplete) {
        onComplete(newRecord);
      } else {
        // Fallback for standalone usage (e.g. /onboarding page)
        const history = JSON.parse(localStorage.getItem("finsarthi_advice_history") || "[]");
        const updatedHistory = [newRecord, ...history];
        localStorage.setItem("finsarthi_advice_history", JSON.stringify(updatedHistory));
        setProgress(100);
        setStep(TOTAL_STEPS + 1); // Move to results step
      }

    } catch (e) {
      setError(T.error);
      console.error(e);
    }
    setIsLoading(false);
  };

  const handleViewDashboard = () => {
    router.push('/dashboard');
  }

  const nextStep = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await trigger("language");
    } else if (step === 2) {
      isValid = await trigger("income");
    } else if (step === 3) {
      isValid = await trigger("expenses");
    } else if (step === 4) {
      isValid = await trigger("financialGoals");
    } else if (step === 5) {
      isValid = await trigger("literacyLevel");
    }

    if (isValid) {
      setStep((s) => s + 1);
    }
  };

  const prevStep = () => setStep((s) => s - 1);

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening({ lang: getValues("language") });
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{T.generatingAdviceTitle}</CardTitle>
          <CardDescription>{T.generatingAdviceDescription}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 pt-8 pb-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground">{T.generating}</p>
        </CardContent>
      </Card>
    );
  }

  if (step === TOTAL_STEPS + 1) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{T.adviceResultTitle}</CardTitle>
          <CardDescription>{T.adviceResultDescription}</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap font-body">
          {error && <p className="text-destructive">{error}</p>}
          {!isLoading && !error && !advice && <p>{T.yourAdviceHere}</p>}
          {advice && (
            <div className="flex items-start gap-2">
              <p>{advice}</p>
              <AudioPlayer text={advice} lang={selectedLanguage} />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-4">
          <Button onClick={handleViewDashboard}>
            {T.saveAndContinue}
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/signup">{T.createAnAccount}</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      {onCancel && (
          <CardHeader className="flex-row items-center justify-between">
              <div>
                  <CardTitle>Generate New Advice</CardTitle>
                  <CardDescription>Fill out the steps to get a new plan.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={onCancel}>
                  <X className="h-4 w-4" />
              </Button>
          </CardHeader>
      )}
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="min-h-[280px]">
              {step === 1 && (
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{T.language}</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            if (isListening) stopListening();
                            field.onChange(value);
                          }}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                             {Object.entries(languages).map(([code, lang]) => (
                                <SelectItem key={code} value={code}>{lang.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {step === 2 && (
                <FormField
                  control={form.control}
                  name="income"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        {T.monthlyIncome}
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          className="h-6 w-6 ml-2"
                          onClick={() =>
                            playQuestionAudio(T.monthlyIncome, selectedLanguage)
                          }
                        >
                          <Volume2 className="h-4 w-4" />
                        </Button>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="e.g., 5000"
                            {...field}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={handleMicClick}
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                          >
                            {isListening ? (
                              <MicOff className="h-4 w-4 text-primary" />
                            ) : (
                              <Mic className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {step === 3 && (
                <FormField
                  control={form.control}
                  name="expenses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        {T.monthlyExpenses}
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          className="h-6 w-6 ml-2"
                          onClick={() =>
                            playQuestionAudio(T.monthlyExpenses, selectedLanguage)
                          }
                        >
                          <Volume2 className="h-4 w-4" />
                        </Button>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="e.g., 3000"
                            {...field}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={handleMicClick}
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                          >
                            {isListening ? (
                              <MicOff className="h-4 w-4 text-primary" />
                            ) : (
                              <Mic className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {step === 4 && (
                <FormField
                  control={form.control}
                  name="financialGoals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        {T.financialGoals}
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          className="h-6 w-6 ml-2"
                          onClick={() =>
                            playQuestionAudio(T.financialGoals, selectedLanguage)
                          }
                        >
                          <Volume2 className="h-4 w-4" />
                        </Button>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Textarea
                            placeholder="e.g., Save for a house, invest in stocks..."
                            className="resize-none pr-10"
                            {...field}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={handleMicClick}
                            className="absolute right-1 top-2 h-8 w-8"
                          >
                            {isListening ? (
                              <MicOff className="h-4 w-4 text-primary" />
                            ) : (
                              <Mic className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {step === 5 && (
                <FormField
                  control={form.control}
                  name="literacyLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        {T.literacy}
                        <Button
                          variant="ghost"
                          size="icon"
                          type="button"
                          className="h-6 w-6 ml-2"
                          onClick={() =>
                            playQuestionAudio(T.literacy, selectedLanguage)
                          }
                        >
                          <Volume2 className="h-4 w-4" />
                        </Button>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={T.selectLevel} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">{T.beginner}</SelectItem>
                          <SelectItem value="intermediate">
                            {T.intermediate}
                          </SelectItem>
                          <SelectItem value="advanced">{T.advanced}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="flex justify-between">
              {step > 1 && step <= TOTAL_STEPS && (
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> {T.back}
                </Button>
              )}
              <div
                className={cn(step === 1 && !onCancel ? "w-full flex justify-end" : "ml-auto", onCancel && step === 1 && "w-full flex justify-end")}
              >
                {step < TOTAL_STEPS ? (
                  <Button type="button" onClick={nextStep}>
                    {T.next} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  step === TOTAL_STEPS && (
                    <Button type="submit" disabled={formState.isSubmitting}>
                      {formState.isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {T.generating}
                        </>
                      ) : (
                        <>
                          {T.generateAdvice}
                          <Wand2 className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )
                )}
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
