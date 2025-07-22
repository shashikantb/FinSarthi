
"use client";

import { useAuth } from "@/hooks/use-auth";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Loader2, UserCheck, Mail } from "lucide-react";
import { updateUserAvailability } from "@/services/user-service";
import { getChatRequestsForCoach, updateChatRequestStatus } from "@/services/chat-service";
import type { ChatRequest, User } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

type ChatRequestWithCustomer = {
    request: ChatRequest;
    customer: Pick<User, "id" | "fullName" | "email">;
};

export default function CoachDashboardPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [isAvailable, setIsAvailable] = useState(user?.isAvailable ?? false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [requests, setRequests] = useState<ChatRequestWithCustomer[]>([]);
    const [isLoadingRequests, setIsLoadingRequests] = useState(true);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            setIsAvailable(user.isAvailable);
            fetchRequests();
        }
    }, [user]);

    async function fetchRequests() {
        if (!user) return;
        setIsLoadingRequests(true);
        try {
            const fetchedRequests = await getChatRequestsForCoach(user.id);
            setRequests(fetchedRequests.filter(r => r.request.status === 'pending'));
        } catch (error) {
            console.error("Failed to fetch chat requests:", error);
            toast({ title: "Error", description: "Could not load chat requests.", variant: "destructive"});
        }
        setIsLoadingRequests(false);
    }

    if (isAuthLoading || !user) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    const handleAvailabilityChange = async (checked: boolean) => {
        if (!user) return;
        setIsUpdating(true);
        setIsAvailable(checked);
        try {
            await updateUserAvailability(user.id, checked);
            toast({ title: "Status Updated", description: `You are now ${checked ? 'available' : 'unavailable'}.`})
        } catch (error) {
            console.error("Failed to update availability:", error);
            toast({ title: "Error", description: "Could not update your status. Please try again.", variant: "destructive"})
            setIsAvailable(!checked); // Revert on error
        }
        setIsUpdating(false);
    }

    const handleRequestUpdate = async (requestId: string, status: 'accepted' | 'declined') => {
        // Optimistically update the UI
        setRequests(prev => prev.filter(r => r.request.id !== requestId));

        try {
            await updateChatRequestStatus(requestId, status);
            toast({ title: "Request Updated", description: `The chat request has been ${status}.`});
            if (status === 'accepted') {
                router.push('/coach');
            }
        } catch (error) {
            console.error("Failed to update chat request:", error);
            toast({ title: "Update Failed", description: "Could not update the request. It may have been cancelled.", variant: "destructive" });
            fetchRequests(); // Re-fetch to get the true state
        }
    }

    return (
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
             <div className="flex flex-col gap-4 md:gap-8 xl:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Your Status</CardTitle>
                        <CardDescription>Set your status to available to receive new chat requests from customers.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-2">
                            <Switch id="availability-mode" 
                                checked={isAvailable} 
                                onCheckedChange={handleAvailabilityChange}
                                disabled={isUpdating}
                            />
                            <Label htmlFor="availability-mode">{isAvailable ? "You are available" : "You are not available"}</Label>
                            {isUpdating && <Loader2 className="h-4 w-4 animate-spin"/>}
                        </div>
                    </CardContent>
                </Card>
             </div>

             <div className="flex flex-col gap-4 md:gap-8 xl:col-span-2">
                 <Card>
                    <CardHeader>
                        <CardTitle>Chat Requests</CardTitle>
                        <CardDescription>Incoming requests from customers will appear here.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoadingRequests ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : requests.length > 0 ? (
                            requests.map(({request, customer}) => (
                                <div key={request.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src="https://placehold.co/100x100.png" data-ai-hint="profile picture" alt={customer.fullName ?? 'Customer'}/>
                                            <AvatarFallback>{customer.fullName?.[0]?.toUpperCase() ?? 'C'}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{customer.fullName}</p>
                                            <p className="text-sm text-muted-foreground">{customer.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => handleRequestUpdate(request.id, 'accepted')}>Accept</Button>
                                        <Button size="sm" variant="outline" onClick={() => handleRequestUpdate(request.id, 'declined')}>Decline</Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10">
                                <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No active chat requests</h3>
                                <p className="mt-1 text-sm text-muted-foreground">Check back later for new requests.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
