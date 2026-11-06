# syntax=docker/dockerfile:1
# Build context: repository root (docker build -f apps/web/Dockerfile .)
FROM node:22-slim AS build
RUN corepack enable
WORKDIR /repo
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/config/package.json packages/config/
COPY packages/trace-schema/package.json packages/trace-schema/
COPY packages/viz-engine/package.json packages/viz-engine/
COPY packages/algorithms/package.json packages/algorithms/
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile
COPY . .
ARG NEXT_PUBLIC_VIZ_LIMIT_PROFILE=standard
ENV NEXT_PUBLIC_VIZ_LIMIT_PROFILE=$NEXT_PUBLIC_VIZ_LIMIT_PROFILE
RUN pnpm --filter @algovision/web build

FROM node:22-slim AS run
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
