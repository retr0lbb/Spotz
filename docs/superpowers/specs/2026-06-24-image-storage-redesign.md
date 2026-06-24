# Image Storage Redesign

**Date:** 2026-06-24
**Project:** Spotz
**Scope:** Database schema redesign for S3 signed URL image uploads

## Current Problems

1. `spots_images` mixes file metadata with spot linkage in one table
2. No `status` field to track the signed URL upload lifecycle (pending → uploaded → failed)
3. Dead duplicate file `image-metadata.schema.ts` not exported from barrel
4. Future needs (user attribution, banner flag) would require breaking changes

## New Schema

### `images_metadata` — pure image file catalog

No spot-specific fields. Only describes the file itself.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `s3_key` | `varchar(512)` | NOT NULL, UNIQUE | S3 object key, known at record creation |
| `mime_type` | `varchar(50)` | nullable | Filled after upload |
| `size_bytes` | `integer` | nullable | Filled after upload |
| `status` | `varchar(20)` | NOT NULL, default `'pending'` | pending → uploaded → failed |
| `created_at` | `timestamp` | NOT NULL, default `now()` | |
| `updated_at` | `timestamp` | NOT NULL, default `now()` | |

### `spots_images` — link table

1→n: one spot has many images.
1→1: each image belongs to at most one spot (enforced by UNIQUE on image_id).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `spot_id` | `uuid` | NOT NULL, FK → spots.id ON DELETE CASCADE | |
| `image_id` | `uuid` | NOT NULL, UNIQUE, FK → images_metadata.id ON DELETE CASCADE | Unique enforces 1-spot-per-image |
| `created_at` | `timestamp` | NOT NULL, default `now()` | |

Future additions (not in this spec): `display_order`, `is_banner` on spots_images; `uploaded_by` on images_metadata.

## Files to change

| Action | File |
|--------|------|
| Create | `src/drizzle/schemas/images-metadata.schema.ts` |
| Rewrite | `src/drizzle/schemas/spots-images.schema.ts` (simplify to link table) |
| Update | `src/drizzle/schemas/index.ts` (export new schema, drop dead export) |
| Delete | `src/drizzle/schemas/image-metadata.schema.ts` |

## Files NOT changed

`spots.schema.ts`, `spots/*`, `app.*`, `drizzle.module.ts` — untouched.

## Migration

- `CREATE TABLE images_metadata (...)` — fresh table
- Drop existing `spots_images` → recreate as link table
- On a fresh dev DB this is lossless. With production data, a data migration would be needed.
