import { uuid, text, pgTable } from 'drizzle-orm/pg-core';

export const usersTable = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  username: text().notNull(),
  email: text().unique().notNull(),
  passwordHash: text('password_hash'),
});
