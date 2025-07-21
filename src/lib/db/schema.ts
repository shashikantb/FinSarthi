
import { pgTable, text, timestamp, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  fullName: text('full_name'),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'), 
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
