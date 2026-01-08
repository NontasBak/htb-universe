FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY . .
WORKDIR /app/stack
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm --filter server build
RUN pnpm --filter server --prod deploy pruned

FROM base AS runner
WORKDIR /app

# Copy the deployed package (dependencies + source files)
COPY --from=builder /app/stack/pruned .

# Copy the built artifacts manually
COPY --from=builder /app/stack/apps/server/dist ./dist

# Copy scripts folder if needed (though running them requires tsx which is devDep)
COPY --from=builder /app/stack/apps/server/scripts ./scripts
COPY --from=builder /app/stack/apps/server/src ./src
COPY --from=builder /app/database ./database

# Install tsx globally to run scripts
RUN pnpm add -g tsx

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/index.mjs"]
