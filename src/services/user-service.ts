
"use server";

import { db } from "@/lib/db";
import type { NewUser, User } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { createId } from '@paralleldrive/cuid2';

const FAKE_PASSWORD_SALT = "somesalt";

/**
 * Creates a new user in the database.
 * @param data The data for the new user.
 * @returns The newly created user.
 */
export async function createUser(data: Omit<NewUser, 'id' | 'createdAt'>): Promise<User> {
    const newUser: User = {
        id: createId(),
        createdAt: new Date(),
        ...data,
        passwordHash: data.passwordHash ? data.passwordHash + FAKE_PASSWORD_SALT : null
    };

    db.users.push(newUser);
    return newUser;
}

/**
 * Fetches a user by their ID.
 * @param id The ID of the user to fetch.
 * @returns The user object or null if not found.
 */
export async function getUserById(id: string): Promise<User | null> {
  const user = db.users.find(u => u.id === id);
  return user ?? null;
}

/**
 * Finds a user by their email or phone number.
 * @param identifier The user's email or phone.
 * @returns The user object or null if not found.
 */
export async function findUserByEmailOrPhone(identifier: string): Promise<User | null> {
    if (!identifier) return null;
    const user = db.users.find(u => u.email === identifier || u.phone === identifier);
    return user ?? null;
}

/**
 * Fetches all coaches who are currently available.
 * @returns An array of available coach user objects.
 */
export async function getAvailableCoaches(): Promise<User[]> {
    const availableCoaches = db.users.filter(u => u.role === 'coach' && u.isAvailable);
    return availableCoaches.sort((a, b) => (a.fullName ?? '').localeCompare(b.fullName ?? ''));
}

/**
 * Updates the availability status of a user (typically a coach).
 * @param userId The ID of the user to update.
 * @param isAvailable The new availability status.
 */
export async function updateUserAvailability(userId: string, isAvailable: boolean) {
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex > -1) {
        db.users[userIndex].isAvailable = isAvailable;
        revalidatePath('/coaches');
    }
}
