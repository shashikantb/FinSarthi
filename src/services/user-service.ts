
"use server";

import { db } from "@/lib/db";
import { users, type NewUser } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
