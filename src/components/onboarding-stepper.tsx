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
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import React from "react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { Progress } from "@/components/ui/progress";
import { useBrowserTts } from "@/hooks/use-browser-tts";

const translations = {
  en: {
    language: "Language",
    monthlyIncome: "Monthly Income",
    monthlyExpenses: "Monthly Expenses",
    financialGoals: "Financial Goals",
    literacy: "Financial Literacy",
    selectLevel: "Select your level",
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    next: "Next",
    back: "Back",
    generateAdvice: "Generate Advice",
    generating: "Generating...",
    adviceResultTitle: "Your Personalized Advice",
    adviceResultDescription:
      "Here's AI-powered financial advice tailored just for you. Sign up to save and track your progress.",
    yourAdviceHere: "Your advice will appear here.",
    error: "Failed to generate advice. Please try again.",
    saveAndContinue: "Save and Continue",
    createAnAccount: "Create an Account",
    generatingAdviceTitle: "Crafting Your Plan",
    generatingAdviceDescription:
      "Our AI is analyzing your information to create a personalized financial plan. This might take a moment.",
  },
  hi: {
    language: "भाषा",
    monthlyIncome: "मासिक आय",
    monthlyExpenses: "मासिक खर्च",
    financialGoals: "वित्तीय लक्ष्य",
    literacy: "वित्तीय साक्षरता",
    selectLevel: "अपना स्तर चुनें",
    beginner: "शुरुआती",
    intermediate: "मध्यम",
    advanced: "उन्नत",
    next: "अगला",
    back: "वापस",
    generateAdvice: "सलाह उत्पन्न करें",
    generating: "उत्पन्न हो रहा है...",
    adviceResultTitle: "आपकी व्यक्तिगत सलाह",
    adviceResultDescription:
      "यह आपके लिए विशेष रूप से तैयार की गई AI-संचालित वित्तीय सलाह है। अपनी प्रगति को सहेजने और ट्रैक करने के लिए साइन अप करें।",
    yourAdviceHere: "आपकी सलाह यहां दिखाई देगी।",
    error: "सलाह उत्पन्न करने में विफल। कृपया पुन: प्रयास करें।",
    saveAndContinue: "सहेजें और जारी रखें",
    createAnAccount: "खाता बनाएं",
    generatingAdviceTitle: "आपकी योजना तैयार हो रही है",
    generatingAdviceDescription:
      "हमारा AI व्यक्तिगत वित्तीय योजना बनाने के लिए आपकी जानकारी का विश्लेषण कर रहा है। इसमें कुछ समय लग सकता है।",
  },
  mr: {
    language: "भाषा",
    monthlyIncome: "मासिक उत्पन्न",
    monthlyExpenses: "मासिक खर्च",
    financialGoals: "आर्थिक उद्दिष्ट्ये",
    literacy: "आर्थिक साक्षरता",
    selectLevel: "तुमची पातळी निवडा",
    beginner: "नवशिक्या",
    intermediate: "मध्यम",
    advanced: "प्रगत",
    next: "पुढे",
    back: "मागे",
    generateAdvice: "सल्ला मिळवा",
    generating: "तयार होत आहे...",
    adviceResultTitle: "तुमचा वैयक्तिक सल्ला",
    adviceResultDescription:
      "येथे तुमच्यासाठी तयार केलेला AI-शक्तीवर आधारित आर्थिक सल्ला आहे. तुमची प्रगती जतन करण्यासाठी आणि ट्रॅक करण्यासाठी साइन अप करा.",
    yourAdviceHere: "तुमचा सल्ला येथे दिसेल.",
    error: "सल्ला तयार करण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा.",
    saveAndContinue: "जतन करा आणि पुढे जा",
    createAnAccount: "खाते तयार करा",
    generatingAdviceTitle: "तुमची योजना तयार करत आहे",
    generatingAdviceDescription:
      "आमचे AI वैयक्तिक आर्थिक योजना तयार करण्यासाठी तुमच्या माहितीचे विश्लेषण करत आहे. यास थोडा वेळ लागू शकतो.",
  },
};

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

type FormValues = z.infer<typeof formSchema>;
type Language = keyof typeof translations;

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

export function OnboardingStepper() {
  const [step, setStep] = useState(1);
  const [advice, setAdvice] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [progress, setProgress] = useState(0);

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

  const { trigger, setValue, getValues, handleSubmit, formState } = form;
  const selectedLanguage = form.watch("language") as Language;
  const T = translations[selectedLanguage] || translations.en;
  const TOTAL_STEPS = 5;

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
      setProgress(100);
      setStep(TOTAL_STEPS + 1); // Move to results step
    } catch (e) {
      setError(T.error);
      console.error(e);
    }
    setIsLoading(false);
  };

  const handleGenerateAdvice = async () => {
    await handleSubmit(onSubmit)();
  };

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
    } else {
      isValid = true;
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
          <Button asChild>
            <Link href="/signup">{T.createAnAccount}</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/login">{T.saveAndContinue}</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full">
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
                className={cn(step === 1 ? "w-full flex justify-end" : "ml-auto")}
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
