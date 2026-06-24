# Spotz — AGENTS.md

## Project

NestJS 11 + TypeScript + Drizzle ORM + PostgreSQL. Validation via Zod 4.
Package manager: pnpm. Tests: Jest 30 + ts-jest.

## Commands

```bash
pnpm run build          # nest build
pnpm run start:dev      # nest start --watch
pnpm run lint           # eslint "{src,apps,libs,test}/**/*.ts" --fix
pnpm run format         # prettier --write "src/**/*.ts" "test/**/*.ts"
pnpm run test           # jest (all unit tests, rootDir: src, regex: *.spec.ts)
pnpm run test:watch     # jest --watch
pnpm run test:cov       # jest --coverage
pnpm run test:e2e       # jest --config ./test/jest-e2e.json (regex: *.e2e-spec.ts)
pnpm run db:generate    # drizzle-kit generate
pnpm run db:migrate     # drizzle-kit migrate
pnpm run db:studio      # drizzle-kit studio
```

**Single unit test:** `pnpm run test -- --testNamePattern="pattern"` or `pnpm exec jest --testPathPattern="app.controller"`

**Single e2e test:** `pnpm exec jest --config ./test/jest-e2e.json --testPathPattern="app.e2e"`

**DB up:** `docker compose up -d` (bitnami/postgresql, user: docker, pass: docker, db: spotz, port: 5432)

## Code Style

### Imports
- Named imports from `@nestjs/common`: `{ Module, Controller, Get, Post, Body, Injectable, Inject }`
- Type imports use `type` keyword: `import { DRIZZLE, type DrizzleDB } from '...'`
- Zod: `import z from 'zod/v4';` (default import from /v4 subpath)
- Barrel re-exports via `index.ts`: `export { spotsTable, spotsImages }`
- Namespace import for all schemas in module setup: `import * as schemas from './schemas/index'`
- Relative paths for internal imports (no path aliases)

### Formatting (Prettier)
- `singleQuote: true`, `trailingComma: "all"`
- Run `pnpm run format` before committing

### ESLint rules (eslint.config.mjs)
- `@typescript-eslint/no-explicit-any`: off (any allowed)
- `@typescript-eslint/no-floating-promises`: warn
- `@typescript-eslint/no-unsafe-argument`: warn
- Prettier integrated as rule with `endOfLine: "auto"`

### Naming
| Element | Convention | Example |
|---------|-----------|---------|
| Classes | PascalCase | `SpotsController`, `AppModule` |
| Files | kebab-case | `spots.controller.ts`, `create-spot.dto.ts` |
| Types/Interfaces | PascalCase | `CreateSpotDTO`, `DrizzleDB` |
| Functions/variables | camelCase | `getHello()`, `createSpot()` |
| Constants (Symbols) | UPPER_SNAKE | `DRIZZLE`, `PG_POOL` |
| DB table vars | camelCase + `Table` suffix | `spotsTable` |
| DB columns | snake_case in DB, camelCase as JS alias | `uuid('spot_id')` → `spotId` prop |

### Types
- DTOs defined as Zod schemas + inferred interface:
  ```ts
  export const createSpotSchema = z.object({ ... });
  export interface CreateSpotDTO extends z.infer<typeof createSpotSchema> {}
  ```
- DB type exported from drizzle module: `export type DrizzleDB = NodePgDatabase<typeof schemas>;`
- `noImplicitAny: false` in tsconfig — explicit `any` OK per ESLint

### DI Pattern
- Constructor injection: `constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}`
- Custom provider tokens via `Symbol()`: `export const DRIZZLE = Symbol('DRIZZLE_CONNECTION');`
- `@Injectable()` on services, `@Module({ ... })` on modules
- `OnModuleDestroy` lifecycle for pool cleanup

### NestJS conventions
- Controllers: thin, validate input, delegate to service
- Services: business logic, DB access via Drizzle
- Modules: register providers, controllers, imports
- E2E: compile full `AppModule`, `request(app.getHttpServer())`, cleanup in `afterEach`

### Error handling
- Services catch errors and handle them (avoid bare `console.log` without rethrow)
- Zod `.parse()` throws on invalid input — use try/catch or NestJS pipes
- Prefer Zod validation in DTOs over inline checks

### DB / Drizzle
- Schema files in `src/drizzle/schemas/`, exported from `index.ts`
- `pgTable` with snake_case table names, camelCase column aliases via `uuid('spot_id')`
- Migrations in `migrations/drizzle/` managed by `drizzle-kit`
- Run `pnpm run db:generate` after schema changes, then `pnpm run db:migrate`

### Testing
- Unit: `*.spec.ts` alongside source, uses `@nestjs/testing` `Test.createTestingModule`
- E2E: `*.e2e-spec.ts` in `test/`, compiles full `AppModule`, uses supertest
- Pattern: `describe`/`it` blocks, `beforeEach` compile, `afterEach` cleanup
- File placement: `src/app.controller.spec.ts` next to `app.controller.ts`

### Project conventions
- `.env` with `DATABASE_URL` (gitignored)
- Docker Compose for local Postgres
- pnpm (not npm/yarn) — lockfile is `pnpm-lock.yaml`
- `node_modules/`, `dist/`, `.env` in `.gitignore`
