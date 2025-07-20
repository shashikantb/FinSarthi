
import { pgTable, text, timestamp, varchar, real, pgEnum } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// For this prototype, we'll use a mock user ID.
// In a real application, this would come from an authentication system.
export const MOCK_USER_ID = 'user_2i5uXpY7zQq3wEa8tYn9rJ6vBcD';

export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  fullName: text('full_name'),
  email: text('email').notNull().unique(),
  // In a real app, never store plain text passwords. This would be a hash.
  passwordHash: text('password_hash'), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const literacyEnum = pgEnum('literacy_level', ['beginner', 'intermediate', 'advanced']);
export const languageEnum = pgEnum('language', ['en', 'hi', 'mr']);

export const adviceSessions = pgTable('advice_sessions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').references(() => users.id),
  income: real('income').notNull(),
  expenses: real('expenses').notNull(),
  financialGoals: text('financial_goals').notNull(),
  literacyLevel: literacyEnum('literacy_level').notNull(),
  language: languageEnum('language').notNull(),
  generatedAdvice: text('generated_advice').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type AdviceSession = typeof adviceSessions.$inferSelect;
export type NewAdviceSession = typeof adviceSessions.$inferInsert;
