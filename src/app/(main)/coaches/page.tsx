
"use client";

import { useEffect, useState, useRef, useReducer } from "react";
import { getAvailableCoaches } from "@/services/user-service";
import { createChatRequest, getChatRequestsForCustomer, type ChatRequest } from "@/services/chat-service";
import type { User } from "@/lib/db/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Wifi, Loader2, UserX, CheckCircle, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

type RequestStatus = "idle" | "pending" | "accepted" | "declined";

export default function CoachesPage() {
  const [coaches, setCoaches] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingCoachId, setRequestingCoachId] = useState<string | null>(null);
  const [requestStatuses, setRequestStatuses] = useState<Record<string, RequestStatus>>({});
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchInitialData() {
      if (!user) return;
      setLoading(true);
      try {
        const [availableCoaches, existingRequests] = await Promise.all([
          getAvailableCoaches(),
          getChatRequestsForCustomer(user.id)
        ]);
        
        const filteredCoaches = availableCoaches.filter(coach => coach.id !== user?.id);
        setCoaches(filteredCoaches);

        const initialStatuses: Record<string, RequestStatus> = {};
        for (const coach of filteredCoaches) {
            const request = existingRequests.find(r => r.coachId === coach.id && r.status !== 'declined');
            if (request) {
                initialStatuses[coach.id] = request.status as RequestStatus;
            }
        }
        setRequestStatuses(initialStatuses);

      } catch (error) {
        console.error("Failed to fetch initial data:", error);
        toast({ title: "Error", description: "Could not load coaches.", variant: "destructive" });
      }
      setLoading(false);
    }
    if (user) {
      fetchInitialData();
    }
  }, [user, toast]);
  
  // This separate useEffect handles showing toasts when statuses change.
  // This prevents the "Cannot update a component while rendering a different component" error.
  const [previousStatuses, setPreviousStatuses] = useState<Record<string, RequestStatus>>({});
  useEffect(() => {
    for (const coachId in requestStatuses) {
      const currentStatus = requestStatuses[coachId];
      const previousStatus = previousStatuses[coachId];
      if (currentStatus !== previousStatus) {
        if (currentStatus === 'accepted') {
          toast({ title: "Request Accepted!", description: `You can now chat with your coach.` });
        } else if (currentStatus === 'declined') {
          toast({ title: "Request Declined", description: `Your chat request was declined.`, variant: "destructive" });
        }
      }
    }
    setPreviousStatuses(requestStatuses);
  }, [requestStatuses, previousStatuses, toast]);


  useEffect(() => {
    const poll = async () => {
        if (!user || Object.values(requestStatuses).every(s => s !== 'pending')) {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
            return;
        }

        try {
            const requests = await getChatRequestsForCustomer(user.id);
            setRequestStatuses(prev => {
                const newStatuses = { ...prev };
                let changed = false;
                for (const req of requests) {
                    if (newStatuses[req.coachId] !== req.status) {
                        newStatuses[req.coachId] = req.status as RequestStatus;
                        changed = true;
                    }
                }
                return changed ? newStatuses : prev;
            });
        } catch(e) {
            console.error("Polling failed", e);
        }
    }
    
    if (Object.values(requestStatuses).some(s => s === 'pending')) {
        if (!pollIntervalRef.current) {
            pollIntervalRef.current = setInterval(poll, 5000);
        }
    }

    return () => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
        }
    };

  }, [user, requestStatuses, toast]);


  const handleRequestChat = async (coachId: string) => {
    if (!user) {
        toast({ title: "Please login to request a chat.", variant: "destructive"});
        return;
    }
    setRequestingCoachId(coachId);
    try {
        await createChatRequest(user.id, coachId);
        toast({ title: "Success", description: "Chat request sent successfully!" });
        setRequestStatuses(prev => ({ ...prev, [coachId]: 'pending' }));
    } catch (error) {
        console.error("Failed to send chat request:", error);
        toast({ title: "Error", description: "Failed to send chat request. Please try again.", variant: "destructive" });
    }
    setRequestingCoachId(null);
  }

  const getButtonState = (coachId: string) => {
      const status = requestStatuses[coachId];
      if (status === 'accepted') {
          return { text: 'Start Chat', icon: <MessageSquare className="mr-2 h-4 w-4" />, disabled: false, onClick: () => router.push('/coach') };
      }
      if (status === 'pending') {
          return { text: 'Request Sent', icon: <CheckCircle className="mr-2 h-4 w-4" />, disabled: true };
      }
      if (requestingCoachId === coachId) {
          return { text: '', icon: <Loader2 className="mr-2 h-4 w-4 animate-spin" />, disabled: true };
      }
      return { text: 'Request Chat', icon: null, disabled: false, onClick: () => handleRequestChat(coachId) };
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-headline font-bold md:text-3xl">Regional Coaches</h1>
        <p className="text-muted-foreground">
          Find an available coach and start a conversation.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Coaches</CardTitle>
          <CardDescription>These coaches are currently online and available to chat.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : coaches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coaches.map((coach) => {
                const buttonState = getButtonState(coach.id);
                return (
                    <Card key={coach.id} className="flex flex-col">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={`https://placehold.co/100x100.png`} data-ai-hint="profile picture" alt={coach.fullName ?? 'Coach'} />
                                <AvatarFallback>{coach.fullName?.[0]?.toUpperCase() ?? 'C'}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-lg">{coach.fullName}</CardTitle>
                                <CardDescription>Financial Coach</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                    <Wifi className="mr-2 h-3 w-3" />
                                    Available
                                </Badge>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                onClick={buttonState.onClick}
                                disabled={buttonState.disabled}
                            >
                                {buttonState.icon}
                                {buttonState.text}
                            </Button>
                        </CardFooter>
                    </Card>
                );
            })}
            </div>
          ) : (
            <div className="text-center py-10">
                <UserX className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No Coaches Available</h3>
                <p className="mt-1 text-sm text-muted-foreground">Please check back later.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
