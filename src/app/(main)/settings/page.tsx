
"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { allLanguages } from "@/lib/all-languages";
import { useAppTranslations } from "@/providers/translations-provider";

const settingsSchema = z.object({
  language: z.string(), // Allow any string, will be validated by the available languages
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const { t, languageCode, setLanguage } = useAppTranslations();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      language: languageCode,
    },
  });

  useEffect(() => {
    form.setValue("language", languageCode);
  }, [form, languageCode]);

  const onSubmit: SubmitHandler<SettingsFormValues> = (data) => {
    setLanguage(data.language as any);
    toast({
      title: t.settings.toast_title,
      description: t.settings.toast_description,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-headline font-bold md:text-3xl">{t.settings.title}</h1>
        <p className="text-muted-foreground">
          {t.settings.description}
        </p>
      </div>
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>{t.settings.language_title}</CardTitle>
              <CardDescription>
                {t.settings.language_description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem className="max-w-xs">
                    <FormLabel>{t.settings.language_label}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allLanguages.map((lang) => (
                            <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <Button type="submit">{t.common.save_changes}</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
