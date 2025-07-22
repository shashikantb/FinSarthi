
"use server";

import { db } from "@/lib/db";
import { users, type NewUser } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Creates a new user in the database.
 * @param data The data for the new user.
 * @returns The newly created user.
 */
export async function createUser(data: Omit<NewUser, 'id' | 'createdAt'>) {
    const valuesToInsert: NewUser = {
      ...data,
      passwordHash: data.passwordHash, // In a real app, this should be a secure hash
    };
    const [newUser] = await db.insert(users).values(valuesToInsert).returning();
    return newUser;
}

/**
 * Fetches a user by their ID.
 * @param id The ID of the user to fetch.
 * @returns The user object or null if not found.
 */
export async function getUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
}

/**
 * Fetches a user by their email and password.
 * NOTE: This is an insecure method for prototyping only.
 * A real application should use a secure authentication provider or a robust password hashing and comparison strategy.
 * @param email The user's email.
 * @param passwordHash The user's plain text password (for this prototype).
 * @param role The user's role.
 * @returns The user object or null if not found or if the password doesn't match.
 */
export async function getUserByCredentials(email: string, passwordHash: string, role: 'customer' | 'coach') {
  const [user] = await db.select()
    .from(users)
    .where(
      and(
        eq(users.email, email),
        eq(users.passwordHash, passwordHash), // Direct password comparison (INSECURE)
        eq(users.role, role)
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
    await db.update(users).set({ isAvailable }).where(eq(users.id, userId));
    // This ensures that anyone viewing the list of coaches will see the updated status.
    revalidatePath('/coaches');
}
