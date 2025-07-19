
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
import { textToSpeech } from "@/ai/flows/text-to-speech";
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
import { Skeleton } from "./ui/skeleton";
import Link from "next/link";
import { cn } from "@/lib/utils";
import React from 'react';
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";

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
      "येथे तुमच्यासाठी तयार केलेला AI-शक्तीवर आधारित आर्थिक सल्ला आहे. तुमची प्रगती जतन કરવા आणि ટ્રॅक करण्यासाठी साइन अप करा.",
    yourAdviceHere: "तुमचा सल्ला येथे दिसेल.",
    error: "सल्ला तयार करण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा.",
    saveAndContinue: "जतन करा आणि पुढे जा",
    createAnAccount: "खाते तयार करा",
  },
};

const formSchema = z.object({
  language: z.enum(["en", "hi", "mr"]),
  income: z.coerce.number().positive({ message: "Income must be positive." }),
  expenses: z.coerce.number().positive({ message: "Expenses must be positive." }),
  financialGoals: z
    .string()
    .min(10, "Please describe your goals in more detail."),
  literacyLevel: z.enum(["beginner", "intermediate", "advanced"]),
});

type FormValues = z.infer<typeof formSchema>;
type Language = keyof typeof translations;

function AudioPlayer({ audioUrl }: { audioUrl?: string }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = React.useRef<HTMLAudioElement>(null);
  
    if (!audioUrl) return null;
  
    const togglePlay = () => {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          audioRef.current.play();
        }
      }
    };
  
    return (
      <div className="inline-flex items-center">
        <audio
          ref={audioRef}
          src={audioUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />
        <Button variant="ghost" size="icon" onClick={togglePlay} className="h-7 w-7">
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
  const [adviceAudioUrl, setAdviceAudioUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      language: "en",
      income: '' as any,
      expenses: '' as any,
      financialGoals: "",
      literacyLevel: "beginner",
    },
  });

  const { trigger, setValue } = form;
  const selectedLanguage = form.watch("language") as Language;
  const T = translations[selectedLanguage];
  const TOTAL_STEPS = 5;

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    onTranscript: (text) => {
      const field = step === 2 ? 'income' : step === 3 ? 'expenses' : 'financialGoals';
      if (step > 1 && step < 5) {
        setValue(field, text, { shouldValidate: true });
      }
    }
  });
  
  useEffect(() => {
    startListening({lang: selectedLanguage});
    return () => stopListening();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);


  const playQuestionAudio = async (text: string) => {
    try {
        const { audio } = await textToSpeech({ text });
        if (audio) {
          const audioBlob = await (await fetch(audio)).blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const audioEl = new Audio(audioUrl);
          audioEl.play();
        }
      } catch (e) {
        console.error("Failed to play audio:", e);
      }
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setAdvice("");
    setError("");
    try {
      const result = await generatePersonalizedAdvice(
        data as GeneratePersonalizedAdviceInput
      );
      setAdvice(result.advice);

      const ttsResult = await textToSpeech({ text: result.advice });
      setAdviceAudioUrl(ttsResult.audio);

      setStep(TOTAL_STEPS + 1); // Move to results step
    } catch (e) {
      setError(T.error);
      console.error(e);
    }
    setIsLoading(false);
  };

  const nextStep = async () => {
    let isValid = false;
    if (step === 2) {
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

  if (step === TOTAL_STEPS + 1) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{T.adviceResultTitle}</CardTitle>
          <CardDescription>{T.adviceResultDescription}</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap font-body">
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          )}
          {error && <p className="text-destructive">{error}</p>}
          {!isLoading && !error && !advice && <p>{T.yourAdviceHere}</p>}
          {advice && (
            <div className="flex items-center gap-2">
                <p>{advice}</p>
                <AudioPlayer audioUrl={adviceAudioUrl} />
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                            field.onChange(value)
                            startListening({lang: value})
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
                          <Button variant="ghost" size="icon" type="button" className="h-6 w-6 ml-2" onClick={() => playQuestionAudio(T.monthlyIncome)}>
                              <Volume2 className="h-4 w-4"/>
                          </Button>
                      </FormLabel>
                      <FormControl>
                          <div className="relative">
                              <Input type="number" placeholder="e.g., 5000" {...field} />
                              <Button variant="ghost" size="icon" type="button" onClick={() => isListening ? stopListening() : startListening({lang: selectedLanguage})} className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                                  {isListening ? <MicOff className="h-4 w-4 text-primary"/> : <Mic className="h-4 w-4"/>}
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
                          <Button variant="ghost" size="icon" type="button" className="h-6 w-6 ml-2" onClick={() => playQuestionAudio(T.monthlyExpenses)}>
                              <Volume2 className="h-4 w-4"/>
                          </Button>
                      </FormLabel>
                      <FormControl>
                          <div className="relative">
                              <Input type="number" placeholder="e.g., 3000" {...field} />
                              <Button variant="ghost" size="icon" type="button" onClick={() => isListening ? stopListening() : startListening({lang: selectedLanguage})} className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                                  {isListening ? <MicOff className="h-4 w-4 text-primary"/> : <Mic className="h-4 w-4"/>}
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
                          <Button variant="ghost" size="icon" type="button" className="h-6 w-6 ml-2" onClick={() => playQuestionAudio(T.financialGoals)}>
                              <Volume2 className="h-4 w-4"/>
                          </Button>
                      </FormLabel>
                      <FormControl>
                      <div className="relative">
                          <Textarea
                              placeholder="e.g., Save for a house, invest in stocks..."
                              className="resize-none pr-10"
                              {...field}
                          />
                          <Button variant="ghost" size="icon" type="button" onClick={() => isListening ? stopListening() : startListening({lang: selectedLanguage})} className="absolute right-1 top-2 h-8 w-8">
                               {isListening ? <MicOff className="h-4 w-4 text-primary"/> : <Mic className="h-4 w-4"/>}
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
                            <Button variant="ghost" size="icon" type="button" className="h-6 w-6 ml-2" onClick={() => playQuestionAudio(T.literacy)}>
                              <Volume2 className="h-4 w-4"/>
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
                          <SelectItem value="intermediate">{T.intermediate}</SelectItem>
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
              {step > 1 && (
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> {T.back}
                </Button>
              )}
              <div className={cn(step === 1 ? 'w-full' : 'ml-auto')}>
                {step < TOTAL_STEPS ? (
                  <Button type="button" onClick={nextStep}>
                    {T.next} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
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
                )}
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

    