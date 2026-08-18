import { uuid, pgTable, timestamp, index } from 'drizzle-orm/pg-core';
import { spotsTable } from './spots.schema';
import { imagesMetadata } from './images-metadata.schema';
import { usersTable } from './user.schema';
import { DrizzleDB } from '../drizzle.module';
import { sql } from 'drizzle-orm';


export const spotsImages = pgTable(
  'spots_images',
  {
    id: uuid().primaryKey().defaultRandom(),
    spotId: uuid('spot_id')
      .notNull()
      .references(() => spotsTable.id, { onDelete: 'cascade' }),
    imageId: uuid('image_id')
      .notNull()
      .unique()
      .references(() => imagesMetadata.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    uploadedBy: uuid('uploaded_by').references(() => usersTable.id, {
      onDelete: 'set null',
    }),
  },
  (table) => [
    index('spots_images_spot_id_created_at_id_idx').on(
      table.spotId,
      table.createdAt.desc(),
      table.id.desc(),
    ),
  ],
);

export async function isWithinDistance(
  spotId: string,
  lat: number,
  lng: number,
  meters: number,
  db: DrizzleDB,
) {
  const result = await db.execute(sql`
    SELECT ST_DWithin(
      ${spotsTable.location},
      ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
      ${meters}
    ) as within_range
    FROM ${spotsTable}
    WHERE id = ${spotId}
  `);

  return result.rows[0]?.within_range ?? false;
}

export function encodeCursor(data: { createdAt: Date; id: string }): string {
  return Buffer.from(
    JSON.stringify({ createdAt: data.createdAt.toISOString(), id: data.id }),
  ).toString('base64url');
}

export function decodeCursor(cursor: string): { createdAt: Date; id: string } {
  const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString());
  return { createdAt: new Date(decoded.createdAt), id: decoded.id };
}

export function encodeSpotsCursor(data: { distance: number; id: string }): string {
  return Buffer.from(
    JSON.stringify({ distance: data.distance, id: data.id }),
  ).toString('base64url');
}

export function decodeSpotsCursor(cursor: string): { distance: number; id: string } {
  const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString());
  return { distance: Number(decoded.distance), id: decoded.id };
}