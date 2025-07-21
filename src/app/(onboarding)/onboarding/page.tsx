
"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { languages, translations } from "@/lib/translations";
import type { LanguageCode } from "@/lib/translations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SignupForm } from "@/components/signup-form";
import { DynamicAdviceStepper } from "@/components/dynamic-advice-stepper";

type OnboardingStep = "language" | "signup" | "advice";

export default function OnboardingPage() {
  const [step, setStep] = useState<OnboardingStep>("language");
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [isSignedUp, setIsSignedUp] = useState(false);

  const T = translations[language];

  const handleLanguageSelect = (langCode: string) => {
    setLanguage(langCode as LanguageCode);
    localStorage.setItem("finsarthi_language", langCode);
  };
  
  const handleSignupSuccess = () => {
    setIsSignedUp(true);
    setStep("advice");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <div className="space-y-1 text-center">
        <h1 className="text-2xl font-headline font-bold md:text-3xl">Let's Get to Know You</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Answer a few questions to receive AI-powered financial guidance tailored to your goals. 
          This will help us create your personalized financial plan.
        </p>
      </div>

      {step === "language" && (
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
      )}
      
      {step === "signup" && <SignupForm onSignupSuccess={handleSignupSuccess} />}
      
      {step === "advice" && <DynamicAdviceStepper onComplete={() => {}} isLoggedIn={isSignedUp} />}

    </div>
  );
}
