import { pgTable, varchar } from "drizzle-orm/pg-core";

export const spotsTable = pgTable("spots", {
    id: varchar().primaryKey(),
    //
})