import { uuid, text, pgTable } from 'drizzle-orm/pg-core';
import { imagesMetadata } from './images-metadata.schema';

export const usersTable = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  username: text().notNull(),
  email: text().unique().notNull(),
  passwordHash: text('password_hash'),
  pictureId: uuid().references(() => imagesMetadata.id, {onDelete: "set null"}).unique(),
});
