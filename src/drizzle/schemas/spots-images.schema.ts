import { uuid, pgTable, timestamp } from 'drizzle-orm/pg-core';
import { spotsTable } from './spots.schema';
import { imagesMetadata } from './images-metadata.schema';

export const spotsImages = pgTable('spots_images', {
  id: uuid().primaryKey().defaultRandom(),
  spotId: uuid('spot_id')
    .notNull()
    .references(() => spotsTable.id, { onDelete: 'cascade' }),
  imageId: uuid('image_id')
    .notNull()
    .unique()
    .references(() => imagesMetadata.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
