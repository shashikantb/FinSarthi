
"use server";

import { db } from "@/lib/db";
import { type NewChatRequest, type User, type ChatRequest, type ChatMessage } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { createId } from "@paralleldrive/cuid2";

/**
 * Creates a new chat request from a customer to a coach.
 * @param customerId The ID of the customer initiating the request.
 * @param coachId The ID of the coach receiving the request.
 * @returns The newly created chat request object.
 */
export async function createChatRequest(customerId: string, coachId: string) {
  // Check if an active request already exists
  const existingRequest = db.chatRequests.find(r =>
    r.customerId === customerId &&
    r.coachId === coachId &&
    r.status !== 'declined' &&
    r.status !== 'closed'
  );

  if (existingRequest) {
    console.log("An active chat request already exists for this pair.");
    return existingRequest;
  }

  const newRequest: ChatRequest = {
    id: createId(),
    customerId,
    coachId,
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  db.chatRequests.push(newRequest);
  
  // Revalidate the coach's dashboard to show the new request
  revalidatePath('/coach-dashboard');

  return newRequest;
}

/**
 * Fetches all chat requests for a specific coach, including customer details.
 * @param coachId The ID of the coach.
 * @returns An array of chat requests with associated customer information.
 */
export async function getChatRequestsForCoach(coachId: string) {
    const requests = db.chatRequests
        .filter(r => r.coachId === coachId)
        .map(request => {
            const customer = db.users.find(u => u.id === request.customerId);
            return {
                request,
                customer: customer ? { id: customer.id, fullName: customer.fullName, email: customer.email } : null
            };
        })
        .filter(item => item.customer !== null) // Ensure customer was found
        .sort((a, b) => b.request.createdAt.getTime() - a.request.createdAt.getTime());
    
    return requests as { request: ChatRequest; customer: Pick<User, "id" | "fullName" | "email">; }[];
}


/**
 * Fetches all chat requests initiated by a specific customer.
 * @param customerId The ID of the customer.
 * @returns An array of chat requests.
 */
export async function getChatRequestsForCustomer(customerId: string) {
    const requests = db.chatRequests
        .filter(r => r.customerId === customerId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return requests;
}

/**
 * Updates the status of a chat request.
 * @param requestId The ID of the chat request to update.
 * @param status The new status ('accepted' or 'declined').
 */
export async function updateChatRequestStatus(requestId: string, status: 'accepted' | 'declined' | 'closed') {
    const requestIndex = db.chatRequests.findIndex(r => r.id === requestId);
    if (requestIndex !== -1) {
        db.chatRequests[requestIndex].status = status;
        db.chatRequests[requestIndex].updatedAt = new Date();
        
        revalidatePath('/coach-dashboard');
        revalidatePath('/coaches');
        revalidatePath('/coach');
        
        return db.chatRequests[requestIndex];
    }
    return null;
}

/**
 * Sends a message from one user to another within a chat request context.
 * @param chatRequestId The ID of the chat request.
 * @param senderId The ID of the user sending the message.
 * @param content The text content of the message.
 * @returns The newly created message object.
 */
export async function sendMessage(chatRequestId: string, senderId: string, content: string) {
    const newMessage: ChatMessage = {
        id: createId(),
        chatRequestId,
        senderId,
        content,
        isRead: false,
        createdAt: new Date(),
    };
    db.chatMessages.push(newMessage);
    
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
    return db.chatMessages
        .filter(m => m.chatRequestId === chatRequestId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

/**
 * Finds the currently active chat session for a given user (customer or coach).
 * An active session is one that is 'accepted'.
 * @param userId The ID of the user.
 * @returns The chat request and the chat partner, or null if no active chat is found.
 */
export async function getActiveChatSession(userId: string): Promise<{ session: ChatRequest, partner: User } | null> {
    const session = db.chatRequests
        .filter(r => (r.customerId === userId || r.coachId === userId) && r.status === 'accepted')
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];

    if (!session) {
        return null;
    }

    const partnerId = session.coachId === userId ? session.customerId : session.coachId;
    const partner = db.users.find(u => u.id === partnerId);

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
    db.chatMessages.forEach(message => {
        if (
            message.chatRequestId === chatRequestId &&
            message.senderId !== recipientId &&
            !message.isRead
        ) {
            message.isRead = true;
        }
    });
    revalidatePath('/(main)/layout'); // To update the badge
}

/**
 * Gets the count of all unread messages for a user across all their chats.
 * @param userId The ID of the user.
 * @returns The total number of unread messages.
 */
export async function getUnreadMessageCountForUser(userId: string): Promise<number> {
    const activeChatIds = db.chatRequests
        .filter(r => (r.customerId === userId || r.coachId === userId) && r.status === 'accepted')
        .map(r => r.id);
    
    if (activeChatIds.length === 0) {
        return 0;
    }

    const unreadCount = db.chatMessages.filter(m =>
        activeChatIds.includes(m.chatRequestId) &&
        m.senderId !== userId &&
        !m.isRead
    ).length;
    
    return unreadCount;
}
