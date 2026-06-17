import { uuid, text, pgTable, varchar, date, doublePrecision, numeric, integer} from "drizzle-orm/pg-core";
import { spotsTable } from "./spots.schema";
import { timestamp } from "drizzle-orm/pg-core";


export const spotsImages = pgTable(
    "spots_images", 
    {
        id: uuid().primaryKey().defaultRandom(),
        spotId: uuid("spot_id").notNull().references(() => spotsTable.id, {onDelete: "cascade"}),
        mimeType: varchar('mime_type', { length: 50 }),
        bytes: integer("size_bytes"),
        key: varchar('key', { length: 512 }).notNull().unique(),
        alt: varchar('alt', { length: 255 }),

        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow(),
    }
)

