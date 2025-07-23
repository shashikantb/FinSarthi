
"use client";

import { SummarizerForm } from "@/components/summarizer-form";
import { useAppTranslations } from "@/providers/translations-provider";

export default function SummarizerPage() {
  const { t } = useAppTranslations();
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-headline font-bold md:text-3xl">{t.summarizer.title}</h1>
        <p className="text-muted-foreground">
          {t.summarizer.description}
        </p>
      </div>
       <div className="mt-6">
        <SummarizerForm />
      </div>
    </div>
  );
}
