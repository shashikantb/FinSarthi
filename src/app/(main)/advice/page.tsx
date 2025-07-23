
"use client";
import { useState, useEffect } from "react";
import { DynamicAdviceStepper } from "@/components/dynamic-advice-stepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { History, PlusCircle } from "lucide-react";
import { getAdviceHistoryForUser } from "@/services/advice-service";
import type { AdviceSession } from "@/lib/db/schema";
import advicePrompts from "@/lib/advice-prompts.json";
import { useAppTranslations } from "@/providers/translations-provider";
import type { LanguageCode } from "@/lib/translations";

export default function AdvicePage() {
  const [adviceHistory, setAdviceHistory] = useState<AdviceSession[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const { t, languageCode } = useAppTranslations();

  useEffect(() => {
    async function fetchHistory() {
      setIsLoadingHistory(true);
      try {
        const history = await getAdviceHistoryForUser();
        setAdviceHistory(history);
      } catch (error) {
        console.error("Failed to fetch advice history:", error);
      }
      setIsLoadingHistory(false);
    }
    fetchHistory();
  }, []);

  const handleNewAdvice = (newAdvice: AdviceSession) => {
    const promptConfig = advicePrompts.find(p => p.key === newAdvice.promptKey);
    const displayTitle = promptConfig?.title[languageCode] || newAdvice.promptKey;

    setAdviceHistory((prev) => [{ ...newAdvice, promptKey: displayTitle }, ...prev]);
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-2xl font-headline font-bold md:text-3xl">{t.advice.title}</h1>
          <p className="text-muted-foreground">
            {t.advice.description}
          </p>
        </div>
        {!isGenerating && (
          <Button onClick={() => setIsGenerating(true)}>
            <PlusCircle className="mr-2" />
            {t.common.generate_new_advice}
          </Button>
        )}
      </div>

      {isGenerating ? (
        <div className="mt-6 max-w-4xl mx-auto">
          <DynamicAdviceStepper onComplete={handleNewAdvice} onCancel={() => setIsGenerating(false)} isLoggedIn={true} />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t.advice.history_title}</CardTitle>
            <CardDescription>{t.advice.history_description}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <p>{t.advice.loading_history}</p>
            ) : adviceHistory.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {adviceHistory.map((record) => {
                  const promptConfig = advicePrompts.find(p => p.key === record.promptKey);
                  const displayTitle = promptConfig ? promptConfig.title[languageCode as keyof typeof promptConfig.title] : record.promptKey;
                  return (
                    <AccordionItem value={record.id} key={record.id}>
                      <AccordionTrigger>
                          <div className="flex justify-between w-full pr-4">
                              <span>{displayTitle}</span>
                              <span className="text-sm text-muted-foreground">{new Date(record.createdAt).toLocaleDateString()}</span>
                          </div>
                      </AccordionTrigger>
                      <AccordionContent className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap font-body pt-4">
                        <p>{record.generatedAdvice}</p>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            ) : (
              <div className="text-center py-10">
                <History className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{t.advice.no_history_title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t.advice.no_history_description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
