FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Build the application
ARG VITE_SERVER_URL
ENV VITE_SERVER_URL=$VITE_SERVER_URL
RUN pnpm --filter web build

# Create a pruned version for production (only prod dependencies)
RUN pnpm --filter web --prod deploy pruned

FROM base AS runner
WORKDIR /app

# Copy the deployed package (dependencies + package.json)
COPY --from=builder /app/pruned .

# Copy the build output manually
COPY --from=builder /app/apps/web/build ./build

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

CMD ["pnpm", "start"]
