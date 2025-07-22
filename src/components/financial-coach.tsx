
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  financialCoach,
  type FinancialCoachInput,
} from "@/ai/flows/financial-coach";
import {
  sendMessage,
  getMessagesForChat,
  updateChatRequestStatus,
  markMessagesAsRead
} from "@/services/chat-service";
import type { ChatMessage, ChatRequest, User } from "@/lib/db/schema";
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
import { Loader2, Send, Bot, User as UserIcon, Volume2, Play, LogOut } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useBrowserTts } from "@/hooks/use-browser-tts";
import { languages, langToLocale } from "@/lib/translations";
import { createId } from "@paralleldrive/cuid2";
import { useAppTranslations } from "@/hooks/use-app-translations";
import { useToast } from "@/hooks/use-toast";

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

interface FinancialCoachProps {
  currentUser: User;
  chatSession?: ChatRequest;
  chatPartner?: User;
}


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

export function FinancialCoach({ currentUser, chatSession, chatPartner }: FinancialCoachProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { t, languageCode } = useAppTranslations();
  const { toast } = useToast();
  const isHumanChat = !!(chatSession && chatPartner);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: "",
      language: "English",
    },
  });

  const language = form.watch("language");

  const fetchHumanMessages = useCallback(async () => {
    if (!chatSession) return;
    const dbMessages = await getMessagesForChat(chatSession.id);
    const formattedMessages = dbMessages.map((msg: ChatMessage) => ({
      id: msg.id,
      role: msg.senderId === currentUser.id ? 'user' : 'assistant',
      content: msg.content
    })).reverse(); // Reverse to show oldest first
    setMessages(formattedMessages);
  }, [chatSession, currentUser.id]);

  useEffect(() => {
    if (isHumanChat) {
      // Mark messages as read when the chat is opened
      markMessagesAsRead(chatSession!.id, currentUser.id);

      fetchHumanMessages();
      const interval = setInterval(fetchHumanMessages, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isHumanChat, fetchHumanMessages, chatSession, currentUser.id]);

  useEffect(() => {
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

  const handleCloseChat = async () => {
    if (!chatSession) return;
    await updateChatRequestStatus(chatSession.id, 'closed');
    toast({ title: "Chat Closed", description: "The chat session has been ended."});
    window.location.reload(); // Force reload to reflect the change
  }

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    const userMessage: Message = { role: 'user', content: data.query, id: createId() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError('');
    form.reset({ query: '', language: data.language });
  
    try {
      if (isHumanChat) {
        // Human-to-human chat logic
        await sendMessage(chatSession.id, currentUser.id, data.query);
        // Optimistically show message, polling will confirm
      } else {
        // AI chat logic
        const historyForAI = [...messages.map(m => ({role: m.role, content: m.content})), {role: userMessage.role, content: userMessage.content}];
        const input: FinancialCoachInput = {
          language: data.language,
          history: historyForAI,
        };
        const result = await financialCoach(input);
        if (!result || !result.response) throw new Error("AI returned an invalid response.");
        
        const modelMessage: Message = {
          role: 'assistant',
          content: result.response,
          id: createId(),
        };
        setMessages(currentMessages => [...currentMessages, modelMessage]);
      }
    } catch (e: any) {
      console.error("An error occurred during the chat flow:", e);
      setError(`Failed to get response. ${e.message || ''}`.trim());
      setMessages(currentMessages => currentMessages.filter(m => m.id !== userMessage.id)); 
    } finally {
        setIsLoading(false);
    }
  };

  const cardTitle = isHumanChat ? `Chat with ${chatPartner.fullName}` : t.coach.chat_title;
  const cardDescription = isHumanChat ? `You are now chatting directly with a user.` : t.coach.chat_description;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
            <CardTitle>{cardTitle}</CardTitle>
            <CardDescription>{cardDescription}</CardDescription>
        </div>
        {isHumanChat && currentUser.role === 'coach' && (
            <Button variant="outline" size="sm" onClick={handleCloseChat}>
                <LogOut className="mr-2 h-4 w-4"/>
                Close Chat
            </Button>
        )}
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
                     <AvatarImage src={isHumanChat ? `https://placehold.co/100x100.png` : undefined} data-ai-hint="profile picture" alt={chatPartner?.fullName ?? 'Bot'} />
                    <AvatarFallback>
                      {isHumanChat ? chatPartner?.fullName?.[0]?.toUpperCase() : <Bot className="h-5 w-5" />}
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
                    {message.role === "assistant" && !isHumanChat && <AudioPlayer message={message} language={language} />}
                  </div>
                </div>
                {message.role === "user" && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://placehold.co/100x100.png`} data-ai-hint="profile picture" alt={currentUser.fullName ?? 'User'} />
                    <AvatarFallback>
                      <UserIcon className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 justify-start">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                     {isHumanChat ? chatPartner?.fullName?.[0]?.toUpperCase() : <Bot className="h-5 w-5" />}
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
             {!isHumanChat && <FormField
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
            />}
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
