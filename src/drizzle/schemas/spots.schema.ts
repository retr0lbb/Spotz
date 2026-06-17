import { unique } from "drizzle-orm/pg-core";
import { timestamp } from "drizzle-orm/pg-core";
import { index } from "drizzle-orm/pg-core";
import { uuid, text, pgTable, varchar, numeric} from "drizzle-orm/pg-core";


export const spotsTable = pgTable("spots", {
    id: uuid().primaryKey().defaultRandom(),
    alias: varchar().notNull(),
    description: varchar(),

    lat: numeric("lat", {
        precision: 9,
        scale: 6
    }).notNull(),
    lon: numeric("lon", {
        precision: 9,
        scale: 6
    }).notNull(),
    address: text(),
    createdAt: timestamp().defaultNow(),

}, 
    (table) => [
        index("spots_lat_lon_idx").on(table.lat, table.lon),

        unique("spots_alias_lat_lon_unique").on(
            table.alias,
            table.lon,
            table.lat
        )
    ]
)

