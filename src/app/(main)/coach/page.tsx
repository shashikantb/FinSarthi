
"use client";

import { FinancialCoach } from "@/components/financial-coach";
import { useAppTranslations } from "@/providers/translations-provider";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { getActiveChatSession } from "@/services/chat-service";
import type { ChatRequest, User } from "@/lib/db/schema";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CoachPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [activeSession, setActiveSession] = useState<{ session: ChatRequest, partner: User } | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const { t } = useAppTranslations();

  useEffect(() => {
    async function fetchActiveSession() {
      if (!user) return;
      setIsLoadingSession(true);
      try {
        const session = await getActiveChatSession(user.id);
        setActiveSession(session);
      } catch (error) {
        console.error("Failed to fetch active chat session", error);
      }
      setIsLoadingSession(false);
    }
    fetchActiveSession();
  }, [user]);

  if (isAuthLoading || isLoadingSession) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // If there's an active human-to-human chat session
  if (activeSession) {
    return (
      <div className="mt-6">
        <FinancialCoach
          chatSession={activeSession.session}
          chatPartner={activeSession.partner}
          currentUser={user!}
        />
      </div>
    );
  }
  
  // Default to AI coach if no active session
  return (
    <div className="space-y-4">
       <div className="space-y-1">
        <h1 className="text-2xl font-headline font-bold md:text-3xl">{t.coach.title}</h1>
        <p className="text-muted-foreground">
          {t.coach.description}
        </p>
      </div>
      <div className="mt-6">
         {user?.role === 'coach' ? (
            <Card>
                <CardHeader>
                    <CardTitle>No Active Chat</CardTitle>
                    <CardDescription>You do not have an active chat with a customer. Accepted requests will appear here.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm">Please check the "Requests" tab for pending customer chats.</p>
                </CardContent>
            </Card>
         ) : (
            <FinancialCoach currentUser={user!} />
         )}
      </div>
    </div>
  );
}
