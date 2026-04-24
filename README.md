# Questionnaire Platform — Révéla (AOR Conseil)

Plateforme de questionnaires psychométriques (FIRO-B et dérivés).

## Stack technique

- **Monorepo** : pnpm workspace (`applications/` + `packages/`)
- **Backend** : NestJS 11, architecture hexagonale (ports & adapters), CQRS sans Event Sourcing
- **Base de données** : PostgreSQL 16, ORM Drizzle
- **Frontend** : React 19, TypeScript, Vite, TanStack Router/Query, MUI v7
- **Lint / format** : BiomeJS
- **Tests** : Vitest
- **Validation** : Zod v4
- **Modules** : ESM uniquement

## Structure

```
questionnaire-platform/
├── applications/
│   ├── backend/       # API NestJS (port 3000, prefix /api)
│   └── frontend/      # Vite + React (port 5173)
├── packages/
│   ├── aor-common/    # @aor/types, @aor/domain, @aor/adapters, @aor/utils, @aor/ports, @aor/logger
│   ├── aor-drizzle/   # Schéma Drizzle + migrations PostgreSQL
│   ├── aor-questionnaires/  # Définitions des questionnaires
│   └── aor-scoring/   # Logique de scoring
├── docker-compose.dev.yml   # Postgres local
└── pnpm-workspace.yaml      # Catalogue des versions
```

## Prérequis

- Node.js ≥ 20
- pnpm 10.8.1 (le repo pin la version via `packageManager`)
- Docker (pour Postgres local via `docker-compose.dev.yml`)

## Démarrage rapide

### 1. Cloner et installer

```bash
git clone <repo>
cd questionnaire-platform
pnpm install
```

### 2. Variables d'environnement

```bash
cp .env.example .env
# Éditer .env — en particulier JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD
```

Variables backend requises :

| Variable | Obligatoire | Description |
|---|---|---|
| `DATABASE_URL` | oui | ex. `postgres://postgres:postgres@localhost:5432/questionnaire_platform` |
| `JWT_SECRET` | oui | Secret de signature JWT (≥ 32 caractères) |
| `ADMIN_USERNAME` | oui | Identifiant super-admin |
| `ADMIN_PASSWORD` | oui | Mot de passe super-admin |
| `FRONTEND_URL` | oui | Origin du front (CORS + URLs d'invitation) |
| `PORT` | non | Port HTTP du backend (défaut : `3000`) |
| `ADMIN_CUTOVER_STRATEGY` | non | `legacy` \| `dual-run` \| `new-flow` (défaut : `legacy`) |
| `MAIL_SERVER`, `MAIL_PORT`, `MAIL_USE_TLS`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM` | non | SMTP pour envoi d'invitations (désactivé si absent) |
| `LOG_LEVEL` | non | `debug` \| `info` \| `warn` \| `error` |

Variable frontend :

| Variable | Description |
|---|---|
| `VITE_API_URL` | Cible du proxy `/api` en dev (défaut : `http://localhost:3000`) |

### 3. Base de données

```bash
docker compose -f docker-compose.dev.yml up -d db
pnpm --filter @aor/backend-api run db:bootstrap   # migrate + seed
```

### 4. Lancer en développement

Dans deux terminaux distincts :

```bash
# Backend — http://localhost:3000/api
pnpm --filter @aor/backend-api run dev

# Frontend — http://localhost:5173
pnpm --filter @aor/frontend-app run dev
```

## Scripts utiles

### À la racine

| Commande | Action |
|---|---|
| `pnpm build` | Build récursif de tous les packages et applications |
| `pnpm build:libs` | Build des libs internes uniquement (`@aor/*`) |
| `pnpm lint` | Guard backend imports + `biome check` sur tout le monorepo |
| `pnpm typecheck` | `tsc --noEmit` récursif |
| `pnpm guard:backend-shared-imports` | Vérifie qu'aucun import d'artefact legacy n'a été réintroduit |

### Backend (`applications/backend`)

| Commande | Action |
|---|---|
| `pnpm run dev` | Démarre NestJS en watch mode |
| `pnpm run build` | Build via `nest build` |
| `pnpm run start` | Exécute `dist/main.js` |
| `pnpm run test` | Tests Vitest |
| `pnpm run typecheck` | Typecheck |
| `pnpm run lint` / `lint:fix` | BiomeJS |
| `pnpm run db:generate` | Génère une migration Drizzle depuis le schéma |
| `pnpm run db:migrate` | Applique les migrations Drizzle |
| `pnpm run db:seed` | Exécute `scripts/seed-dev-data.ts` |
| `pnpm run db:bootstrap` | `db:migrate` + `db:seed` |

### Frontend (`applications/frontend`)

| Commande | Action |
|---|---|
| `pnpm run dev` | Vite dev server (port 5173) |
| `pnpm run build` | `tsc -b && vite build` |
| `pnpm run preview` | Preview du build de prod |
| `pnpm run lint` / `lint:fix` / `format` | BiomeJS |

## Conventions

Toutes les conventions (TypeScript, BiomeJS, Zod v4, hexagonal, commits) sont documentées dans [CLAUDE.md](CLAUDE.md).

Commits au format Conventional Commits, validés par commitlint (hook `commit-msg`).

## API

L'API est préfixée par `/api`. Endpoints principaux :

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/admin/auth/login` | Authentification admin (→ JWT) |
| `GET` | `/api/admin/dashboard` | KPIs globaux |
| `GET` | `/api/admin/campaigns` | Campagnes (super-admin) |
| `GET` | `/api/admin/companies` | Entreprises |
| `GET` | `/api/admin/coaches` | Coachs |
| `GET` | `/api/admin/participants` | Participants (paginé) |
| `POST` | `/api/admin/participants/import` | Import CSV |
| `GET` | `/api/admin/responses` | Réponses (paginé) |
| `GET` | `/api/admin/export/responses?qid=B` | Export CSV |
| `GET` | `/api/invite/:token` | Validation d'un token d'invitation |
| `POST` | `/api/invite/:token/activate` | Activation du compte participant |
| `POST` | `/api/participant/auth/login` | Authentification participant |
| `GET` | `/api/participant/session` | Session participant (assignments, progression) |
| `POST` | `/api/responses/:qid/submit` | Soumission d'un questionnaire |
| `GET` | `/health` | Healthcheck |

> Pour la liste exhaustive, lire les contrôleurs sous [applications/backend/src/presentation/](applications/backend/src/presentation/).

## Format du CSV d'import participants

```
company_name;first_name;last_name;email;questionnaire_type;organisation;direction;service;function_level
AOR Conseil;Jean;Dupont;jean.dupont@example.com;B;;;;
```

## Archives

L'ancienne version Flask monolithique est conservée dans [archives/](archives/) à titre de référence historique. Elle n'est plus maintenue.

## Licence

Propriétaire — voir `LICENSE.md` (à créer — actuellement référencé dans les headers sources mais absent du repo).
