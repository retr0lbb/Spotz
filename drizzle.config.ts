import "dotenv/config"

import {defineConfig} from "drizzle-kit"

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/drizzle/schemas/index.ts",
    out: "./migrations/drizzle",
    dbCredentials:{
        url: process.env.DATABASE_URL!
    }
})