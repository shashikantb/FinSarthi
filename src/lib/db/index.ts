
// src/lib/db/index.ts
/**
 * @fileOverview In-memory database service for the application.
 * This file replaces the PostgreSQL connection and provides a simple,
 * mock database using in-memory arrays. It's pre-populated with
 * sample data for users, coaches, and chat history.
 */

import type { User, NewUser, AdviceSession, NewAdviceSession, ChatRequest, NewChatRequest, ChatMessage, NewChatMessage } from './schema';
import { createId } from '@paralleldrive/cuid2';

const FAKE_PASSWORD_SALT = "somesalt";

// --- In-Memory Data Store ---
export const db = {
    users: [] as User[],
    adviceSessions: [] as AdviceSession[],
    chatRequests: [] as ChatRequest[],
    chatMessages: [] as ChatMessage[],
};

// --- Mock Data Initialization ---

// Create some coaches
const coach1: User = {
    id: 'coach_1',
    fullName: 'Priya Sharma',
    email: 'priya@finsteps.com',
    phone: '9876543210',
    passwordHash: 'coachpass1' + FAKE_PASSWORD_SALT,
    age: 35, city: 'Mumbai', country: 'India', gender: 'female',
    role: 'coach',
    isAvailable: true,
    createdAt: new Date(),
};
const coach2: User = {
    id: 'coach_2',
    fullName: 'Rahul Verma',
    email: 'rahul@finsteps.com',
    phone: '9876543211',
    passwordHash: 'coachpass2' + FAKE_PASSWORD_SALT,
    age: 42, city: 'Delhi', country: 'India', gender: 'male',
    role: 'coach',
    isAvailable: true,
    createdAt: new Date(),
};
const coach3: User = {
    id: 'coach_3',
    fullName: 'Anjali Mehta',
    email: 'anjali@finsteps.com',
    phone: '9876543212',
    passwordHash: 'coachpass3' + FAKE_PASSWORD_SALT,
    age: 38, city: 'Bangalore', country: 'India', gender: 'female',
    role: 'coach',
    isAvailable: false,
    createdAt: new Date(),
};
db.users.push(coach1, coach2, coach3);

// Create some customers
const customer1: User = {
    id: 'customer_1',
    fullName: 'Amit Kumar',
    email: 'amit@example.com',
    phone: '8765432109',
    passwordHash: null,
    age: 28, city: 'Pune', country: 'India', gender: 'male',
    role: 'customer',
    isAvailable: false,
    createdAt: new Date(),
};
const customer2: User = {
    id: 'customer_2',
    fullName: 'Sunita Patil',
    email: 'sunita@example.com',
    phone: '8765432108',
    passwordHash: null,
    age: 32, city: 'Nagpur', country: 'India', gender: 'female',
    role: 'customer',
    isAvailable: false,
    createdAt: new Date(),
};
db.users.push(customer1, customer2);


// --- Helper Functions to Mimic Drizzle ---

export const getDbInstance = () => {
    // In-memory db is always available. This function maintains API compatibility.
    return db;
};
