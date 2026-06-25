import { unique } from 'drizzle-orm/pg-core';
import { customType } from 'drizzle-orm/pg-core';
import { timestamp } from 'drizzle-orm/pg-core';
import { index } from 'drizzle-orm/pg-core';
import { uuid, text, pgTable, varchar, numeric } from 'drizzle-orm/pg-core';

const geography = customType<{ data: string }>({
  dataType() {
    return 'geography(Point,4326)';
  },
  toDriver(value: string) {
    return value;
  },
});

export const spotsTable = pgTable(
  'spots',
  {
    id: uuid().primaryKey().defaultRandom(),
    alias: varchar().notNull(),
    description: varchar(),

    location: geography('location').notNull(),
    address: text(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    index('spots_location_idx').using('gist', table.location),

    unique('spots_alias_location_unique').on(table.alias, table.location),
  ],
);
