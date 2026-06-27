FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY pnpm-lock.yaml package.json .npmrc ./
RUN pnpm fetch

COPY . .
RUN pnpm install --frozen-lockfile --offline --ignore-scripts
RUN pnpm build

FROM node:22-alpine AS production

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/src/main.js"]