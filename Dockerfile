# Marginalia as a container (MRG-081). Three stages:
#   deps  — node_modules from the lockfile
#   tools — deps + source + build; also runs migrations and the backfill,
#           which need drizzle-kit and the scripts the lean image leaves out
#   app   — the standalone server only; what runs day to day
#
# Base images come through mirror.gcr.io, Google's Docker Hub mirror: no Hub
# login or pull-rate limit, and on Google Cloud it is the nearby registry.

FROM mirror.gcr.io/library/node:22-bookworm-slim AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS tools
COPY . .
# The build never touches the database (getDb() and getAuth() are lazy), so it
# gets the same placeholders CI builds with. Real values arrive at runtime.
RUN DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder \
    BETTER_AUTH_SECRET=placeholder-secret-for-build-only \
    BETTER_AUTH_URL=http://localhost:3000 \
    GOOGLE_CLIENT_ID=placeholder \
    GOOGLE_CLIENT_SECRET=placeholder \
    pnpm build
CMD ["sh", "-c", "pnpm db:migrate && pnpm backfill:categories"]

FROM mirror.gcr.io/library/node:22-bookworm-slim AS app
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=tools --chown=node:node /app/.next/standalone ./
COPY --from=tools --chown=node:node /app/.next/static ./.next/static
COPY --from=tools --chown=node:node /app/public ./public
USER node
EXPOSE 3000
CMD ["node", "server.js"]
