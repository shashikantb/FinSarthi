
"use server";

import { db } from "@/lib/db";
import { adviceSessions, type NewAdviceSession } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Creates a new advice session in the database.
 * @param data The data for the new advice session.
 * @returns The newly created advice session.
 */
export async function createAdviceSession(data: Omit<NewAdviceSession, 'id' | 'createdAt' | 'userId'>) {
  const [newSession] = await db.insert(adviceSessions).values(data).returning();
  return newSession;
}

/**
 * Associates an anonymous advice session with a user ID after they sign up.
 * @param sessionId The ID of the advice session.
 * @param userId The ID of the user.
 */
export async function associateSessionWithUser(sessionId: string, userId: string) {
  await db.update(adviceSessions)
    .set({ userId })
    .where(eq(adviceSessions.id, sessionId));

  // Revalidate paths that show this data to reflect the change immediately.
  revalidatePath('/dashboard');
  revalidatePath('/advice');
}

/**
 * Fetches the most recent advice session for a given user.
 * @param userId The ID of the user.
 * @returns The latest advice session, or null if none exists.
 */
export async function getLatestAdviceSessionForUser(userId: string) {
  const [latestSession] = await db
    .select()
    .from(adviceSessions)
    .where(eq(adviceSessions.userId, userId))
    .orderBy(desc(adviceSessions.createdAt))
    .limit(1);
  
  return latestSession ?? null;
}

/**
 * Fetches all advice sessions for a given user.
 * @param userId The ID of the user.
 * @returns An array of advice sessions.
 */
export async function getAdviceHistoryForUser(userId: string) {
    const history = await db
        .select()
        .from(adviceSessions)
        .where(eq(adviceSessions.userId, userId))
        .orderBy(desc(adviceSessions.createdAt));
    
    return history;
}
