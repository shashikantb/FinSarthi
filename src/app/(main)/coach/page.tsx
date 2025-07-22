
"use client";

import { FinancialCoach } from "@/components/financial-coach";
import { useAppTranslations } from "@/hooks/use-app-translations";

export default function CoachPage() {
  const { t } = useAppTranslations();
  return (
    <div className="space-y-4">
       <div className="space-y-1">
        <h1 className="text-2xl font-headline font-bold md:text-3xl">{t.coach.title}</h1>
        <p className="text-muted-foreground">
          {t.coach.description}
        </p>
      </div>
      <div className="mt-6">
        <FinancialCoach />
      </div>
    </div>
  );
}
