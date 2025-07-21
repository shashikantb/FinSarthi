
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
import { languages, translations } from "@/lib/translations";
import type { LanguageCode } from "@/lib/translations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DynamicAdviceStepper } from "@/components/dynamic-advice-stepper";
import { createUser } from "@/services/user-service";
import { associateSessionWithUser, createAdviceSessionForCurrentUser } from "@/services/advice-service";
import type { AdviceSession, NewUser } from "@/lib/db/schema";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type OnboardingStep = "language" | "signup" | "advice";

const signupSchema = z.object({
  fullName: z.string().min(1, "Full name is required."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});
type SignupFormValues = z.infer<typeof signupSchema>;

function SignupStep({ onNext }: { onNext: () => void }) {
  const { formState: { isValid }, register, formState: { errors } } = useFormContext<SignupFormValues>();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Your Account</CardTitle>
        <CardDescription>Enter your information to get started.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
            <Label htmlFor="full-name">Full name</Label>
            <Input id="full-name" placeholder="Max Robinson" {...register("fullName")} />
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName?.message}</p>}
        </div>
        <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email?.message}</p>}
        </div>
        <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password?.message}</p>}
        </div>
      </CardContent>
      <CardFooter>
          <Button onClick={onNext} disabled={!isValid} className="ml-auto">Next</Button>
      </CardFooter>
    </Card>
  );
}


export default function OnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>("language");
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [adviceSession, setAdviceSession] = useState<AdviceSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();

  const methods = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: 'onChange'
  });

  const T = translations[language];

  const handleLanguageSelect = (langCode: string) => {
    setLanguage(langCode as LanguageCode);
    localStorage.setItem("finsarthi_language", langCode);
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
    
    try {
        const signupData = methods.getValues();
        const newUser = await createUser({
            fullName: signupData.fullName,
            email: signupData.email,
            passwordHash: signupData.password, // This is insecure, for prototype only
        });

        if (newUser) {
            await associateSessionWithUser(adviceSession.id, newUser.id);
            toast({ title: "Account Created!", description: "Welcome to FinSarthi!" });
            router.push("/dashboard");
        } else {
             throw new Error("User creation failed.");
        }

    } catch(error) {
        console.error("Onboarding completion failed:", error);
        toast({
            title: "An Error Occurred",
            description: "Could not complete the setup. The email might already be in use.",
            variant: "destructive"
        });
        setIsLoading(false);
    }
  }

  const renderStep = () => {
    switch(step) {
      case "language":
        return (
          <Card>
            <CardHeader>
              <CardTitle>{T.language}</CardTitle>
              <CardDescription>Please select your preferred language to continue.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Select onValueChange={handleLanguageSelect} defaultValue={language}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(languages).map(([code, lang]) => (
                    <SelectItem key={code} value={code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => setStep("signup")} className="self-end">
                {T.next}
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
                    <CardTitle>{T.adviceResultTitle}</CardTitle>
                    <CardDescription>Your plan is ready. Save it to create your account and access your dashboard.</CardDescription>
                </CardHeader>
                <CardContent className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap font-body">
                    {adviceSession.generatedAdvice}
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSaveAndFinish} disabled={isLoading} className="ml-auto">
                        {isLoading ? <Loader2 className="animate-spin" /> : "Save and Go to Dashboard"}
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
        <h1 className="text-2xl font-headline font-bold md:text-3xl">Welcome to FinSarthi</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Just a few steps to create your personalized financial plan and get started.
        </p>
      </div>
      <FormProvider {...methods}>
        {renderStep()}
      </FormProvider>
    </div>
  );
}
