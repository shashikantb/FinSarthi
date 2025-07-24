
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  financialCoach,
  type FinancialCoachInput,
} from "@/ai/flows/financial-coach";
import type { ChatMessage, ChatRequest, User } from "@/lib/db/schema";
import {
  sendMessage,
  getMessagesForChat,
  updateChatRequestStatus,
  markMessagesAsRead
} from "@/services/chat-service";
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
import { Loader2, Send, Bot, User as UserIcon, Mic, Square, LogOut, Play } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useBrowserTts } from "@/hooks/use-browser-tts";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { languages, langToLocale, type LanguageCode } from "@/lib/translations";
import { createId } from "@paralleldrive/cuid2";
import { useAppTranslations } from "@/providers/translations-provider";
import { useToast } from "@/hooks/use-toast";
import advicePrompts from "@/lib/advice-prompts.json";

type MessageRole = "user" | "assistant";

type Message = {
  id: string;
  role: MessageRole;
  content: string;
  buttons?: { label: string; value: string; isQuestion?: boolean; answer?: string; isCustomQuery?: boolean }[];
};

const formSchema = z.object({
  query: z.string().min(1, "Message cannot be empty."),
});

type FormValues = z.infer<typeof formSchema>;

interface FinancialCoachProps {
  currentUser: User;
  chatSession?: ChatRequest;
  chatPartner?: User;
}

type Prompt = {
    key: string;
    title: Record<LanguageCode, string>;
    description?: Record<LanguageCode, string>;
    subPrompts?: Prompt[];
    question?: Record<LanguageCode, string>;
    answer?: Record<LanguageCode, string>;
};

export function FinancialCoach({ currentUser, chatSession, chatPartner }: FinancialCoachProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const { t, languageCode } = useAppTranslations();
  const { toast } = useToast();
  const isHumanChat = !!(chatSession && chatPartner);

  const [promptPath, setPromptPath] = useState<string[]>([]);
  const [isAwaitingCustomQuery, setIsAwaitingCustomQuery] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: "",
    },
  });

  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);

  const { speak, stop: stopSpeaking, isPlaying } = useBrowserTts({
    onEnd: () => setCurrentlyPlayingId(null),
  });

  const { isListening, transcript, startListening, stopListening } = useSpeechRecognition({});

  useEffect(() => {
    if (transcript) {
        form.setValue("query", transcript);
    }
  }, [transcript, form]);
  
  useEffect(() => {
    if (transcript && !isListening) {
      setTimeout(() => form.handleSubmit(handleSubmit)(), 0);
    }
  }, [transcript, isListening, form]);

  const getCurrentOptions = useCallback((): any[] => {
    let currentLevel: any = advicePrompts;
    let pathIndex = 0;
    while(pathIndex < promptPath.length) {
        const key = promptPath[pathIndex];
        const hasSubPrompts = currentLevel[0]?.subPrompts;
        const levelToSearch = hasSubPrompts ? currentLevel : currentLevel.flatMap((p: any) => p.subPrompts || []);
        
        const selected = levelToSearch.find((p: any) => p.key === key);

        if (selected && selected.subPrompts) {
            currentLevel = selected.subPrompts;
        } else {
            return [];
        }
        pathIndex++;
    }
    return Array.isArray(currentLevel) ? currentLevel : [];
}, [promptPath]);

  const startNewFaqFlow = useCallback(() => {
    setMessages([]);
    setPromptPath([]);
    setIsAwaitingCustomQuery(false);
    
    const greetingText = isHumanChat ? t.coach.start_conversation : t.coach.greeting_user.replace('{name}', currentUser.fullName || 'User');
    const greetingMessage: Message = { id: createId(), role: 'assistant', content: greetingText };
    
    if (!isHumanChat) {
      const topLevelOptions = advicePrompts;
      const optionsMessage: Message = {
        id: createId(),
        role: 'assistant',
        content: topLevelOptions[0].description?.[languageCode] ?? "Please select one of the following topics to get started:",
        buttons: topLevelOptions.map(p => ({ label: p.title[languageCode], value: p.key })),
      };
      setMessages([greetingMessage, optionsMessage]);
    } else {
      setMessages([greetingMessage]);
    }
  }, [isHumanChat, t, currentUser.fullName, languageCode]);

  useEffect(() => {
    startNewFaqFlow();
  }, [startNewFaqFlow]);
  
  const callAI = async (query: string) => {
    setIsLoading(true);
    setError('');
    
    // Add user query to messages for history
    const userMessage: Message = { role: 'user', content: query, id: createId() };
    const messagesWithUserQuery = [...messages.map(m => ({ ...m, buttons: undefined })), userMessage];
    setMessages(messagesWithUserQuery);

    try {
      if (isHumanChat) {
        await sendMessage(chatSession!.id, currentUser.id, query);
        await fetchHumanMessages(); 
      } else {
        const historyForAI = messagesWithUserQuery.map(m => ({role: m.role, content: m.content}));
        
        const langName = languages[languageCode]?.name || "English";
        
        const input: FinancialCoachInput = {
          language: langName as "English" | "Hindi" | "Marathi" | "German",
          history: historyForAI,
          age: currentUser.age ?? undefined,
          gender: currentUser.gender ?? undefined,
          city: currentUser.city ?? undefined,
          country: currentUser.country ?? undefined,
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
      // Revert adding the user message if AI fails
      setMessages(messagesWithUserQuery.slice(0, -1));
    } finally {
        setIsLoading(false);
        setIsAwaitingCustomQuery(true); // Allow user to type after AI response
    }
  };

  const handleOptionSelection = (key: string, label: string) => {
    setIsAwaitingCustomQuery(false);
    const updatedMessages = messages.map(m => ({ ...m, buttons: undefined }));
    const userMessage: Message = { id: createId(), role: 'user', content: label };
    setMessages([...updatedMessages, userMessage]);

    const newPath = [...promptPath, key];
    setPromptPath(newPath);

    let nextLevel = advicePrompts as any[];
    for (const p of newPath) {
        const selected = nextLevel.find(i => i.key === p);
        if (selected && selected.subPrompts) {
            nextLevel = selected.subPrompts;
        }
    }

    if (nextLevel && nextLevel.length > 0) {
        const buttons = nextLevel.map(p => ({
            label: p.question?.[languageCode] ?? p.title[languageCode],
            value: p.key,
            isQuestion: !!p.question
        }));
        
        // Only add "Any Other Query?" if the next level has questions, not more categories.
        if (nextLevel.some(p => p.question)) {
           buttons.push({ label: t.coach.any_other_query, value: 'custom_query', isCustomQuery: true });
        }

        const nextMessage: Message = {
            id: createId(),
            role: 'assistant',
            content: t.coach.select_option,
            buttons: buttons,
        };
        setMessages(prev => [...prev, nextMessage]);
    }
};

  const handleQuestionSelection = (label: string) => {
    // A question from the menu was selected, send it to the AI.
    setMessages(prev => prev.map(m => ({...m, buttons: undefined})));
    callAI(label);
  };
  
  const handleCustomQuerySelected = () => {
    setMessages(prev => prev.map(m => ({...m, buttons: undefined})));
    const userMessage: Message = { id: createId(), role: 'user', content: t.coach.any_other_query };
    const promptMessage: Message = { id: createId(), role: 'assistant', content: t.coach.type_your_question };
    setMessages(prev => [...prev, userMessage, promptMessage]);
    setIsAwaitingCustomQuery(true);
  }

  const fetchHumanMessages = useCallback(async () => {
    if (!chatSession) return;
    const dbMessages = await getMessagesForChat(chatSession.id);
    const formattedMessages = dbMessages.map((msg: ChatMessage) => ({
      id: msg.id,
      role: msg.senderId === currentUser.id ? 'user' : 'assistant',
      content: msg.content
    })).reverse(); 
    setMessages(formattedMessages);
  }, [chatSession, currentUser.id]);

  useEffect(() => {
    if (isHumanChat) {
      markMessagesAsRead(chatSession!.id, currentUser.id);
      fetchHumanMessages();
      const interval = setInterval(fetchHumanMessages, 5000); 
      return () => clearInterval(interval);
    }
  }, [isHumanChat, fetchHumanMessages, chatSession, currentUser.id]);

  const languageName = languages[languageCode as keyof typeof languages]?.name || "English";
  const locale = langToLocale[languageName as keyof typeof langToLocale] || 'en-US';

  useEffect(() => {
    if (scrollViewportRef.current) {
        scrollViewportRef.current.scrollTo({
        top: scrollViewportRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handlePlayPause = (message: Message) => {
    if (currentlyPlayingId === message.id && isPlaying) {
        stopSpeaking();
    } else {
        stopSpeaking();
        speak(message.content, locale);
        setCurrentlyPlayingId(message.id);
    }
  };

  const handleCloseChat = async () => {
    if (!chatSession) return;
    await updateChatRequestStatus(chatSession.id, 'closed');
    toast({ title: "Chat Closed", description: "The chat session has been ended."});
    window.location.reload(); 
  }

  const handleSubmit = form.handleSubmit(async (data: FormValues) => {
    form.reset({ query: '' });
    setIsAwaitingCustomQuery(false);
    callAI(data.query);
  });

  const cardTitle = isHumanChat ? `${t.coach.chat_with} ${chatPartner?.fullName}` : t.coach.chat_title;
  const cardDescription = isHumanChat ? t.coach.human_chat_desc : t.coach.chat_description;

  return (
    <Card className="w-full flex flex-col h-[calc(100vh-10rem)] max-h-[700px]">
      <CardHeader className="flex flex-row justify-between items-center border-b">
        <div>
            <CardTitle>{cardTitle}</CardTitle>
            <CardDescription>{cardDescription}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
            {isHumanChat && currentUser.role === 'coach' && (
                <Button variant="outline" size="sm" onClick={handleCloseChat}>
                    <LogOut className="mr-2 h-4 w-4"/>
                    {t.coach.close_chat}
                </Button>
            )}
             {isHumanChat && currentUser.role === 'customer' && (
                <Button variant="outline" size="sm" onClick={handleCloseChat}>
                    <LogOut className="mr-2 h-4 w-4"/>
                    {t.coach.end_chat}
                </Button>
            )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full w-full" viewportRef={scrollViewportRef}>
          <div className="space-y-4 p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex items-end gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                   <div className="flex flex-col items-start gap-2">
                     <div className="flex items-end gap-2">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback>
                                {isHumanChat ? chatPartner?.fullName?.[0]?.toUpperCase() : <Bot className="h-5 w-5" />}
                            </AvatarFallback>
                           {isHumanChat && chatPartner?.fullName && (
                               <AvatarImage src={'https://placehold.co/100x100.png'} data-ai-hint="profile picture" alt={chatPartner.fullName} />
                           )}
                        </Avatar>
                        <div
                          className={cn(
                            "max-w-xs rounded-lg p-3 text-sm md:max-w-md shadow",
                            "bg-muted rounded-bl-none"
                          )}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                         {!isHumanChat && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handlePlayPause(message)}
                                disabled={isListening}
                            >
                                {currentlyPlayingId === message.id && isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </Button>
                         )}
                     </div>
                      {message.buttons && (
                        <div className="flex flex-col items-start gap-2 ml-10 mt-2">
                          {message.buttons.map(button => (
                            <Button key={button.value} size="sm" variant="outline" 
                                onClick={() => {
                                    if(button.isCustomQuery) {
                                      handleCustomQuerySelected();
                                    } else if (button.isQuestion) {
                                      handleQuestionSelection(button.label);
                                    } else {
                                      handleOptionSelection(button.value, button.label);
                                    }
                                }}
                            >
                              {button.label}
                            </Button>
                          ))}
                        </div>
                      )}
                   </div>
                )}
                
                {message.role === "user" && (
                    <div className="flex items-end gap-2">
                        <div
                            className={cn(
                                "max-w-xs rounded-lg p-3 text-sm md:max-w-md shadow",
                                "bg-primary text-primary-foreground rounded-br-none"
                            )}
                        >
                            <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={'https://placehold.co/100x100.png'} data-ai-hint="profile picture" alt={currentUser.fullName ?? 'User'} />
                            <AvatarFallback>
                                <UserIcon className="h-5 w-5" />
                            </AvatarFallback>
                        </Avatar>
                    </div>
                )}
              </div>
            ))}
            {isLoading && !isHumanChat && (
              <div className="flex items-start gap-3 justify-start">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                     <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="max-w-xs rounded-lg p-3 text-sm md:max-w-md bg-muted">
                  <div className="flex items-center">
                    <span className="animate-bounce mr-1">.</span>
                    <span className="animate-bounce delay-75 mr-1">.</span>
                    <span className="animate-bounce delay-150">.</span>
                  </div>
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
            onSubmit={handleSubmit}
            className="flex w-full items-start gap-3"
          >
             {!isHumanChat && (
                <Button 
                    type="button" 
                    size="icon" 
                    className={cn("shrink-0", isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600')}
                    onClick={() => isListening ? stopListening() : startListening({ lang: locale })}
                    disabled={isLoading || !isAwaitingCustomQuery}
                >
                   {isListening ? <Square className="h-5 w-5"/> : <Mic className="h-5 w-5" />}
                   <span className="sr-only">{isListening ? 'Stop listening' : 'Start listening'}</span>
                </Button>
             )}
            <FormField
              control={form.control}
              name="query"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      placeholder={isListening ? "Listening..." : (isAwaitingCustomQuery ? t.coach.placeholder : t.coach.select_option_placeholder)}
                      {...field}
                      disabled={isLoading || isListening || !isAwaitingCustomQuery}
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isLoading || !isAwaitingCustomQuery}
              size="icon"
              className="shrink-0"
            >
              {isLoading && !isHumanChat ? (
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
