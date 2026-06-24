# Image Storage Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split image storage into two tables: `images_metadata` (file catalog) and `spots_images` (link table), with status tracking for signed URL upload lifecycle.

**Architecture:** No new dependencies. Pure Drizzle schema changes — new table `images_metadata`, existing `spots_images` simplified to a link table, dead duplicate file removed.

**Tech Stack:** NestJS 11, Drizzle ORM 0.45 (node-postgres), PostgreSQL

## Global Constraints

- Stick to existing code style: `singleQuote`, `trailingComma: "all"`, camelCase JS props with snake_case DB columns
- Type imports use `type` keyword: `import { DRIZZLE, type DrizzleDB }`
- Drizzle column methods: `.notNull()`, `.defaultNow()`, `.primaryKey().defaultRandom()`
- FK references use `onDelete: 'cascade'`
- Do NOT touch: `spots.schema.ts`, `spots/*`, `app.*`, `drizzle.module.ts`

---

### Task 1: Create `images-metadata.schema.ts`

**Files:**
- Create: `src/drizzle/schemas/images-metadata.schema.ts`

**Interfaces:**
- Produces: exports `imagesMetadata` table constant

- [ ] **Create the schema file**

Write `src/drizzle/schemas/images-metadata.schema.ts`:

```ts
import { uuid, pgTable, varchar, integer, timestamp } from 'drizzle-orm/pg-core';

export const imagesMetadata = pgTable('images_metadata', {
  id: uuid().primaryKey().defaultRandom(),
  s3Key: varchar('s3_key', { length: 512 }).notNull().unique(),
  mimeType: varchar('mime_type', { length: 50 }),
  sizeBytes: integer('size_bytes'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

- [ ] **Verify file compiles**

Run: `pnpm run build`
Expected: No errors.

- [ ] **Commit**

```bash
git add src/drizzle/schemas/images-metadata.schema.ts
git commit -m "feat: create images_metadata table schema"
```

---

### Task 2: Rewrite `spots-images.schema.ts` as link table

**Files:**
- Modify: `src/drizzle/schemas/spots-images.schema.ts` (full rewrite)

**Interfaces:**
- Consumes: `imagesMetadata` from `./images-metadata.schema`, `spotsTable` from `./spots.schema`
- Produces: exports `spotsImages` table constant

- [ ] **Rewrite the file**

Replace entire content of `src/drizzle/schemas/spots-images.schema.ts`:

```ts
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
```

- [ ] **Verify file compiles**

Run: `pnpm run build`
Expected: No errors.

- [ ] **Commit**

```bash
git add src/drizzle/schemas/spots-images.schema.ts
git commit -m "refactor: simplify spots_images to link table"
```

---

### Task 3: Update barrel export and delete dead file

**Files:**
- Modify: `src/drizzle/schemas/index.ts`
- Delete: `src/drizzle/schemas/image-metadata.schema.ts`

- [ ] **Update `index.ts` to export new schema and remove spotsImages re-export mismatch**

Rewrite `src/drizzle/schemas/index.ts`:

```ts
import { spotsTable } from './spots.schema';
import { spotsImages } from './spots-images.schema';
import { imagesMetadata } from './images-metadata.schema';

export { spotsTable, spotsImages, imagesMetadata };
```

- [ ] **Delete the dead duplicate file**

Delete `src/drizzle/schemas/image-metadata.schema.ts`.

- [ ] **Verify compiles**

Run: `pnpm run build`
Expected: No errors.

- [ ] **Commit**

```bash
git add src/drizzle/schemas/index.ts
git rm src/drizzle/schemas/image-metadata.schema.ts
git commit -m "chore: update barrel exports, remove dead schema file"
```

---

### Task 4: Generate and run migration

- [ ] **Generate migration**

Run: `pnpm run db:generate`
Expected: New migration files in `migrations/drizzle/`.

- [ ] **Review generated SQL**

Open the latest migration `.sql` file — should contain:
- `CREATE TABLE IF NOT EXISTS "images_metadata" (...)` with all columns
- `DROP TABLE "spots_images"` followed by `CREATE TABLE "spots_images" (...)` with new shape

- [ ] **Run migration** (dev DB must be up)

```bash
docker compose up -d
pnpm run db:migrate
```

Expected: Tables created, no errors.

- [ ] **Commit**

```bash
git add migrations/
git commit -m "feat: add migration for image storage redesign"
```
