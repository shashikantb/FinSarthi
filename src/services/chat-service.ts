
"use server";

import { db } from "@/lib/db";
import { chatRequests, chatMessages, type NewChatRequest, users, type User } from "@/lib/db/schema";
import { and, eq, desc, or, ne, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Creates a new chat request from a customer to a coach.
 * @param customerId The ID of the customer initiating the request.
 * @param coachId The ID of the coach receiving the request.
 * @returns The newly created chat request object.
 */
export async function createChatRequest(customerId: string, coachId: string) {
  // Check if an active request already exists
  const existingRequest = await db.query.chatRequests.findFirst({
    where: and(
      eq(chatRequests.customerId, customerId),
      eq(chatRequests.coachId, coachId),
      ne(chatRequests.status, 'declined'),
      ne(chatRequests.status, 'closed')
    ),
  });

  if (existingRequest) {
    console.log("An active chat request already exists for this pair.");
    return existingRequest;
  }

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
export async function updateChatRequestStatus(requestId: string, status: 'accepted' | 'declined' | 'closed') {
    const [updatedRequest] = await db.update(chatRequests)
        .set({ status, updatedAt: new Date() })
        .where(eq(chatRequests.id, requestId))
        .returning();
    
    revalidatePath('/coach-dashboard');
    revalidatePath('/coaches');
    revalidatePath('/coach');

    return updatedRequest;
}


/**
 * Sends a message from one user to another within a chat request context.
 * @param chatRequestId The ID of the chat request.
 * @param senderId The ID of the user sending the message.
 * @param content The text content of the message.
 * @returns The newly created message object.
 */
export async function sendMessage(chatRequestId: string, senderId: string, content: string) {
    const [newMessage] = await db.insert(chatMessages).values({
        chatRequestId,
        senderId,
        content,
        isRead: false,
    }).returning();
    
    // Revalidate the chat page for both users.
    revalidatePath('/coach');

    return newMessage;
}

/**
 * Fetches all messages for a given chat request.
 * @param chatRequestId The ID of the chat request.
 * @returns An array of message objects, ordered by creation date.
 */
export async function getMessagesForChat(chatRequestId: string) {
    return await db.query.chatMessages.findMany({
        where: eq(chatMessages.chatRequestId, chatRequestId),
        orderBy: desc(chatMessages.createdAt)
    });
}

/**
 * Finds the currently active chat session for a given user (customer or coach).
 * An active session is one that is 'accepted'.
 * @param userId The ID of the user.
 * @returns The chat request and the chat partner, or null if no active chat is found.
 */
export async function getActiveChatSession(userId: string): Promise<{ session: typeof chatRequests.$inferSelect, partner: User } | null> {
    const session = await db.query.chatRequests.findFirst({
        where: and(
            or(eq(chatRequests.customerId, userId), eq(chatRequests.coachId, userId)),
            eq(chatRequests.status, 'accepted')
        ),
        orderBy: desc(chatRequests.updatedAt)
    });

    if (!session) {
        return null;
    }

    const partnerId = session.coachId === userId ? session.customerId : session.coachId;
    const partner = await db.query.users.findFirst({ where: eq(users.id, partnerId) });

    if (!partner) {
        return null;
    }
    
    return { session, partner };
}

/**
 * Marks messages in a chat as read for a specific recipient.
 * @param chatRequestId The ID of the chat request.
 * @param recipientId The ID of the user for whom messages should be marked as read.
 */
export async function markMessagesAsRead(chatRequestId: string, recipientId: string) {
    await db.update(chatMessages)
        .set({ isRead: true })
        .where(and(
            eq(chatMessages.chatRequestId, chatRequestId),
            ne(chatMessages.senderId, recipientId), // Only mark messages sent by the other person as read
            eq(chatMessages.isRead, false)
        ));
    
    revalidatePath('/(main)/layout'); // To update the badge
}

/**
 * Gets the count of all unread messages for a user across all their chats.
 * @param userId The ID of the user.
 * @returns The total number of unread messages.
 */
export async function getUnreadMessageCountForUser(userId: string): Promise<number> {
    const activeChats = await db.select({ id: chatRequests.id })
        .from(chatRequests)
        .where(and(
            or(eq(chatRequests.customerId, userId), eq(chatRequests.coachId, userId)),
            eq(chatRequests.status, 'accepted')
        ));
    
    if (activeChats.length === 0) {
        return 0;
    }

    const chatIds = activeChats.map(c => c.id);

    const [result] = await db.select({
        value: count()
    }).from(chatMessages)
    .where(and(
        or(...chatIds.map(id => eq(chatMessages.chatRequestId, id))),
        ne(chatMessages.senderId, userId),
        eq(chatMessages.isRead, false)
    ));
    
    return result.value;
}
