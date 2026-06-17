import { uuid } from "drizzle-orm/pg-core";
import { pgTable, varchar } from "drizzle-orm/pg-core";

export const spotsTable = pgTable("spots", {
    id: uuid().primaryKey().defaultRandom(),
    alias: varchar().notNull(),
    description: varchar()
    
})