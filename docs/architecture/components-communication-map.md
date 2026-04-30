# Photo de l'écosystème — Questionnaire Platform

> Cartographie des composants (packages partagés, backend, frontend) et de
> leurs flux de communication.
>
> Snapshot : 2026-04-29 (post-restructuration espace participant).

---

## 1. Vue d'ensemble du monorepo

```
questionnaire-platform/
├── applications/
│   ├── backend/   (@aor/backend-api)   ← NestJS 11 + hexagonal + CQRS
│   └── frontend/  (@aor/frontend-app)  ← React 19 + Vite + TanStack
│
└── packages/      (workspace shared, importés via "@aor/*")
    ├── aor-common/
    │   ├── adapters/   (@aor/adapters)   ← implémentations partagées (ScryptPasswordAdapter…)
    │   ├── domain/     (@aor/domain)     ← entités métier write-side
    │   ├── logger/     (@aor/logger)     ← logger structuré
    │   ├── ports/      (@aor/ports)      ← ports transverses (IPasswordVerifierPort…)
    │   ├── types/      (@aor/types)      ← schemas Zod partagés FE/BE
    │   └── utils/      (@aor/utils)      ← helpers purs
    ├── aor-drizzle/    (@aor/drizzle)    ← schema PostgreSQL + migrations
    ├── aor-questionnaires/ (@aor/questionnaires) ← catalog B/F/S + short_labels
    └── aor-scoring/    (@aor/scoring)    ← calcul score Element Humain (Will Schutz)
```

**Qui consomme quoi** :

| Package | Backend | Frontend |
|---|---|---|
| `@aor/types` | ✅ DTO Zod partagés | ✅ types runtime + parse |
| `@aor/domain` | ✅ entités write-side | ❌ |
| `@aor/ports` | ✅ ports transverses | ❌ |
| `@aor/adapters` | ✅ Scrypt, etc. | ❌ |
| `@aor/drizzle` | ✅ schema + migrations | ❌ |
| `@aor/questionnaires` | ✅ catalog | ❌ (accédé via API) |
| `@aor/scoring` | ✅ calcul Element Humain | ❌ |
| `@aor/logger` | ✅ | ❌ |

---

## 2. Backend — Architecture hexagonale

### 2.1 Couches

```
┌─────────────────────────────────────────────────────────────────┐
│  presentation/  ← controllers, modules NestJS, guards, filters  │
└──────────────────────────────────┬──────────────────────────────┘
                                   │ inject use cases
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│  application/   ← use cases (un = un intent métier)             │
└──────────────────────────────────┬──────────────────────────────┘
                                   │ utilise ports (interfaces)
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│  interfaces/    ← ports (I…Port.ts) + symboles DI               │
└──────────────────────────────────┬──────────────────────────────┘
                                   │ adapters implémentent les ports
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│  infrastructure/  ← Drizzle repositories, mail, scoring         │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                         packages/aor-drizzle (DB)
```

### 2.2 Modules NestJS et controllers HTTP

```
AppModule
├── AdminAuthModule         → POST /admin/auth/login
├── AdminSharedModule       (ports DB partagés entre tous les Admin*)
├── AdminCampaignsModule    → /admin/campaigns/* (controller AdminCampaignsController)
├── AdminCoachesModule      → /admin/coaches/*
├── AdminCompaniesModule    → /admin/companies/*
├── AdminParticipantsModule → /admin/participants/*
├── AdminResponsesModule    → /admin/responses/*
├── AdminManagementModule   → /admin/dashboard, mail-status
├── AdminModule             (orchestration / divers)
├── ParticipantModule       → /participant/* (ParticipantController)
├── InvitationsModule       → /invite/:token (public)
├── QuestionnairesModule    → /questionnaires (lecture catalog)
└── ScoringModule           → /scoring/*
```

### 2.3 Surface HTTP backend

```
┌─ ADMIN (JWT scope=super-admin OU coach) ─────────────────────────┐
│  POST   /admin/auth/login                                        │
│  GET    /admin/dashboard, /admin/mail-status                     │
│  CRUD   /admin/campaigns, /admin/coaches, /admin/companies       │
│  GET    /admin/participants(/:id/matrix|tokens)                  │
│  CRUD   /admin/responses (+ /export, /export/anonymized)         │
└──────────────────────────────────────────────────────────────────┘

┌─ PARTICIPANT (JWT role=participant) ─────────────────────────────┐
│  POST   /participant/auth/login                                  │
│  GET    /participant/session                                     │
│  PATCH  /participant/profile                                     │
│  GET    /participant/campaigns/:campaignId/matrix?qid=           │
│  POST   /participant/campaigns/:campaignId/confirm               │
│  GET    /participant/campaigns/:campaignId/peers                 │
│  POST   /participant/campaigns/:campaignId/questionnaires/:qid/  │
│         submit                                                   │
│  GET    /participant/responses/:responseId                       │
└──────────────────────────────────────────────────────────────────┘

┌─ PUBLIC (token URL, sans auth) ──────────────────────────────────┐
│  GET    /invite/:token                                           │
│  POST   /invite/:token/activate, /confirm, /submit               │
└──────────────────────────────────────────────────────────────────┘

┌─ MIXTE (admin OU participant via AdminOrParticipantJwtAuthGuard) ┐
│  GET    /questionnaires, /questionnaires/:qid                    │
│  POST   /scoring/*                                               │
└──────────────────────────────────────────────────────────────────┘
```

### 2.4 Ports & adapters (qui parle à la DB)

```
interfaces/                              infrastructure/database/repositories/
─────────                                ────────────────────────────────────
ICampaignsRepository.port           ◄── DrizzleCampaignsRepository
ICoachesRepository.port             ◄── DrizzleCoachesRepository
ICompaniesRepository.port           ◄── DrizzleCompaniesRepository
IInvitationsRepository.port         ◄── DrizzleInvitationsRepository
IInviteActivationRepository.port    ◄── DrizzleInviteActivationRepository
IParticipantsRepository.port        ◄── DrizzleParticipantsRepository
IResponsesRepository.port           ◄── DrizzleResponsesRepository

interfaces/admin/IAdminAuthConfig.port   ← env-based super-admin
interfaces/admin/IInviteUrlConfig.port   ← env-based URL builder
interfaces/invitations/IMail.port        ← mail provider
interfaces/participant-session/
  IParticipantJwtSigner.port             ← JWT signer pour participant
@aor/ports/IPasswordVerifierPort         ← Scrypt comparator
```

### 2.5 Guards & sécurité

```
presentation/jwt-validated-user.ts          ← type partagé (extrait de admin/ le 2026-04-29)
presentation/admin/jwt.strategy.ts          ← Passport strategy unique
presentation/admin/admin-jwt-auth.guard.ts  ← rejette si role ≠ admin
presentation/participant-session/
  ├── participant-jwt-auth.guard.ts        ← rejette si role ≠ participant
  └── current-participant-id.decorator.ts  ← extrait participantId (créé le 2026-04-29)
presentation/admin-or-participant-jwt-auth.guard.ts  ← accepte les deux
```

---

## 3. Frontend — Architecture

### 3.1 Couches

```
┌──────────────────────────────────────────────────────────────┐
│  routes/        ← TanStack Router (file-based)               │
│    _participant/, admin/, coach/, login, invite.$token       │
└────────────────────────────┬─────────────────────────────────┘
                             │ utilise hooks
                             ▼
┌──────────────────────────────────────────────────────────────┐
│  hooks/         ← TanStack Query (queries + mutations)       │
└────────────────────────────┬─────────────────────────────────┘
                             │ via api clients
                             ▼
┌──────────────────────────────────────────────────────────────┐
│  api/           ← clients Axios (admin / participant)        │
└────────────────────────────┬─────────────────────────────────┘
                             │ HTTP + JWT
                             ▼
                      Backend NestJS

┌──────────────────────────────────────────────────────────────┐
│  components/    ← UI MUI v7 (matrix, dashboard, results)     │
│  lib/           ← view-models, i18n, theme, PDF export       │
│  stores/        ← Zustand (campaignStore)                    │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Trois espaces front, deux clients HTTP

```
api/client.ts             ← apiClient (admin/coach JWT)
api/participantClient.ts  ← participantApiClient (participant JWT)

routes/
├── login.tsx              → participant
├── admin/                 → super-admin (apiClient)
│   ├── login.tsx
│   ├── campaigns/, coaches/, companies/, participants/, responses/
│   └── route.tsx          (sidebar admin + beforeLoad redirect coach→/coach)
├── coach/                 → coach (apiClient, scope=coach)
│   ├── campaigns/, companies/, participants/
│   └── route.tsx          (sidebar coach + beforeLoad redirect admin→/admin)
└── _participant/          → participant à la racine `/`
    ├── index.tsx          /
    ├── profile.tsx        /profile
    ├── self-rating.tsx, peer-feedback.tsx, test/
    ├── campaigns/         /campaigns(/$campaignId(/results|coach))
    └── route.tsx          (sidebar participant + redirect autres rôles)
```

### 3.3 Hooks → endpoints

```
hooks/admin.ts                  → apiClient → /admin/*
hooks/responses.ts              → participantApiClient → /participant/responses/:id
hooks/invitations.ts            → /invite/:token public + /admin/invitations
hooks/participantAuth.ts        → POST /participant/auth/login
hooks/participantSession.ts:
  useParticipantSession         → GET  /participant/session
  useParticipantSessionMatrix   → GET  /participant/campaigns/:id/matrix?qid=
  useParticipantCampaignPeers   → GET  /participant/campaigns/:id/peers
  useConfirmCampaignParticipation → POST /participant/campaigns/:id/confirm
  useUpdateParticipantProfile   → PATCH /participant/profile
hooks/questionnaires.ts:
  useSubmitParticipantQuestionnaire → POST /participant/campaigns/:id/questionnaires/:qid/submit
  useQuestionnaire / useQuestionnaires(Admin) → /questionnaires
hooks/useBuildDimensions.ts     ← utilitaire view-model (pas d'HTTP)
hooks/useSelectedAssignment.ts  ← Zustand campaignStore
hooks/useQuestionnaireOrchestrator.ts ← machine d'état multi-étapes
```

---

## 4. Schéma de communication global

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vite dev server)                       │
│                                                                         │
│   routes/admin     routes/coach     routes/_participant   invite/$token │
│        │                │                  │                  │         │
│        ▼                ▼                  ▼                  ▼         │
│            hooks (TanStack Query / Mutations)                           │
│                            │                                            │
│            ┌───────────────┼───────────────┐                            │
│            ▼               ▼               ▼                            │
│      apiClient    participantApiClient   (fetch direct invite)          │
│      (admin JWT)   (participant JWT)                                    │
└────────────┬────────────────┬───────────────┬───────────────────────────┘
             │                │               │
             │  Authorization: Bearer <JWT>   │
             ▼                ▼               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            BACKEND (NestJS)                             │
│                                                                         │
│  Guards:  AdminJwtAuthGuard │ ParticipantJwtAuthGuard │ AdminOrParticipant│
│              ▼                          ▼                  ▼             │
│  Controllers (presentation/)                                             │
│  ┌──────────────────┐  ┌───────────────────────┐  ┌────────────────┐    │
│  │ Admin*Controller │  │ ParticipantController │  │ Public/Mixed   │    │
│  └────────┬─────────┘  └────────┬──────────────┘  └────────┬───────┘    │
│           │  inject use cases (DI symbols)                  │            │
│           ▼            ▼                                    ▼            │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  application/  Use cases (+ requirent ports)                      │   │
│  │   admin/, participant-session/, responses/, invitations/, scoring/│   │
│  └──────────────────────────────────┬───────────────────────────────┘   │
│                                     │                                    │
│                       ┌─────────────┼──────────────┐                     │
│                       ▼             ▼              ▼                     │
│                 ┌──────────┐  ┌──────────┐  ┌─────────────┐              │
│                 │ Domain   │  │ Ports    │  │@aor/scoring │              │
│                 │ (entités)│  │ (intf.)  │  │@aor/types   │              │
│                 │@aor/...  │  └────┬─────┘  │@aor/questi…│              │
│                 └──────────┘       │        └─────────────┘              │
│                                    │ implémentés par                     │
│                                    ▼                                     │
│                       ┌─────────────────────────────┐                    │
│                       │  infrastructure/            │                    │
│                       │  Drizzle*Repository, Mail   │                    │
│                       └─────────────────┬───────────┘                    │
└─────────────────────────────────────────┼────────────────────────────────┘
                                          │ SQL via @aor/drizzle
                                          ▼
                                  PostgreSQL (Drizzle schema)
```

---

## 5. Flux concrets — exemples

### 5.1 Participant qui consulte ses résultats

```
[UI] /campaigns/42/results
   │
   ▼ Route lit campaignId=42 depuis URL params
[Hook] useParticipantSessionMatrix(true, "F", 42)
   │
   ▼ participantApiClient.get('/participant/campaigns/42/matrix?qid=F')
   │ Authorization: Bearer <participant JWT>
   ▼
[Backend Guard] ParticipantJwtAuthGuard      → ok role=participant
[Decorator]    @CurrentParticipantId()       → 17 (participantId)
[Controller]   ParticipantController.campaignMatrix(17, 42, "F")
   │
   ▼
[Use case] GetParticipantSessionQuestionnaireMatrixUseCase
   │ ports: participants, campaigns, getMatrix(=GetParticipantQuestionnaireMatrixUseCase)
   ▼
[Use case interne] GetParticipantQuestionnaireMatrixUseCase
   │ ports: participants(reader), responses(reader)
   ▼
[Adapter] DrizzleParticipantsRepository + DrizzleResponsesRepository
   │
   ▼ SQL (jointures invites + responses + scientific scores)
PostgreSQL
   │
   ▲ matrix payload (rows + peer_columns + result_dims + diff_pairs)
   │
[Response Zod-typed]   ParticipantQuestionnaireMatrix (@aor/types)
   │
   ▲ JSON HTTP 200
   │
[Frontend]
[Component] QuestionnaireMatrixDisplay
   │ buildDimensionBlocks(matrix) ← components/matrix/pairBuilder.ts
   ▼
   MatrixTableMode (tableau + ligne « Écart |je suis − je veux| »)
   MatrixChartMode (barres + GapPanel par paire)
```

### 5.2 Coach qui crée une campagne

```
[UI] /admin/campaigns (drawer create)
   │
   ▼ apiClient.post('/admin/campaigns', body)  + admin JWT (scope=coach)
[Backend Guard] AdminJwtAuthGuard
[Controller] AdminCampaignsController.createCampaign
   │ détecte scope=coach → force body.coach_id = req.user.coachId
   ▼
[Use case] CreateAdminCampaignUseCase
   │ ports: campaigns(writer), companies, coaches
   ▼
[Adapters Drizzle] → PostgreSQL → entité Campaign
   │
   ▲ retour {id, ...}
[Frontend] TanStack Query invalide ['admin','campaigns'] → refetch liste
```

---

## 6. Matrice complète routes UI ↔ endpoints API

| UI participant (frontend) | Hook | Endpoint backend |
|---|---|---|
| `/login` | `useParticipantLogin` | `POST /participant/auth/login` |
| `/` (dashboard) | `useParticipantSession` | `GET /participant/session` |
| `/profile` | `useUpdateParticipantProfile` | `PATCH /participant/profile` |
| `/campaigns` | `useParticipantSession` | `GET /participant/session` |
| `/campaigns/$id` | `useParticipantSession` | `GET /participant/session` |
| `/campaigns/$id` (Confirmer) | `useConfirmCampaignParticipation` | `POST /participant/campaigns/:id/confirm` |
| `/campaigns/$id/results` | `useParticipantSessionMatrix` | `GET /participant/campaigns/:id/matrix?qid=` |
| `/campaigns/$id/coach` | `useParticipantSession` | `GET /participant/session` |
| `/self-rating` | `useParticipantSessionMatrix` + submit | `GET /participant/campaigns/:id/matrix?qid=` puis `POST /participant/campaigns/:id/questionnaires/:qid/submit` |
| `/peer-feedback` | + `useParticipantCampaignPeers` | `GET /participant/campaigns/:id/peers` |
| `/test/:qid` | `useQuestionnaire` + submit | `GET /questionnaires/:qid` + `POST /participant/campaigns/:id/questionnaires/:qid/submit` |
| `/invite/:token` | `useInvite` + `useSubmitInvite` | `GET /invite/:token`, `POST /invite/:token/submit` |

---

## 7. Points sensibles / cross-cutting

- **JWT** signé avec `JWT_SECRET` (env), 7 jours pour participant. Type `JwtValidatedUser` à `presentation/jwt-validated-user.ts` (extrait de `admin/` le 2026-04-29).
- **DI par Symbol** : chaque use case a un symbole `*_USE_CASE_SYMBOL` dans `*.tokens.ts`. Le module fait `useFactory` qui injecte les ports. Permet de tester le use case sans Nest.
- **Frontend `participantClient`** intercepte 401 et redirige `/login` ; l'`apiClient` admin redirige vers `/admin/login`.
- **i18n** : `applications/frontend/src/lib/i18n/locales/fr.json` (toasts notamment).
- **Workspace pnpm catalog** : versions Nest 11, Zod 4, Vitest 4, MUI 7 alignées via `pnpm-workspace.yaml`.
