
import { pgTable, text, timestamp, pgEnum, jsonb, boolean } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const roleEnum = pgEnum('role', ['customer', 'coach']);
export const chatRequestStatusEnum = pgEnum('chat_request_status', ['pending', 'accepted', 'declined', 'closed']);

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  fullName: text('full_name'),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  role: roleEnum('role').default('customer').notNull(),
  isAvailable: boolean('is_available').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const languageEnum = pgEnum('language', ['en', 'hi', 'mr']);

export const adviceSessions = pgTable('advice_sessions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').references(() => users.id),
  promptKey: text('prompt_key').notNull(),
  formData: jsonb('form_data').notNull(),
  language: languageEnum('language').notNull(),
  generatedAdvice: text('generated_advice').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const chatRequests = pgTable('chat_requests', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    customerId: text('customer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    coachId: text('coach_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    status: chatRequestStatusEnum('status').default('pending').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

export const chatMessages = pgTable('chat_messages', {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    chatRequestId: text('chat_request_id').notNull().references(() => chatRequests.id, { onDelete: 'cascade' }),
    senderId: text('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    isRead: boolean('is_read').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});


export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// This type is used across the app. We simulate the income/expenses fields
// for dashboard compatibility by extracting them from the formData JSON.
export type AdviceSession = Omit<typeof adviceSessions.$inferSelect, 'formData'> & {
  formData: Record<string, any>;
  income: number;
  expenses: number;
};

export type NewAdviceSession = typeof adviceSessions.$inferInsert;

export type ChatRequest = typeof chatRequests.$inferSelect;
export type NewChatRequest = typeof chatRequests.$inferInsert;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
