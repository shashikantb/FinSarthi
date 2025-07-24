
"use server";

import { getDbInstance } from "@/lib/db";
import { adviceSessions, users, type NewAdviceSession, type AdviceSession as RawAdviceSession, User } from "@/lib/db/schema";
import { eq, desc, isNull, and, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generatePersonalizedAdvice, GeneratePersonalizedAdviceInput } from "@/ai/flows/generate-personalized-advice";

// Redefine AdviceSession locally to remove income/expenses which are no longer part of the flow.
export type AdviceSession = Omit<RawAdviceSession, 'formData'> & {
  formData: Record<string, any>;
};


/**
 * A helper function to process a raw database session object
 * into the AdviceSession type used by the application.
 */
function processSession(session: typeof adviceSessions.$inferSelect): AdviceSession {
    const formData = (session.formData as Record<string, any>) || {};
    return {
        ...session,
        formData: formData,
    }
}


/**
 * Creates a new advice session.
 * If isLoggedIn is false, it creates an anonymous session (userId is null).
 * If isLoggedIn is true, it associates it with the user.
 * @param data The data for the new advice session.
 * @param isLoggedIn A flag to indicate if we should link to the most recent user.
 * @returns The newly created advice session.
 */
export async function createAdviceSessionForCurrentUser(
  data: Omit<GeneratePersonalizedAdviceInput, 'language'>,
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

  const db = getDbInstance();
  if (!db) {
    // If there's no DB, we can't save but we should return a mock session
    // so the onboarding flow can complete without crashing.
    const mockSession = {
      id: "temp_id",
      userId: user?.id ?? null,
      createdAt: new Date(),
      promptKey: data.promptKey,
      formData: data.formData,
      language: language,
      generatedAdvice: adviceResult.advice,
    };
    return processSession(mockSession as any);
  }

  const valuesToInsert: NewAdviceSession = {
    promptKey: data.promptKey,
    formData: data.formData,
    language,
    generatedAdvice: adviceResult.advice,
    userId: isLoggedIn ? user?.id : null,
  };

  const [newSession] = await db.insert(adviceSessions).values(valuesToInsert).returning();
  
  if (isLoggedIn) {
      revalidatePath('/advice');
  }

  return processSession(newSession);
}

/**
 * Associates an anonymous advice session with a user ID after they sign up.
 * @param sessionId The ID of the advice session.
 * @param userId The ID of the user.
 */
export async function associateSessionWithUser(sessionId: string, userId: string) {
  const db = getDbInstance();
  if (!db) return;

  await db.update(adviceSessions)
    .set({ userId })
    .where(eq(adviceSessions.id, sessionId));

  revalidatePath('/advice');
}


/**
 * Fetches the most recent advice session for a given user.
 * If no userId is provided, it fetches for the most recent user.
 * @param userId The ID of the user.
 * @returns The latest advice session, or null if none exists.
 */
export async function getLatestAdviceSessionForUser(userId: string): Promise<AdviceSession | null> {
  const db = getDbInstance();
  if (!db) return null;

  const [latestSession] = await db
    .select()
    .from(adviceSessions)
    .where(and(
        eq(adviceSessions.userId, userId),
        ne(adviceSessions.promptKey, 'ai_chat_session')
    ))
    .orderBy(desc(adviceSessions.createdAt))
    .limit(1);
  
  if (!latestSession) return null;

  return processSession(latestSession);
}

/**
 * Fetches all advice sessions for a given user.
 * @param userId The ID of the user.
 * @returns An array of advice sessions.
 */
export async function getAdviceHistoryForUser(userId: string): Promise<AdviceSession[]> {
    const db = getDbInstance();
    if (!db) return [];

    const history = await db
        .select()
        .from(adviceSessions)
        .where(eq(adviceSessions.userId, userId))
        .orderBy(desc(adviceSessions.createdAt));
    
    return history.map(processSession);
}
