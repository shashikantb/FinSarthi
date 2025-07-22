
"use server";

import { db } from "@/lib/db";
import { users, type NewUser } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Creates a new user in the database.
 * @param data The data for the new user.
 * @returns The newly created user.
 */
export async function createUser(data: NewUser) {
    const [newUser] = await db.insert(users).values(data).returning();
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
 * @returns The user object or null if not found or if the password doesn't match.
 */
export async function getUserByCredentials(email: string, passwordHash: string) {
  const [user] = await db.select()
    .from(users)
    .where(
      and(
        eq(users.email, email),
        eq(users.passwordHash, passwordHash) // Direct password comparison (INSECURE)
      )
    )
    .limit(1);
  return user ?? null;
}
