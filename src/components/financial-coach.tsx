
"use client";

import { useState, useRef, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  financialCoach,
  type FinancialCoachInput,
} from "@/ai/flows/financial-coach";
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
import { Loader2, Send, Bot, User, Volume2, Play } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useBrowserTts } from "@/hooks/use-browser-tts";
import { languages, langToLocale } from "@/lib/translations";
import { createId } from "@paralleldrive/cuid2";
import { useAppTranslations } from "@/hooks/use-app-translations";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const formSchema = z.object({
  query: z.string().min(1, "Message cannot be empty."),
  language: z.enum(["English", "Hindi", "Marathi"]),
});

type FormValues = z.infer<typeof formSchema>;


function AudioPlayer({ message, language }: { message: Message, language: string }) {
  const { speak, isPlaying } = useBrowserTts();
  
  if (message.role !== "assistant") return null;

  const locale = langToLocale[language as keyof typeof langToLocale];

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => speak(message.content, locale)}
      className="h-7 w-7"
    >
      {isPlaying ? (
        <Volume2 className="h-4 w-4" />
      ) : (
        <Play className="h-4 w-4" />
      )}
      <span className="sr-only">Play audio</span>
    </Button>
  );
}

export function FinancialCoach() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { t, languageCode } = useAppTranslations();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: "",
      language: "English",
    },
  });

  const language = form.watch("language");

  useEffect(() => {
    // Sync the form's language with the global language from the hook
    const langName = languages[languageCode as keyof typeof languages]?.name;
    if (langName) {
      form.setValue("language", langName as "English" | "Hindi" | "Marathi");
    }
  }, [languageCode, form]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    const userMessage: Message = { role: 'user', content: data.query, id: createId() };
    const historyForAI = [...messages.map(m => ({role: m.role, content: m.content})), {role: userMessage.role, content: userMessage.content}];

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError('');
    form.reset({ query: '', language: data.language });
  
    try {
      const input: FinancialCoachInput = {
        language: data.language,
        history: historyForAI,
      };
      
      const result = await financialCoach(input);
  
      if (!result || !result.response) {
        throw new Error("AI returned an invalid response.");
      }
      
      const modelMessage: Message = {
        role: 'assistant',
        content: result.response,
        id: createId(),
      };
      
      setMessages(currentMessages => [...currentMessages, modelMessage]);
  
    } catch (e: any) {
      console.error("An error occurred during the chat flow:", e);
      setError(`Failed to get response. ${e.message || ''}`.trim());
      setMessages(currentMessages => currentMessages.filter(m => m.id !== userMessage.id)); 
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t.coach.chat_title}</CardTitle>
        <CardDescription>
          {t.coach.chat_description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-start gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-xs rounded-lg p-3 text-sm md:max-w-md",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.role === "assistant" && <AudioPlayer message={message} language={language} />}
                  </div>
                </div>
                {message.role === "user" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 justify-start">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="max-w-xs rounded-lg p-3 text-sm md:max-w-md bg-muted">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>
            )}
            {error && <p className="text-destructive text-center">{error}</p>}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="pt-4 border-t">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex w-full items-start gap-4"
          >
             <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem className="w-1/4">
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                    disabled={isLoading || messages.length > 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Hindi">Hindi</SelectItem>
                      <SelectItem value="Marathi">Marathi</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="query"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      placeholder={t.coach.placeholder}
                      {...field}
                      disabled={isLoading}
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isLoading}
              size="icon"
              className="shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              <span className="sr-only">{t.coach.send}</span>
            </Button>
          </form>
        </Form>
      </CardFooter>
    </Card>
  );
}
