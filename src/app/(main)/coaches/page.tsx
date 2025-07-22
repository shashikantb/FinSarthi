
"use client";

import { useEffect, useState } from "react";
import { getAvailableCoaches } from "@/services/user-service";
import { createChatRequest } from "@/services/chat-service";
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
import { Wifi, Loader2, UserX, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function CoachesPage() {
  const [coaches, setCoaches] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingCoachId, setRequestingCoachId] = useState<string | null>(null);
  const [requestedCoachIds, setRequestedCoachIds] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchCoaches() {
      setLoading(true);
      try {
        const availableCoaches = await getAvailableCoaches();
        // Filter out the current user if they are a coach
        const filteredCoaches = availableCoaches.filter(coach => coach.id !== user?.id);
        setCoaches(filteredCoaches);
      } catch (error) {
        console.error("Failed to fetch coaches:", error);
      }
      setLoading(false);
    }
    if(user) {
        fetchCoaches();
    }
  }, [user]);

  const handleRequestChat = async (coachId: string) => {
    if (!user) {
        toast({ title: "Please login to request a chat.", variant: "destructive"});
        return;
    }
    setRequestingCoachId(coachId);
    try {
        await createChatRequest(user.id, coachId);
        toast({ title: "Success", description: "Chat request sent successfully!" });
        setRequestedCoachIds(prev => new Set(prev).add(coachId));
    } catch (error) {
        console.error("Failed to send chat request:", error);
        toast({ title: "Error", description: "Failed to send chat request. Please try again.", variant: "destructive" });
    }
    setRequestingCoachId(null);
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
              {coaches.map((coach) => (
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
                        onClick={() => handleRequestChat(coach.id)}
                        disabled={requestingCoachId === coach.id || requestedCoachIds.has(coach.id)}
                    >
                        {requestingCoachId === coach.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : requestedCoachIds.has(coach.id) ? (
                           <CheckCircle className="mr-2 h-4 w-4" />
                        ) : null}
                        {requestedCoachIds.has(coach.id) ? "Request Sent" : "Request Chat"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
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
