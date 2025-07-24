
"use client";

import { useState, useMemo } from "react";
import { useForm, FormProvider, type SubmitHandler, Controller } from "react-hook-form";
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
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Wand2,
  ArrowRight,
  ArrowLeft,
  X,
  ChevronRight,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAppTranslations } from "@/providers/translations-provider";
import type { LanguageCode } from "@/lib/translations";
import type { AdviceSession } from "@/lib/db/schema";
import { createAdviceSessionForCurrentUser } from "@/services/advice-service";
import advicePrompts from "@/lib/advice-prompts.json";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface DynamicAdviceStepperProps {
    onComplete: (newAdvice: AdviceSession) => void;
    onCancel?: () => void;
    isLoggedIn?: boolean;
}

type FormValues = {
  [key: string]: string;
};

type Prompt = {
  key: string;
  title: Record<LanguageCode, string>;
  description?: Record<LanguageCode, string>;
  questions?: any[];
  systemPrompt?: Record<LanguageCode, string>;
  subPrompts?: Prompt[];
};

// Generate default values from the JSON config to prevent uncontrolled component errors
const getAllQuestions = (prompts: Prompt[]): any[] => {
    let questions: any[] = [];
    for (const prompt of prompts) {
        if (prompt.questions) {
            questions = questions.concat(prompt.questions);
        }
        if (prompt.subPrompts) {
            questions = questions.concat(getAllQuestions(prompt.subPrompts));
        }
    }
    return questions;
};
const allQuestionKeys = getAllQuestions(advicePrompts).map(q => q.key);
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
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [path, setPath] = useState<string[]>([]);
  const { t, languageCode } = useAppTranslations();
  const { user } = useAuth();
  
  const methods = useForm<FormValues>({ 
    mode: "onChange",
    defaultValues: defaultFormValues,
  });
  
  const { handleSubmit, trigger, formState } = methods;

  const { currentPrompts, selectedPrompt } = useMemo(() => {
    let current: Prompt[] = advicePrompts;
    let prompt: Prompt | undefined;
    for (const key of path) {
      prompt = current.find(p => p.key === key);
      if (prompt && prompt.subPrompts) {
        current = prompt.subPrompts;
      } else {
        break;
      }
    }
    return { currentPrompts: prompt?.subPrompts || advicePrompts, selectedPrompt: prompt };
  }, [path]);

  const questions = useMemo(() => selectedPrompt?.questions || [], [selectedPrompt]);
  const isSelectionPhase = !questions.length;
  const questionStep = step - path.length;

  const TOTAL_STEPS = path.length + questions.length;

  const handleSelectPrompt = (key: string) => {
    const newPath = [...path, key];
    const prompt = newPath.reduce((p, k) => p?.find(prompt => prompt.key === k)?.subPrompts || p, advicePrompts as (Prompt[] | undefined));
    if (prompt) { // It's a category
        setPath(newPath);
        setStep(step + 1);
    } else { // It's a final selection
        setPath(newPath);
        setStep(step + 1);
    }
  };

  const onSubmit: SubmitHandler<FormValues> = async (formData) => {
    setIsLoading(true);
    setProgress(0);
    setError("");
    if (!selectedPrompt) return;

    try {
      const relevantFormData = Object.entries(formData)
        .filter(([key, value]) => {
          const isKeyInCurrentPrompt = questions.some(q => q.key === key);
          return isKeyInCurrentPrompt && value !== '';
        })
        .reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {} as Record<string, string>);
      
      const newSession = await createAdviceSessionForCurrentUser({
          promptKey: selectedPrompt.key,
          formData: relevantFormData,
        }, 
        user, 
        languageCode, 
        isLoggedIn
      );
      
      setProgress(100);
      onComplete(newSession);
    } catch (e) {
      setError(t.onboarding.error);
      console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  const nextStep = async () => {
    const currentQuestionKey = questions[questionStep].key;
    const isValid = await trigger(currentQuestionKey);
    if (isValid) setStep(s => s + 1);
  };
  
  const goBack = () => {
    if (step > path.length) {
      setStep(step - 1);
    } else if (path.length > 0) {
      setPath(path.slice(0, -1));
      setStep(step - 1);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t.onboarding.generating_title}</CardTitle>
          <CardDescription>{t.onboarding.generating_desc}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 pt-8 pb-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground">{t.onboarding.generating}</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle>{onCancel ? t.advice.stepper_title : t.advice.stepper_onboarding_title}</CardTitle>
          <CardDescription>{onCancel ? t.advice.stepper_description : t.advice.stepper_onboarding_description}</CardDescription>
        </div>
        {onCancel && <Button variant="ghost" size="icon" onClick={onCancel}><X className="h-4 w-4" /></Button>}
      </CardHeader>
      <CardContent className="pt-6">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="min-h-[200px]">
              {isSelectionPhase ? (
                <div className="space-y-2">
                    {currentPrompts.map(p => (
                        <button key={p.key} type="button" onClick={() => handleSelectPrompt(p.key)} className="w-full text-left p-4 rounded-lg border hover:bg-muted transition-colors flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{p.title[languageCode]}</p>
                                {p.description && <p className="text-sm text-muted-foreground">{p.description[languageCode]}</p>}
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground"/>
                        </button>
                    ))}
                </div>
              ) : (
                 questions[questionStep] && <QuestionField key={questions[questionStep].key} question={questions[questionStep]} lang={languageCode} />
              )}
            </div>

            <div className="flex justify-between items-center pt-4">
              <span className="text-sm text-muted-foreground">
                { !isSelectionPhase && t.advice.step_of.replace('{current}', String(questionStep + 1)).replace('{total}', String(questions.length))}
              </span>
              <div className="flex gap-2">
                {step > 0 && (
                  <Button type="button" variant="outline" onClick={goBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> {t.common.back}
                  </Button>
                )}
                {!isSelectionPhase && (
                    questionStep < questions.length - 1 ? (
                    <Button type="button" onClick={nextStep}>
                        {t.common.next} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    ) : (
                    <Button type="submit" disabled={formState.isSubmitting || !formState.isValid}>
                        {formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                        {t.advice.generate_button}
                    </Button>
                    )
                )}
              </div>
            </div>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}


    
