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
# pnpm comes through corepack; the bundled npm is never used and carries most
# of the fixable CVEs Trivy finds in the tools image.
RUN corepack enable && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
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

# Distroless: no shell, no package manager, so none of the unfixed Debian CVEs
# the slim image carries. It lives on gcr.io itself, not on the Docker Hub
# mirror. Entrypoint is node; runs as uid 65532 (nonroot). Debian 13: the 12
# variant's libssl3 lagged a CRITICAL fix that the scan gate rightly refused.
FROM gcr.io/distroless/nodejs22-debian13:nonroot AS app
WORKDIR /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
COPY --from=tools --chown=65532:65532 /app/.next/standalone ./
COPY --from=tools --chown=65532:65532 /app/.next/static ./.next/static
COPY --from=tools --chown=65532:65532 /app/public ./public
EXPOSE 3000
CMD ["server.js"]
