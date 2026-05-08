# syntax=docker/dockerfile:1.7-labs
# Image backend Revela — NestJS + workspace pnpm.
# Build attendu depuis la RACINE du repo (le contexte est le monorepo entier) :
#   docker buildx build --platform linux/arm64 \
#     -f applications/backend/Dockerfile \
#     -t <ecr>/revela-backend:latest --push .

ARG NODE_VERSION=20-alpine
ARG PNPM_VERSION=10.8.1

# ─────────────────────────────────────────────────────────────────────
# Stage 1 — installation des dependances (cache sur le lockfile)
# ─────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS deps
ARG PNPM_VERSION
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /workspace

# Manifests du workspace : tout ce qui pilote `pnpm install` sans les sources.
# COPY --parents preserve la structure relative (Dockerfile 1.7+).
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.json ./
COPY --parents applications/backend/package.json ./
COPY --parents applications/frontend/package.json ./
COPY --parents packages/*/package.json ./
COPY --parents packages/aor-common/*/package.json ./

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ─────────────────────────────────────────────────────────────────────
# Stage 2 — build (libs workspace + backend)
# ─────────────────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /workspace

# Sources backend + libs internes consommees par le backend.
# Le Dockerignore racine evite de copier node_modules / dist / .git.
COPY applications/backend ./applications/backend
COPY packages ./packages

# `nest build` est precede par `prebuild` qui construit toutes les libs workspace
# (cf. applications/backend/package.json scripts.build:workspace-libs).
RUN pnpm --filter @aor/backend-api run build

# ─────────────────────────────────────────────────────────────────────
# Stage 3 — runtime minimal
# ─────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS runner
ARG PNPM_VERSION
RUN apk add --no-cache tini \
 && corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

WORKDIR /workspace

# On copie l'ensemble du workspace deja construit. C'est l'approche la plus
# fiable avec pnpm workspaces : les symlinks node_modules → packages/* restent
# valides puisque les chemins relatifs sont preserves. Pas de `pnpm deploy`
# necessaire, et `pnpm --filter @aor/drizzle db:migrate` reste utilisable
# pour appliquer les migrations depuis le conteneur.
COPY --from=builder --chown=node:node /workspace ./

ENV NODE_ENV=production
EXPOSE 3000

USER node
WORKDIR /workspace/applications/backend

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
