
"use client";

import { TranslatorForm } from "@/components/translator-form";
import { useAppTranslations } from "@/providers/translations-provider";

export default function TranslatorPage() {
  const { t } = useAppTranslations();
  return (
    <div className="space-y-4">
       <div className="space-y-1">
        <h1 className="text-2xl font-headline font-bold md:text-3xl">{t.translator.title}</h1>
        <p className="text-muted-foreground">
          {t.translator.description}
        </p>
      </div>
      <div className="mt-6">
        <TranslatorForm />
      </div>
    </div>
  );
}
