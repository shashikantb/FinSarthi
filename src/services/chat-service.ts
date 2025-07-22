
"use server";

import { db } from "@/lib/db";
import { chatRequests, type NewChatRequest, users } from "@/lib/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Creates a new chat request from a customer to a coach.
 * @param customerId The ID of the customer initiating the request.
 * @param coachId The ID of the coach receiving the request.
 * @returns The newly created chat request object.
 */
export async function createChatRequest(customerId: string, coachId: string) {
  const newRequest: NewChatRequest = {
    customerId,
    coachId,
    status: 'pending',
  };
  const [createdRequest] = await db.insert(chatRequests).values(newRequest).returning();
  
  // Revalidate the coach's dashboard to show the new request
  revalidatePath('/coach-dashboard');

  return createdRequest;
}

/**
 * Fetches all chat requests for a specific coach, including customer details.
 * @param coachId The ID of the coach.
 * @returns An array of chat requests with associated customer information.
 */
export async function getChatRequestsForCoach(coachId: string) {
    const requests = await db
        .select({
            request: chatRequests,
            customer: {
                id: users.id,
                fullName: users.fullName,
                email: users.email
            }
        })
        .from(chatRequests)
        .where(eq(chatRequests.coachId, coachId))
        .innerJoin(users, eq(chatRequests.customerId, users.id))
        .orderBy(desc(chatRequests.createdAt));
    
    return requests;
}

/**
 * Fetches all chat requests initiated by a specific customer.
 * @param customerId The ID of the customer.
 * @returns An array of chat requests.
 */
export async function getChatRequestsForCustomer(customerId: string) {
    const requests = await db
        .select()
        .from(chatRequests)
        .where(eq(chatRequests.customerId, customerId))
        .orderBy(desc(chatRequests.createdAt));
    return requests;
}


/**
 * Updates the status of a chat request.
 * @param requestId The ID of the chat request to update.
 * @param status The new status ('accepted' or 'declined').
 */
export async function updateChatRequestStatus(requestId: string, status: 'accepted' | 'declined') {
    await db.update(chatRequests)
        .set({ status, updatedAt: new Date() })
        .where(eq(chatRequests.id, requestId));
    
    revalidatePath('/coach-dashboard');
    // No need to revalidate the customer path here as they will be polling.
}
