FROM node:22.23-alpine AS base

FROM base AS builder

WORKDIR /home/node/app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM base AS runtime

ENV NODE_ENV=production
WORKDIR /home/node/app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod

COPY --from=builder /home/node/app/.next ./.next
COPY --from=builder /home/node/app/public ./public
COPY --from=builder /home/node/app/next.config.mjs ./
COPY --from=builder /home/node/app/src ./src

EXPOSE 3000

CMD ["pnpm", "serve"]