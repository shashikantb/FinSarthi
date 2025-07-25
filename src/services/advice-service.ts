
"use server";

import { db } from "@/lib/db";
import { type NewAdviceSession, type AdviceSession as RawAdviceSession, User } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { generatePersonalizedAdvice, GeneratePersonalizedAdviceInput } from "@/ai/flows/generate-personalized-advice";
import { createId } from "@paralleldrive/cuid2";

// Redefine AdviceSession locally to remove income/expenses which are no longer part of the flow.
export type AdviceSession = Omit<RawAdviceSession, 'formData'> & {
  formData: Record<string, any>;
};

/**
 * Creates a new advice session.
 * If isLoggedIn is false, it creates an anonymous session (userId is null).
 * If isLoggedIn is true, it associates it with the user.
 * @param data The data for the new advice session.
 * @param isLoggedIn A flag to indicate if we should link to the most recent user.
 * @returns The newly created advice session.
 */
export async function createAdviceSessionForCurrentUser(
  data: Omit<GeneratePersonalizedAdviceInput, 'language' | 'age' | 'gender' | 'city' | 'country'>,
  user: User | null,
  language: GeneratePersonalizedAdviceInput['language'],
  isLoggedIn: boolean
): Promise<AdviceSession> {
  
  const adviceInput: GeneratePersonalizedAdviceInput = {
    ...data,
    language,
    age: user?.age ?? undefined,
    gender: user?.gender ?? undefined,
    city: user?.city ?? undefined,
    country: user?.country ?? undefined,
  };
  
  const adviceResult = await generatePersonalizedAdvice(adviceInput);

  const newSession: AdviceSession = {
    id: createId(),
    promptKey: data.promptKey,
    formData: data.formData,
    language,
    generatedAdvice: adviceResult.advice,
    userId: isLoggedIn ? user?.id ?? null : null,
    createdAt: new Date(),
  };

  db.adviceSessions.push(newSession);
  
  if (isLoggedIn) {
      revalidatePath('/advice');
  }

  return newSession;
}

/**
 * Associates an anonymous advice session with a user ID after they sign up.
 * @param sessionId The ID of the advice session.
 * @param userId The ID of the user.
 */
export async function associateSessionWithUser(sessionId: string, userId: string) {
  const sessionIndex = db.adviceSessions.findIndex(s => s.id === sessionId);
  if (sessionIndex !== -1) {
    db.adviceSessions[sessionIndex].userId = userId;
    revalidatePath('/advice');
  }
}

/**
 * Fetches the most recent advice session for a given user.
 * @param userId The ID of the user.
 * @returns The latest advice session, or null if none exists.
 */
export async function getLatestAdviceSessionForUser(userId: string): Promise<AdviceSession | null> {
  const userSessions = db.adviceSessions
    .filter(s => s.userId === userId && s.promptKey !== 'ai_chat_session')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  
  return userSessions[0] ?? null;
}

/**
 * Fetches all advice sessions for a given user.
 * @param userId The ID of the user.
 * @returns An array of advice sessions.
 */
export async function getAdviceHistoryForUser(userId: string): Promise<AdviceSession[]> {
    const userSessions = db.adviceSessions
        .filter(s => s.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return userSessions;
}
