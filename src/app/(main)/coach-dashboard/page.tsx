
"use client";

import { useAuth } from "@/hooks/use-auth";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
  } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";


async function updateUserAvailability(userId: string, isAvailable: boolean) {
    "use server";
    await db.update(users).set({ isAvailable }).where(eq(users.id, userId));
    // In a real app, you'd revalidate paths here to update other users' views.
}


export default function CoachDashboardPage() {
    const { user, isLoading } = useAuth();
    const [isAvailable, setIsAvailable] = useState(user?.isAvailable ?? false);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (user) {
            setIsAvailable(user.isAvailable);
        }
    }, [user]);

    if (isLoading || !user) {
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
        await updateUserAvailability(user.id, checked);
        setIsUpdating(false);
    }

    return (
        <div className="space-y-6">
             <div className="space-y-1">
                <h1 className="text-2xl font-headline font-bold md:text-3xl">Coach Dashboard</h1>
                <p className="text-muted-foreground">
                    Welcome back, {user.fullName}! Manage your availability and view chat requests.
                </p>
            </div>

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

             <Card>
                <CardHeader>
                    <CardTitle>Chat Requests</CardTitle>
                    <CardDescription>Incoming requests from customers will appear here.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-10 text-muted-foreground">
                        <p>No active chat requests.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

