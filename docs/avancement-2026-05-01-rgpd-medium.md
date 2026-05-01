# Plan d'avancement — Fermeture des gaps RGPD MEDIUM (G4 / G5 / G6 / G8)

> Suite de [avancement-2026-05-02.md](avancement-2026-05-02.md). Cette session ferme les
> 4 gaps **MEDIUM** identifiés dans l'audit RGPD initial (cf.
> [avancement-2026-05-01.md §3](avancement-2026-05-01.md)) :
>  - **G4** — `DELETE /admin/participants/:id` non filtré par `coachId`.
>  - **G5** — `GET /admin/participants/:id/matrix` et `GET /admin/responses/:id` non
>    filtrés par `coachId`.
>  - **G6** — Pas d'audit trail.
>  - **G8** — Pas de rate limiting sur les endpoints d'authentification.

---

## TL;DR

- **G8 (rate limiting)** : `@nestjs/throttler` enregistré globalement avec 3 policies
  nommées (`default` 60/min, `auth-strict` 5/min, `auth-refresh` 30/min). Les endpoints
  login (admin + participant), refresh, et `invite/:token/activate` consomment la policy
  `auth-strict` ou `auth-refresh` via `@Throttle({ ... })`.
- **G4 + G5 (filtrages coachId)** : 3 endpoints durcis pour rejeter (404) toute ressource
  hors périmètre du coach connecté :
  - `DELETE /admin/participants/:id`
  - `GET /admin/participants/:id/matrix`
  - `GET /admin/responses/:id`, `DELETE /admin/responses/:id`
  Le 404 (plutôt que 403) évite de leak l'existence des ressources.
- **G6 (audit trail)** : nouvelle table `audit_events` (migration 0014), service
  `AuditLoggerService` injectable, branché en mode fire-and-forget sur les actions
  critiques RGPD : login admin/participant (succès + échec), logout, update participant,
  effacement RGPD participant.

**Bilan validation** :
```bash
pnpm --filter @aor/backend-api typecheck   # ✅
pnpm --filter @aor/backend-api lint        # ✅
pnpm --filter @aor/frontend-app typecheck  # ✅
pnpm --filter @aor/frontend-app lint       # ✅
```

---

## 1. G8 — Rate limiting des endpoints d'authentification

**Article RGPD** : 32 (sécurité du traitement) — protection contre les attaques par force
brute sur les credentials.

### Configuration

[`AppModule`](../applications/backend/src/app/app.module.ts) enregistre `ThrottlerModule`
avec 3 policies nommées :

| Nom | Limite | TTL | Usage |
|---|---|---|---|
| `default` | 60 req | 60 s | Fallback global, hérite par tous les endpoints |
| `auth-strict` | 5 req | 60 s | `login`, `invite/:token/activate` (cibles brute-force) |
| `auth-refresh` | 30 req | 60 s | `auth/refresh` (peut être chaîné par plusieurs onglets) |

`ThrottlerGuard` est posé comme `APP_GUARD` global — chaque endpoint hérite de `default`,
les controllers durcis utilisent `@Throttle({ <name>: { limit, ttl } })` pour overrider.

### Endpoints durcis

| Endpoint | Policy |
|---|---|
| `POST /admin/auth/login` | `auth-strict` (5/min) |
| `POST /admin/auth/refresh` | `auth-refresh` (30/min) |
| `POST /participant/auth/login` | `auth-strict` (5/min) |
| `POST /participant/auth/refresh` | `auth-refresh` (30/min) |
| `POST /invite/:token/activate` | `auth-strict` (5/min) |

Au-delà de ces seuils, le client reçoit `429 Too Many Requests`. Les autres endpoints
restent sur la policy `default` à 60/min.

### Choix d'identification

Par défaut, `ThrottlerGuard` clé sur l'**IP** du client (lue depuis `req.ip`). Pour que
ça fonctionne derrière un reverse-proxy (Nginx, CloudFront), penser à activer
`app.set('trust proxy', true)` côté Express avant déploiement prod — sinon toutes les
requêtes sont vues comme provenant de la même IP du proxy. **TODO prod** : à câbler
dans `main.ts` quand on déploie derrière un proxy.

---

## 2. G4 + G5 — Filtrages `coachId` sur les endpoints détail/delete

**Article RGPD** : 32 (sécurité, contrôle d'accès) — un coach ne doit pas pouvoir
deviner un `participantId` ou `responseId` hors de son périmètre et accéder/effacer
des données.

### Pattern commun

Quand un coach (scope=coach) appelle un endpoint détail/delete, on vérifie que la
ressource appartient à au moins une de ses campagnes. Sinon → `AdminResourceNotFoundError`
(HTTP 404) ou équivalent. Le **404 plutôt que 403** est délibéré : il évite de confirmer
l'existence d'un `id` hors périmètre.

Pour scope=super-admin, `coachId === undefined` est passé aux use cases → aucun filtrage.

### G4 — `DELETE /admin/participants/:id`

[`EraseParticipantRgpdUseCase.execute`](../applications/backend/src/application/admin/participants/erase-participant-rgpd.usecase.ts)
accepte désormais `params: { coachId? }`. Si `coachId` fourni, on appelle d'abord
`participants.findByIdEnriched(id, { coachId })` qui retourne `null` pour une ressource
hors périmètre → 404 sans toucher à la BDD.

Le controller [admin-participants.controller.ts](../applications/backend/src/presentation/admin/admin-participants.controller.ts)
extrait `coachId` du JWT (via `@Req() req: { user: JwtValidatedUser }`) et le passe au
use case.

### G5 — `GET /admin/participants/:id/matrix`

[`GetParticipantQuestionnaireMatrixUseCase`](../applications/backend/src/application/participant-session/get-participant-questionnaire-matrix.usecase.ts)
accepte aussi `params.coachId?`. Same pattern : pre-check via `findByIdEnriched`.

Note importante : ce use case est partagé entre admin (coach) et participant. Le module
participant l'injecte avec `coachId: undefined` (le participant consulte sa propre
matrix, pas de filtrage). Seul le module admin passe le `coachId` du JWT.

### G5 — `GET /admin/responses/:id` + `DELETE /admin/responses/:id`

Les use cases [`GetPublicResponseUseCase`](../applications/backend/src/application/responses/get-public-response.usecase.ts)
et [`DeleteAdminResponseUseCase`](../applications/backend/src/application/admin/responses/delete-admin-response.usecase.ts)
acceptent `params: { coachId? }`. Si fourni, ils :
1. Lisent la réponse via `responses.findById`.
2. Vérifient que `record.campaignId !== null`.
3. Lisent la campagne via `campaigns.findById` et vérifient `campaign.coachId === coachId`.
4. Sinon → `ResponseRecordNotFoundError` (404).

Les modules ([responses.module.ts](../applications/backend/src/presentation/responses/responses.module.ts),
[admin-responses.module.ts](../applications/backend/src/presentation/admin/admin-responses.module.ts))
ont été adaptés pour injecter `ICampaignsReadPort` à ces use cases.

**Réponses orphelines** (`campaignId === null`, ex. réponses historiques d'avant le
cutover V2) : automatiquement 404 en scope=coach. Acceptable car aucune campagne associée
ne peut être attribuée à un coach.

---

## 3. G6 — Audit trail des actions critiques RGPD

**Article RGPD** : 5.1.f (intégrité, traçabilité). Permet de répondre à
« qui a consulté/modifié les données du participant X et quand ».

### Schéma de la table `audit_events`

Migration `0014_outgoing_ogun.sql` ([source](../packages/aor-drizzle/drizzle/0014_outgoing_ogun.sql)) :

```sql
CREATE TYPE "audit_actor_type" AS ENUM('super-admin','coach','participant','system','anonymous');
CREATE TABLE "audit_events" (
  "id" serial PRIMARY KEY,
  "actor_type" "audit_actor_type" NOT NULL,
  "actor_id" integer,                    -- NULL pour 'system' et 'anonymous'
  "action" text NOT NULL,                -- ex. 'admin.participant.erase'
  "resource_type" text,                  -- ex. 'participant'
  "resource_id" integer,
  "payload" jsonb,                       -- contexte libre, JAMAIS DE PII brute
  "ip_address" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);
```

Indexes : `(actor_type, actor_id)`, `(action)`, `(resource_type, resource_id)`,
`(created_at)` — pour les requêtes typiques d'audit.

### Architecture

- Schema Drizzle : [`packages/aor-drizzle/src/schema/audit-event.schema.ts`](../packages/aor-drizzle/src/schema/audit-event.schema.ts).
- Port : [`IAuditEventsRepositoryPort`](../applications/backend/src/interfaces/audit/IAuditEventsRepository.port.ts)
  — méthode unique `record(input)`.
- Repo Drizzle : [`DrizzleAuditEventsRepository`](../applications/backend/src/infrastructure/database/repositories/drizzle-audit-events.repository.ts).
- Service injectable : [`AuditLoggerService`](../applications/backend/src/application/audit/audit-logger.service.ts).
- Module : [`AuditModule`](../applications/backend/src/presentation/audit/audit.module.ts)
  — exporte `AuditLoggerService` à importer dans tout module qui audite.

### Sémantique des actions

Format `<scope>.<resource>.<verb>` ou `<scope>.<verb>` pour les actions transverses :

| Action | Acteur | Quand |
|---|---|---|
| `admin.login.success` | super-admin / coach | Login admin réussi |
| `admin.login.failure` | anonymous | Login admin refusé (mauvais credentials) |
| `admin.logout` | super-admin / coach | `POST /admin/auth/logout` |
| `admin.participant.erase` | super-admin / coach | DELETE participant (RGPD erase) |
| `admin.participant.update` | super-admin / coach | PATCH participant (modification PII) |
| `participant.login.success` | participant | Login participant réussi |
| `participant.login.failure` | anonymous | Login participant refusé |
| `participant.logout` | participant | `POST /participant/auth/logout` |

**Décision V1** : seules les **écritures** et **événements d'auth** sont tracés. Les
lectures (GET) ne sont pas auditées — volume trop important. Si besoin remontable en V2.

### Garde-fous

- **Aucune PII brute** dans `payload` : pas de mots de passe, pas de contenu de
  réponse, pas de noms en clair. On stocke uniquement les **IDs** de ressources et la
  liste des **noms de champs** modifiés (ex. `{ fields: ['organisation', 'service'] }`
  pour un PATCH). La réconciliation (ID → identité) se fait au moment de l'audit.
- **Fire-and-forget** : `AuditLoggerService.record()` capture toutes les exceptions
  et les remonte au logger console — un échec de l'audit ne doit jamais bloquer une
  action légitime (suppression RGPD demandée par le user, login).
- **Login échec en `anonymous`** : on ne logue pas le `userId` correspondant à
  l'username/email tenté, pour ne pas leak via l'audit l'existence d'un compte.

### Branchement

Le service est injecté dans 4 controllers :

- [admin.controller.ts](../applications/backend/src/presentation/admin/admin.controller.ts)
  — `login`, `logout` admin.
- [participant.controller.ts](../applications/backend/src/presentation/participant-session/participant.controller.ts)
  — `login`, `logout` participant.
- [admin-participants.controller.ts](../applications/backend/src/presentation/admin/admin-participants.controller.ts)
  — `updateParticipant`, `deleteParticipant` (erase RGPD).

Les modules correspondants importent `AuditModule` pour résoudre la DI.

**À étendre en V2** (out of scope cette session) : DELETE company, CRUD coach, créations
de campagnes, exports CSV (volumes potentiellement gros).

---

## 4. État RGPD final

| ID | Titre | Statut |
|---|---|---|
| **G1** | JWT en localStorage | ✅ Résolu (cookies httpOnly + refresh tokens, cf. avancement-2026-05-02) |
| **G2** | Pas d'export "mes données" participant | ✅ Résolu |
| **G3** | Pas de Privacy Policy / consentement | ✅ Résolu (template à compléter par DPO) |
| **G4** | DELETE participant non filtré coachId | ✅ Résolu (cette session) |
| **G5** | GET matrix / response détail non filtrés | ✅ Résolu (cette session) |
| **G6** | Pas d'audit trail | ✅ Résolu (table + service + 8 actions tracées) |
| **G7** | Pas de cron de purge tokens expirés | ⏳ LOW, pas attaqué |
| **G8** | Pas de rate limiting login | ✅ Résolu (cette session) |

**7 gaps sur 8 fermés** (3 HIGH + 4 MEDIUM). Reste G7 (LOW) — un cron qui purge les
invite tokens et refresh tokens expirés. Pas critique en V1, peut attendre une
itération de maintenance.

---

## 5. À faire avant prod

1. **Lancer la migration `0014_outgoing_ogun`** sur l'env cible :
   `pnpm --filter @aor/drizzle db:migrate` (ou via le runtime
   `drizzle-orm/node-postgres/migrator` si le CLI bloque, cf. avancement-2026-05-02 §1.a).
2. **Activer `trust proxy`** côté Express en prod si déployé derrière un reverse-proxy,
   sinon le rate-limiter clé sur l'IP du proxy (pas du client réel).
3. **Suivi des `audit_events`** : prévoir une politique de rétention. La table peut
   grossir vite (un login = une ligne). Recommandations : rétention 12 mois en hot
   storage, archivage froid au-delà.
