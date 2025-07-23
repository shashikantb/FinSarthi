
"use server";

import { getDbInstance } from "@/lib/db";
import { users, type NewUser } from "@/lib/db/schema";
import { eq, and, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const FAKE_PASSWORD_SALT = "somesalt";

/**
 * Creates a new user in the database.
 * @param data The data for the new user.
 * @returns The newly created user.
 */
export async function createUser(data: Omit<NewUser, 'id' | 'createdAt'>) {
    const db = getDbInstance();
    if (!db) throw new Error("Database connection not available.");

    const valuesToInsert: NewUser = { ...data };

    // "Hash" the password if it exists. In a real app, use a strong hashing library like bcrypt.
    if (data.passwordHash) {
        valuesToInsert.passwordHash = data.passwordHash + FAKE_PASSWORD_SALT;
    }

    const [newUser] = await db.insert(users).values(valuesToInsert).returning();
    return newUser;
}

/**
 * Fetches a user by their ID.
 * @param id The ID of the user to fetch.
 * @returns The user object or null if not found.
 */
export async function getUserById(id: string) {
  const db = getDbInstance();
  if (!db) return null;

  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
}

/**
 * Finds a user by their email or phone number.
 * @param identifier The user's email or phone.
 * @returns The user object or null if not found.
 */
export async function findUserByEmailOrPhone(identifier: string) {
    if (!identifier) return null;
    
    const db = getDbInstance();
    if (!db) {
        console.log("No DB connection, returning null for user lookup.");
        return null; // Return null if DB is not available
    }

    const [user] = await db.select()
        .from(users)
        .where(
            or(
                eq(users.email, identifier),
                eq(users.phone, identifier)
            )
        )
        .limit(1);
    return user ?? null;
}

/**
 * Fetches all coaches who are currently available.
 * @returns An array of available coach user objects.
 */
export async function getAvailableCoaches() {
    const db = getDbInstance();
    if (!db) return [];

    const availableCoaches = await db.select()
        .from(users)
        .where(
            and(
                eq(users.role, 'coach'),
                eq(users.isAvailable, true)
            )
        )
        .orderBy(users.fullName);
    return availableCoaches;
}

/**
 * Updates the availability status of a user (typically a coach).
 * @param userId The ID of the user to update.
 * @param isAvailable The new availability status.
 */
export async function updateUserAvailability(userId: string, isAvailable: boolean) {
    const db = getDbInstance();
    if (!db) return;

    await db.update(users).set({ isAvailable }).where(eq(users.id, userId));
    revalidatePath('/coaches');
}
