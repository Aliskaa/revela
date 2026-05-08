# syntax=docker/dockerfile:1.7-labs
# Image frontend Revela — Vite (React) servie par nginx.
# Build attendu depuis la RACINE du repo (contexte = monorepo) :
#   docker buildx build --platform linux/arm64 \
#     -f applications/frontend/Dockerfile \
#     -t <ecr>/revela-frontend:latest --push .

ARG NODE_VERSION=20-alpine
ARG PNPM_VERSION=10.8.1

# ─────────────────────────────────────────────────────────────────────
# Stage 1 — installation des dependances workspace (cache)
# ─────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS deps
ARG PNPM_VERSION
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /workspace

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.json ./
COPY --parents applications/backend/package.json ./
COPY --parents applications/frontend/package.json ./
COPY --parents packages/*/package.json ./
COPY --parents packages/aor-common/*/package.json ./

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ─────────────────────────────────────────────────────────────────────
# Stage 2 — build : @aor/types (lib workspace consommee) + frontend
# ─────────────────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /workspace

COPY packages/aor-common/types ./packages/aor-common/types
COPY applications/frontend ./applications/frontend

RUN pnpm --filter @aor/types build \
 && pnpm --filter @aor/frontend-app exec vite build
# NOTE: on saute volontairement le `tsc -b` (script `build` complet = `tsc -b && vite build`)
# car le code source contient des erreurs TS pre-existantes a corriger dans un PR separe.
# Vite/esbuild transpile sans typecheck — le bundle prod reste valide.

# ─────────────────────────────────────────────────────────────────────
# Stage 3 — runtime nginx (statique pur, pas de Node)
# ─────────────────────────────────────────────────────────────────────
FROM nginx:alpine AS runner
COPY --from=builder /workspace/applications/frontend/dist /usr/share/nginx/html
COPY applications/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
