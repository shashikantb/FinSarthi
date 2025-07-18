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
  FormLabel,
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
import { Loader2, Send, Bot, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Message = {
  role: "user" | "model";
  content: string;
};

const formSchema = z.object({
  query: z.string().min(1, "Message cannot be empty."),
  language: z.enum(["English", "Hindi", "Marathi"]),
});

type FormValues = z.infer<typeof formSchema>;

export function FinancialCoach() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: "",
      language: "English",
    },
  });
  
  const { watch } = form;
  const language = watch("language");

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [messages]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setError("");

    const userMessage: Message = { role: "user", content: data.query };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const input: FinancialCoachInput = {
        query: data.query,
        language: data.language,
        history: messages,
      };
      const result = await financialCoach(input);
      const modelMessage: Message = { role: "model", content: result.response };
      setMessages((prev) => [...prev, modelMessage]);
      form.reset({ query: "", language: data.language });
    } catch (e) {
      setError("Failed to get response. Please try again.");
      console.error(e);
      // remove the user message if the call fails
      setMessages((prev) => prev.slice(0, -1));
    }
    setIsLoading(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Chat with FinSarthi</CardTitle>
        <CardDescription>
          Ask questions about budgeting, saving, investing, loans, and more.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "model" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
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
                  {message.content}
                </div>
                 {message.role === "user" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback><User className="h-5 w-5"/></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
               <div className="flex items-start gap-3 justify-start">
                   <Avatar className="h-8 w-8">
                    <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
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
                      placeholder="Type your message here..."
                      {...field}
                      disabled={isLoading}
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} size="icon" className="shrink-0">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </Form>
      </CardFooter>
    </Card>
  );
}
