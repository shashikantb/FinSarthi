
"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, FormProvider, type SubmitHandler, useFormContext, Controller } from "react-hook-form";
import {
  generatePersonalizedAdvice,
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
  X,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { translations } from "@/lib/translations";
import type { LanguageCode } from "@/lib/translations";
import type { AdviceSession } from "@/lib/db/schema";
import { createAdviceSessionForCurrentUser } from "@/services/advice-service";
import advicePrompts from "@/lib/advice-prompts.json";

interface DynamicAdviceStepperProps {
    onComplete: (newAdvice: AdviceSession) => void;
    onCancel?: () => void;
    isLoggedIn?: boolean;
}

type FormValues = {
  [key: string]: string;
};

// Generate default values from the JSON config to prevent uncontrolled component errors
const allQuestionKeys = advicePrompts.flatMap(p => p.questions.map(q => q.key));
const defaultFormValues = allQuestionKeys.reduce((acc, key) => {
    acc[key] = '';
    return acc;
}, {} as FormValues);

function QuestionField({ question, lang }: { question: any; lang: LanguageCode }) {
  const { control } = useFormContext();
  const label = question.label[lang] || question.label.en;
  const placeholder = question.placeholder ? (question.placeholder[lang] || question.placeholder.en) : "";

  return (
    <Controller
      name={question.key}
      control={control}
      rules={{ required: `${label} is required.` }}
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {question.type === 'textarea' ? (
              <Textarea placeholder={placeholder} {...field} />
            ) : (
              <Input type={question.type} placeholder={placeholder} {...field} />
            )}
          </FormControl>
          <FormMessage>{fieldState.error?.message}</FormMessage>
        </FormItem>
      )}
    />
  );
}

export function DynamicAdviceStepper({ onComplete, onCancel, isLoggedIn = false }: DynamicAdviceStepperProps) {
  const [step, setStep] = useState(0); // 0 is prompt selection
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [selectedPromptKey, setSelectedPromptKey] = useState<string>("");
  const [language, setLanguage] = useState<LanguageCode>("en");
  
  const methods = useForm<FormValues>({ 
    mode: "onChange",
    defaultValues: defaultFormValues, // Provide default values for all fields
  });
  
  const { handleSubmit, trigger, formState } = methods;

  useEffect(() => {
    const savedLang = localStorage.getItem("finsarthi_language") as LanguageCode | null;
    if (savedLang) setLanguage(savedLang);
  }, []);

  const T = translations[language];

  const selectedPrompt = useMemo(() => {
    return advicePrompts.find(p => p.key === selectedPromptKey);
  }, [selectedPromptKey]);

  const questions = selectedPrompt?.questions || [];
  const TOTAL_STEPS = questions.length + 1; // +1 for prompt selection

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setProgress((prev) => (prev >= 95 ? 95 : prev + 5));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const onSubmit: SubmitHandler<FormValues> = async (formData) => {
    setIsLoading(true);
    setProgress(0);
    setError("");
    try {
      // Filter out empty values from formData before sending to AI
      const relevantFormData = Object.entries(formData)
        .filter(([key, value]) => {
          const isKeyInCurrentPrompt = questions.some(q => q.key === key);
          return isKeyInCurrentPrompt && value !== '';
        })
        .reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {} as Record<string, string>);

      const adviceResult = await generatePersonalizedAdvice({
        promptKey: selectedPromptKey,
        formData: relevantFormData,
        language,
      });

      // When used in onboarding, this creates an anonymous session.
      // When used by a logged-in user, it associates with them.
      const newSession = await createAdviceSessionForCurrentUser({
        promptKey: selectedPromptKey,
        formData: relevantFormData,
        language,
        generatedAdvice: adviceResult.advice,
      }, isLoggedIn);
      
      setProgress(100);
      onComplete(newSession); // Pass the completed session up to the parent
    } catch (e) {
      setError(T.error);
      console.error(e);
      setIsLoading(false);
    }
  };

  const nextStep = async () => {
    let isValid = false;
    if (step === 0) {
      isValid = selectedPromptKey !== "";
      if (!isValid) alert("Please select a topic.");
    } else {
      const currentQuestionKey = questions[step - 1].key;
      isValid = await trigger(currentQuestionKey);
    }
    if (isValid) setStep(s => s + 1);
  };
  
  const prevStep = () => setStep(s => s - 1);

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
  
  return (
    <Card className="w-full">
      {onCancel ? (
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Generate New Advice</CardTitle>
            <CardDescription>Fill out the steps to get a new plan.</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}><X className="h-4 w-4" /></Button>
        </CardHeader>
      ) : (
        <CardHeader>
          <CardTitle>Get Your Financial Plan</CardTitle>
          <CardDescription>Select a topic and answer a few questions.</CardDescription>
        </CardHeader>
      )}
      <CardContent className="pt-6">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="min-h-[150px]">
              {step === 0 ? (
                <FormItem>
                  <FormLabel>What do you need advice on?</FormLabel>
                  <Select onValueChange={setSelectedPromptKey} value={selectedPromptKey}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a topic..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {advicePrompts.map(p => (
                        <SelectItem key={p.key} value={p.key}>{p.title[language]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              ) : (
                 questions[step - 1] && <QuestionField question={questions[step - 1]} lang={language} />
              )}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Step {step + 1} of {TOTAL_STEPS}</span>
              <div className="flex gap-2">
                {step > 0 && (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> {T.back}
                  </Button>
                )}
                {step < TOTAL_STEPS - 1 ? (
                  <Button type="button" onClick={nextStep}>
                    {T.next} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={formState.isSubmitting || !selectedPromptKey || !formState.isValid}>
                    {formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                    {T.generateAdvice}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}
