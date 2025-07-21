
"use server";

import { db } from "@/lib/db";
import { adviceSessions, users, type NewAdviceSession } from "@/lib/db/schema";
import { eq, desc, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Gets the most recent user from the database.
 * This is a stand-in for a real authentication system.
 * @returns The most recently created user.
 */
async function getMostRecentUser() {
    const [latestUser] = await db.select().from(users).orderBy(desc(users.createdAt)).limit(1);
    return latestUser;
}

/**
 * Creates a new advice session.
 * If isLoggedIn is false, it creates an anonymous session (userId is null).
 * If isLoggedIn is true, it associates it with the most recent user.
 * @param data The data for the new advice session.
 * @param isLoggedIn A flag to indicate if we should link to the most recent user.
 * @returns The newly created advice session.
 */
export async function createAdviceSessionForCurrentUser(
  data: Omit<NewAdviceSession, 'id' | 'createdAt' | 'userId'>,
  isLoggedIn: boolean
) {
  let valuesToInsert: NewAdviceSession = {
    ...data,
    userId: null,
  };

  if (isLoggedIn) {
    const recentUser = await getMostRecentUser();
    if (recentUser) {
      valuesToInsert.userId = recentUser.id;
    }
  }

  const [newSession] = await db.insert(adviceSessions).values(valuesToInsert).returning();
  
  if (isLoggedIn) {
      revalidatePath('/advice');
      revalidatePath('/dashboard');
  }

  // Add mock income/expenses for dashboard compatibility
  const formData = newSession.formData as { income?: string, expenses?: string };

  return {
    ...newSession,
    income: Number(formData?.income) || 0,
    expenses: Number(formData?.expenses) || 0,
  };
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

  revalidatePath('/dashboard');
  revalidatePath('/advice');
}


/**
 * Fetches the most recent advice session for a given user.
 * If no userId is provided, it fetches for the most recent user.
 * @param userId The ID of the user.
 * @returns The latest advice session, or null if none exists.
 */
export async function getLatestAdviceSessionForUser(userId?: string) {
  let targetUserId = userId;
  if (!targetUserId) {
    const recentUser = await getMostRecentUser();
    if (!recentUser) return null;
    targetUserId = recentUser.id;
  }

  const [latestSession] = await db
    .select()
    .from(adviceSessions)
    .where(eq(adviceSessions.userId, targetUserId))
    .orderBy(desc(adviceSessions.createdAt))
    .limit(1);
  
  if (!latestSession) return null;

  // Add mock income/expenses for dashboard compatibility
  const formData = latestSession.formData as { income?: string, expenses?: string };
  return {
      ...latestSession,
      income: Number(formData?.income) || 0,
      expenses: Number(formData?.expenses) || 0,
  }
}

/**
 * Fetches all advice sessions for a given user.
 * If no userId is provided, it fetches for the most recent user.
 * @param userId The ID of the user.
 * @returns An array of advice sessions.
 */
export async function getAdviceHistoryForUser(userId?: string) {
    let targetUserId = userId;
    if (!targetUserId) {
        const recentUser = await getMostRecentUser();
        if (!recentUser) return [];
        targetUserId = recentUser.id;
    }
    const history = await db
        .select()
        .from(adviceSessions)
        .where(eq(adviceSessions.userId, targetUserId))
        .orderBy(desc(adviceSessions.createdAt));
    
    // Add mock income/expenses for dashboard compatibility
    return history.map(item => {
        const formData = item.formData as { income?: string, expenses?: string };
        return {
            ...item,
            income: Number(formData?.income) || 0,
            expenses: Number(formData?.expenses) || 0,
        }
    });
}
