
"use client";

import { useState } from "react";
import { useForm, FormProvider, type SubmitHandler, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { allLanguages } from "@/lib/all-languages";
import { useAppTranslations } from "@/providers/translations-provider";
import type { LanguageCode } from "@/lib/translations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DynamicAdviceStepper } from "@/components/dynamic-advice-stepper";
import { createUser } from "@/services/user-service";
import { associateSessionWithUser } from "@/services/advice-service";
import type { AdviceSession, User } from "@/lib/db/schema";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type OnboardingStep = "language" | "signup" | "advice";

// Schema for this flow only includes customer fields.
const signupSchema = z.object({
  fullName: z.string().min(1, "Full name is required."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});
type SignupFormValues = z.infer<typeof signupSchema>;

function SignupStep({ onNext }: { onNext: () => void }) {
  const { formState: { isValid }, register, formState: { errors } } = useFormContext<SignupFormValues>();
  const { t } = useAppTranslations();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.onboarding.signup_title}</CardTitle>
        <CardDescription>{t.onboarding.signup_desc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
            <Label htmlFor="full-name">{t.onboarding.full_name}</Label>
            <Input id="full-name" placeholder="Max Robinson" {...register("fullName")} />
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName?.message}</p>}
        </div>
        <div className="grid gap-2">
            <Label htmlFor="email">{t.onboarding.email}</Label>
            <Input id="email" type="email" placeholder="m@example.com" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email?.message}</p>}
        </div>
        <div className="grid gap-2">
            <Label htmlFor="password">{t.onboarding.password}</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password?.message}</p>}
        </div>
      </CardContent>
      <CardFooter>
          <Button onClick={onNext} disabled={!isValid} className="ml-auto">{t.common.next}</Button>
      </CardFooter>
    </Card>
  );
}


export default function OnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>("language");
  const [adviceSession, setAdviceSession] = useState<AdviceSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { t, languageCode, setLanguage } = useAppTranslations();
  const { login } = useAuth();
  
  const methods = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange',
  });

  const handleLanguageContinue = () => {
    const selectedLanguage = methods.getValues("language" as any) || languageCode;
    setLanguage(selectedLanguage);
    if (selectedLanguage === languageCode) {
      setStep("signup");
    }
  };
  
  const handleAdviceComplete = (session: AdviceSession) => {
    setAdviceSession(session);
  };
  
  const handleSaveAndFinish = async () => {
    setIsLoading(true);
    if (!adviceSession) {
        toast({ title: "Error", description: "No advice session found to save.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    
    const signupData = methods.getValues();
    
    try {
        const newUser = await createUser({
            fullName: signupData.fullName,
            email: signupData.email,
            passwordHash: signupData.password, // This is insecure, for prototype only
            role: 'customer', // Onboarding is always for customers
        });

        if (!newUser) {
             throw new Error("User creation failed.");
        }
        
        await associateSessionWithUser(adviceSession.id, newUser.id);
        
        const loggedInUser = await login(signupData.email, signupData.password, 'customer');
        
        if (loggedInUser) {
            toast({ title: "Account Created!", description: "Welcome to FINmate!" });
            router.push("/coach");
        } else {
            throw new Error("Automatic login failed. Please log in manually.");
        }

    } catch(error: any) {
        console.error("Onboarding completion failed:", error);
        toast({
            title: "An Error Occurred",
            description: error.message || "Could not complete the setup. The email might already be in use.",
            variant: "destructive"
        });
        setIsLoading(false);
        // If login fails, send user to login page as a fallback
        if (error.message.includes("login failed")) {
            router.push('/login');
        }
    }
  }

  const renderStep = () => {
    switch(step) {
      case "language":
        return (
          <Card>
            <CardHeader>
              <CardTitle>{t.onboarding.language_title}</CardTitle>
              <CardDescription>{t.onboarding.language_desc}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Select onValueChange={(val) => methods.setValue("language" as any, val as LanguageCode)} defaultValue={languageCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  {allLanguages.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleLanguageContinue} className="self-end">
                {t.common.next}
              </Button>
            </CardContent>
          </Card>
        );
      case "signup":
        return <SignupStep onNext={() => setStep("advice")} />;
      case "advice":
        return adviceSession ? (
             <Card>
                <CardHeader>
                    <CardTitle>{t.onboarding.advice_result_title}</CardTitle>
                    <CardDescription>{t.onboarding.advice_result_desc}</CardDescription>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap font-body">
                    <p>{adviceSession.generatedAdvice}</p>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSaveAndFinish} disabled={isLoading} className="ml-auto">
                        {isLoading ? <Loader2 className="animate-spin" /> : t.onboarding.save_and_finish}
                    </Button>
                </CardFooter>
            </Card>
        ) : (
          <DynamicAdviceStepper onComplete={handleAdviceComplete} isLoggedIn={false} />
        );
      default:
        return null;
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <div className="space-y-1 text-center">
        <h1 className="text-2xl font-headline font-bold md:text-3xl">{t.onboarding.welcome}</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          {t.onboarding.intro}
        </p>
      </div>
      <FormProvider {...methods}>
        {renderStep()}
      </FormProvider>
    </div>
  );
}

    
