
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  financialCoach,
  type FinancialCoachInput,
} from "@/ai/flows/financial-coach";
import { generatePersonalizedAdvice } from "@/ai/flows/generate-personalized-advice";
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
import { Loader2, Send, Bot, User as UserIcon, Mic, Square, LogOut, Play, Save } from "lucide-react";
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
import { createAdviceSessionForCurrentUser } from "@/services/advice-service";

type MessageRole = "user" | "assistant";
type ConversationStage = "greeting" | "prompt_selection" | "questioning" | "generating_advice" | "chatting";

type Message = {
  id: string;
  role: MessageRole;
  content: string;
  buttons?: { label: string; value: string; action?: "select_prompt" }[];
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

export function FinancialCoach({ currentUser, chatSession, chatPartner }: FinancialCoachProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const { t, languageCode } = useAppTranslations();
  const { toast } = useToast();
  const isHumanChat = !!(chatSession && chatPartner);
  const isGuest = currentUser.id === 'guest';

  // Guided flow state
  const [conversationStage, setConversationStage] = useState<ConversationStage>(isHumanChat ? "chatting" : "greeting");
  const [selectedPromptKey, setSelectedPromptKey] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [collectedAnswers, setCollectedAnswers] = useState<Record<string, string>>({});
  const [generatedAdvice, setGeneratedAdvice] = useState<string | null>(null);
  const [isAdviceSaved, setIsAdviceSaved] = useState(false);

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
      // Wait a tick to ensure the input value is set before submitting
      setTimeout(() => form.handleSubmit(handleSubmit)(), 0);
    }
  }, [transcript, isListening, form]);


  const startNewGuidedFlow = useCallback(() => {
    const greetingText = isGuest ? t.coach.greeting_guest : t.coach.greeting_user.replace('{name}', currentUser.fullName || 'User');
    const greetingMessage: Message = {
      id: createId(),
      role: 'assistant',
      content: greetingText,
    };
    const promptButtons = advicePrompts.map(p => ({ label: p.title[languageCode as LanguageCode], value: p.key, action: "select_prompt" as const }));
    const promptMessage: Message = {
      id: createId(),
      role: 'assistant',
      content: t.coach.prompt_selection_title,
      buttons: promptButtons,
    };
    setMessages([greetingMessage, promptMessage]);
    setConversationStage("prompt_selection");
    setSelectedPromptKey(null);
    setCurrentQuestionIndex(0);
    setCollectedAnswers({});
    setGeneratedAdvice(null);
    setIsAdviceSaved(false);
  }, [currentUser, languageCode, t, isGuest]);

  useEffect(() => {
    if (conversationStage === 'greeting' && !isHumanChat) {
      startNewGuidedFlow();
    }
  }, [conversationStage, isHumanChat, startNewGuidedFlow]);

  const handlePromptSelection = async (promptKey: string) => {
    // Removed the guest check that was blocking the flow
    setSelectedPromptKey(promptKey);
    const selectedPrompt = advicePrompts.find(p => p.key === promptKey);
    if (!selectedPrompt) return;

    setMessages(prev => prev.map(m => ({ ...m, buttons: undefined })));

    const userSelectionMessage: Message = {
      id: createId(),
      role: 'user',
      content: selectedPrompt.title[languageCode as LanguageCode],
    };
    setMessages(prev => [...prev, userSelectionMessage]);

    setConversationStage("questioning");
    setCurrentQuestionIndex(0);
    askQuestion(0, promptKey);
  };

  const askQuestion = (qIndex: number, promptKey: string) => {
    const prompt = advicePrompts.find(p => p.key === promptKey);
    if (prompt && prompt.questions[qIndex]) {
      const question = prompt.questions[qIndex];
      const questionMessage: Message = {
        id: createId(),
        role: 'assistant',
        content: question.label[languageCode as LanguageCode],
      };
      setMessages(prev => [...prev, questionMessage]);
    }
  };

  const handleSaveAndEndChat = async () => {
    if (!generatedAdvice || !selectedPromptKey || isGuest) return;

    try {
        if (!isAdviceSaved) {
            await createAdviceSessionForCurrentUser({
                promptKey: selectedPromptKey,
                formData: collectedAnswers,
                language: languageCode as LanguageCode,
                generatedAdvice: generatedAdvice,
            }, true); // `true` for isLoggedIn
            
            toast({ title: t.coach.toast_advice_saved_title, description: t.coach.toast_advice_saved_desc });
            setIsAdviceSaved(true); // Mark as saved
        }
        // After saving (or if already saved), reset the flow.
        startNewGuidedFlow();

    } catch(error) {
        console.error("Failed to save advice:", error);
        toast({ title: t.common.error, description: t.coach.toast_advice_save_error, variant: "destructive" });
    }
  };


  const handleQuestionAnswer = async (answer: string) => {
    const userMessage: Message = { role: 'user', content: answer, id: createId() };
    setMessages(prev => [...prev, userMessage]);
    
    if (!selectedPromptKey) return;
    const prompt = advicePrompts.find(p => p.key === selectedPromptKey);
    if (!prompt) return;

    const questionKey = prompt.questions[currentQuestionIndex].key;
    const newAnswers = { ...collectedAnswers, [questionKey]: answer };
    setCollectedAnswers(newAnswers);

    const nextQuestionIndex = currentQuestionIndex + 1;
    if (nextQuestionIndex < prompt.questions.length) {
      setCurrentQuestionIndex(nextQuestionIndex);
      askQuestion(nextQuestionIndex, selectedPromptKey);
    } else {
      setConversationStage("generating_advice");
      setIsLoading(true);
      const adviceMessage: Message = { id: createId(), role: 'assistant', content: t.coach.generating_advice };
      setMessages(prev => [...prev, adviceMessage]);
      
      try {
        const adviceResult = await generatePersonalizedAdvice({
          promptKey: selectedPromptKey,
          formData: newAnswers,
          language: languageCode,
        });

        setGeneratedAdvice(adviceResult.advice);
        setIsAdviceSaved(false);

        const resultMessage: Message = { 
            id: createId(), 
            role: 'assistant', 
            content: adviceResult.advice,
        };
        setMessages(prev => [...prev.filter(m => m.id !== adviceMessage.id), resultMessage]);
        
        const finalMessage: Message = { id: createId(), role: 'assistant', content: t.coach.follow_up_prompt };
        setMessages(prev => [...prev, finalMessage]);

      } catch (e) {
        const errorMessage: Message = { id: createId(), role: 'assistant', content: t.common.error_generic };
        setMessages(prev => [...prev.filter(m => m.id !== adviceMessage.id), errorMessage]);
      } finally {
        setIsLoading(false);
        setConversationStage("chatting");
      }
    }
  };


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
    if (conversationStage === 'questioning') {
      handleQuestionAnswer(data.query);
      form.reset({ query: '' });
      return;
    }
    
    const userMessage: Message = { role: 'user', content: data.query, id: createId() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError('');
    form.reset({ query: '' });
  
    try {
      if (isHumanChat) {
        await sendMessage(chatSession.id, currentUser.id, data.query);
        await fetchHumanMessages(); 
      } else {
        if (conversationStage !== "chatting") {
            setConversationStage("chatting");
            setSelectedPromptKey(null);
            setCollectedAnswers({});
            setCurrentQuestionIndex(0);
        }

        const historyForAI = [...messages.map(m => ({role: m.role, content: m.content})), {role: userMessage.role, content: userMessage.content}];
        
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
      setMessages(currentMessages => currentMessages.filter(m => m.id !== userMessage.id)); 
    } finally {
        setIsLoading(false);
    }
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
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full w-full" viewportRef={scrollViewportRef}>
          <div className="space-y-4 p-4">
            {messages.length === 0 && (
                <div className="text-center text-muted-foreground pt-10">
                    {isHumanChat ? t.coach.start_conversation : t.coach.starting_conversation}
                </div>
            )}
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
                        <div className="flex flex-wrap gap-2 ml-10">
                          {message.buttons.map(button => (
                            <Button key={button.value} size="sm" variant="outline" 
                                onClick={() => {
                                    if (button.action === 'select_prompt') handlePromptSelection(button.value);
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
      <CardFooter className="pt-4 border-t flex flex-col items-stretch gap-2">
        {!isHumanChat && generatedAdvice && (
          <div className="flex justify-center">
            <Button
              onClick={handleSaveAndEndChat}
              disabled={isAdviceSaved}
              variant="outline"
              size="sm"
            >
              <Save className="mr-2 h-4 w-4" />
              {isAdviceSaved ? t.coach.advice_saved_button : t.coach.save_and_new_chat_button}
            </Button>
          </div>
        )}
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
                    disabled={isLoading || conversationStage === 'prompt_selection'}
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
                      placeholder={isListening ? "Listening..." : (conversationStage === 'questioning' ? t.coach.answer_placeholder : t.coach.placeholder)}
                      {...field}
                      disabled={isLoading || isListening || conversationStage === 'prompt_selection'}
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isLoading || conversationStage === 'prompt_selection'}
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
