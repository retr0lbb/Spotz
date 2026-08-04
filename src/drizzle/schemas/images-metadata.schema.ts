import {
  uuid,
  pgTable,
  varchar,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core';

export const imagesMetadata = pgTable('images_metadata', {
  id: uuid().primaryKey().defaultRandom(),
  s3Key: varchar('s3_key', { length: 512 }).notNull().unique(),
  mimeType: varchar('mime_type', { length: 50 }),
  sizeBytes: integer('size_bytes'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

