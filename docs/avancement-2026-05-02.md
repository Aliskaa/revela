# Plan d'avancement — Finalisation G1 RGPD + UX admin & viewer audit log

> Suite de [avancement-2026-05-01.md](avancement-2026-05-01.md). Deux sessions distinctes :
>
> **Matinée — Finalisation G1 RGPD** (sections 1–3) : finalisation du chantier auth
> cookies-only (retrait localStorage / Bearer fallback, alignement de l'endpoint d'invite),
> et corrections de régressions (migration 0013, footer participant, `cookie-parser`).
>
> **Après-midi — UX admin & viewer audit log** (section 4) : itérations UX sur la console
> admin (suppression cascade RGPD entreprise, validations de flow campagne, import CSV
> participants depuis fiche entreprise avec confirmation), refactor de
> `CompanyDetailPage` en composants colocalisés, viewer admin pour le système d'audit
> existant, standardisation des boutons d'action des tables, throttler désactivé en dev.

---

## TL;DR

**Session matinée (G1)** :
- **Auth cookies-only complet** : frontend ne stocke plus aucun JWT en `localStorage`.
  Claims utiles dans un store Zustand hydraté au boot via `GET /<scope>/auth/me`. Cookies
  httpOnly via `withCredentials: true`, plus aucune injection `Authorization: Bearer`.
- **`POST /invite/:token/activate`** aligné : pose les cookies httpOnly + retourne
  `{ participant_id }`.
- **Dette tsconfig** : `esModuleInterop: true` pour que `cookie-parser` compile sous
  `module: CommonJS`.
- **Migration 0013** régénérée propre.
- **Footer participant** monté dans `ParticipantShell`.

**Session après-midi (UX admin)** :
- **Suppression entreprise en cascade RGPD** : participants + réponses + scores +
  invitations + campagnes effacés en chaîne via `eraseParticipantRgpd` (§4.a).
- **Throttler désactivé hors prod** via `skipIf` (§4.b).
- **Validations UX du flow campagne** : pas de création sans entreprise, pas de lancement
  sans participant (§4.c).
- **Import CSV participants depuis fiche entreprise** avec endpoint dédié et **dialog de
  confirmation/preview** avant l'envoi (§4.d).
- **Refactor `CompanyDetailPage`** : 497 → 157 lignes, 5 composants colocalisés (§4.e).
- **Viewer admin du système d'audit** : nouveau endpoint `GET /admin/audit-events`
  (super-admin only) + page `/admin/audit-log` + item nav. Type `AdminAuditEvent` ajouté
  dans `@aor/types` (§4.f).
- **Composant `OpenDetailButton`** : standardisation des boutons d'action des tables
  (label, icône, variants table/card) sur les listes campagnes / entreprises / coachs (§4.g).
- **Bug latent React Query** : `adminKeys.participants()` produit `[..., undefined,
  undefined, undefined]` qui ne matche pas les clés paginées en v5. Fix local sur
  `useImportParticipantsToCompany` ; 5 autres hooks ont le même bug latent à reprendre
  ultérieurement (§4.h).

**Bilan validation** :
```bash
pnpm --filter @aor/backend-api typecheck   # ✅
pnpm --filter @aor/backend-api lint        # ✅
pnpm --filter @aor/frontend-app typecheck  # ✅
pnpm --filter @aor/frontend-app lint       # ✅
pnpm --filter @aor/types build             # ✅ (requis après ajout du type AdminAuditEvent)
```

---

## 1. Correction post-commit du 2026-05-01

### 1.a — Bug schéma Drizzle (migration 0013 partielle)

**Symptôme** : login participant échouait avec :
```
Failed query: insert into "refresh_tokens" ...
```

**Cause** : la colonne `tokenHash` du schéma ([refresh-token.schema.ts](../packages/aor-drizzle/src/schema/refresh-token.schema.ts))
avait à la fois `.unique()` et un `uniqueIndex(...)` explicite sur la même colonne, avec
le même nom. Drizzle générait deux SQL `CREATE UNIQUE INDEX` avec le même nom — la
première créait l'index automatique de la contrainte UNIQUE, la seconde plantait sur
`relation "refresh_tokens_token_hash_unique" already exists`. La migration s'arrêtait au
milieu : la table existait, mais les index `subject_idx` et `family_idx` n'avaient pas
été créés, et le journal `__drizzle_migrations` n'était pas mis à jour.

**Fix** : retiré `.unique()` du schéma — la contrainte uniqueness reste portée par
l'index `uniqueIndex` explicite. État BDD réparé via un script ad-hoc
(`DROP TABLE refresh_tokens CASCADE; DROP TYPE refresh_token_subject_type;`), suppression
de l'ancienne migration `0013_early_wind_dancer.sql` du dossier `drizzle/` + de l'entrée
`idx 13` dans `_journal.json`, régénération propre via `db:generate` →
[`0013_sturdy_champions.sql`](../packages/aor-drizzle/drizzle/0013_sturdy_champions.sql).

**Note** : `drizzle-kit migrate` reste partiellement bloqué dans certains shells (problème
de spinner TTY non-interactif). Le contournement : utiliser le runtime
`drizzle-orm/node-postgres/migrator` directement via un script Node ad-hoc. Si le bug se
reproduit, ajouter un script `db:migrate:fallback` dans
[`packages/aor-drizzle/package.json`](../packages/aor-drizzle/package.json) — TODO V2.

### 1.b — Footer participant manquant

`routes/_participant/route.tsx` définit sa propre `ParticipantShell` (locale au fichier),
qui ne montait pas `FooterLayout`. Seul le wrapper `ParticipantLayout` (utilisé nulle
part) l'incluait. Corrigé : import + montage de `<FooterLayout />` après le
`<Box component="main">`, dans un wrapper flex column pour que le footer reste collé au
bas de la viewport. Le lien "Politique de confidentialité" est maintenant accessible
depuis tout l'espace participant.

### 1.c — `cookie-parser` ne compile pas sous `tsconfig.build.json`

**Symptôme** :
```
src/main.ts:10:8 - error TS1259: Module '"cookie-parser"' can only be default-imported
using the 'esModuleInterop' flag
```

**Cause** : `pnpm typecheck` utilise [`applications/backend/tsconfig.json`](../applications/backend/tsconfig.json)
(`module: ESNext` + `moduleResolution: bundler`, permissif). Mais `nest build` /
`nest start` utilise `tsconfig.build.json` qui passe en `module: CommonJS` — ce mode
strict refuse `import x from 'cjs-module'` quand le module exporte via `export = `.

**Fix** : ajout de `"esModuleInterop": true` dans `tsconfig.json` backend. Cette option
est purement permissive (pas de changement runtime), elle autorise `import x from`
sur les modules CJS. Hérité par `tsconfig.build.json`.

---

## 2. Cleanup des anciens types de connexion (G1 finalisation)

### 2.a — Backend

**Endpoints `login` et `refresh` (admin + participant)** — retrait du `access_token` du
body de réponse. Le JWT vit exclusivement dans le cookie httpOnly `aor_<scope>_access`.

| Endpoint | Avant | Après |
|---|---|---|
| `POST /admin/auth/login` | `{ access_token, scope, coach_id }` | `{ scope, coach_id }` |
| `POST /admin/auth/refresh` | `{ access_token, scope, coach_id }` (transition) | `{ scope, coach_id }` |
| `POST /participant/auth/login` | `{ access_token, participant_id }` | `{ participant_id }` |
| `POST /participant/auth/refresh` | `{ access_token, participant_id }` (transition) | `{ participant_id }` |
| `POST /invite/:token/activate` | `{ access_token }` | Pose les cookies + `{ participant_id }` |

**Schéma `AdminLoginResponse`** ([admin-auth.ts](../packages/aor-common/types/src/admin-auth.ts))
amputé du champ `access_token`. Breaking change côté contrat API — le frontend a été
adapté en parallèle.

**`POST /invite/:token/activate`** ([invitations-public.controller.ts](../applications/backend/src/presentation/invitations/invitations-public.controller.ts))
aligné sur le pattern login : pose les cookies httpOnly via le `RefreshTokenManagerUseCase`
+ `setAuthCookies()`. Le use case
[`ActivateInviteWithPasswordUseCase`](../applications/backend/src/application/invitations/activate-invite-with-password.usecase.ts)
retourne maintenant aussi `participantId` (en plus de `accessToken`). Le module
[Invitations-public.module.ts](../applications/backend/src/presentation/invitations/Invitations-public.module.ts)
importe `AuthRefreshModule`.

**`JwtStrategy`** ([jwt.strategy.ts](../applications/backend/src/presentation/admin/jwt.strategy.ts))
— retrait du fallback `ExtractJwt.fromAuthHeaderAsBearerToken()`. Désormais l'extraction
JWT lit uniquement les cookies `aor_admin_access` et `aor_participant_access`. Tout
client (frontend Vite, Swagger UI, tests E2E) doit envoyer ses cookies via
`withCredentials: true` après login.

### 2.b — Frontend

**Nouveau store Zustand** [`stores/authStore.ts`](../applications/frontend/src/stores/authStore.ts) :

```ts
type AdminAuthMe = { scope: 'super-admin' | 'coach'; coachId: number | null; username: string };
type ParticipantAuthMe = { participantId: number };

useAuthStore = { adminMe, participantMe, bootstrapped, setAdminMe, setParticipantMe, clearAll }
```

Source de vérité unique pour les claims auth côté JS. Les JWTs étant maintenant httpOnly,
le frontend n'a plus aucun moyen de les lire — les claims utiles vivent dans ce store,
hydraté :
- au boot de l'app via `bootstrapAuth()` (cf. ci-dessous) ;
- après chaque login (`useAdminLogin`, `useParticipantLogin`, `useActivateInvite`) ;
- effacé sur logout, sur 401 non rattrapable, ou sur expiration.

**`lib/auth.ts`** ([auth.ts](../applications/frontend/src/lib/auth.ts)) — réécriture
complète. Plus aucun appel à `localStorage`. Les façades `userAdmin` / `userParticipant`
exposent désormais :
- `isAuthenticated()` → lit le store (synchrone, utilisable dans `beforeLoad`) ;
- `removeToken()` → `POST /<scope>/auth/logout` (best-effort) + clear store.

`parseAdminJwtClaims()` et `parseParticipantJwtParticipantId()` lisent le store, plus le
JWT (qu'on n'a plus). Signatures conservées pour ne pas toucher aux 14+ consommateurs
(routes `beforeLoad`, composants).

**Bootstrap** [`lib/bootstrapAuth.ts`](../applications/frontend/src/lib/bootstrapAuth.ts) :
au démarrage de l'app, appelle en parallèle `GET /admin/auth/me` et
`GET /participant/auth/me` avec `withCredentials: true`. Si l'utilisateur a un cookie
valide, le `/me` correspondant retourne 200 et hydrate le store. Sinon 401 silencieux et
le store reste vide pour ce scope. Marque `bootstrapped = true` à la fin (succès ou
échec).

[`main.tsx`](../applications/frontend/src/main.tsx) attend la résolution de
`bootstrapAuth()` **avant** de monter le `RouterProvider`. Garantit que les `beforeLoad`
de TanStack Router lisent un store hydraté plutôt que vide — sinon un utilisateur
authentifié serait flashé sur `/login` puis remonté.

**Clients axios** ([client.ts](../applications/frontend/src/api/client.ts) et
[participantClient.ts](../applications/frontend/src/api/participantClient.ts)) :

- `withCredentials: true` (cookies httpOnly).
- **Plus aucune injection** `Authorization: Bearer` (le frontend n'a plus accès au JWT).
- Interceptor 401 : tente `POST /<scope>/auth/refresh` puis rejoue la requête. Une seule
  promesse de refresh à la fois (déduplication). Sur échec → clear store + redirect login.

**Hooks login** :
- [`useAdminLogin`](../applications/frontend/src/hooks/admin.ts) : `onSuccess` →
  `useAuthStore.setAdminMe({ scope, coachId, username: '' })`.
- [`useParticipantLogin`](../applications/frontend/src/hooks/participantAuth.ts) :
  `onSuccess` → `useAuthStore.setParticipantMe({ participantId })`. Le contrat
  `ParticipantLoginResponse` est maintenant `{ participant_id: number }` au lieu de
  `{ access_token: string }`.
- [`useActivateInvite`](../applications/frontend/src/hooks/invitations.ts) : idem,
  `participant_id` → store.

**Test obsolète supprimé** : [`lib/auth.spec.ts`](../applications/frontend/src/lib/auth.spec.ts)
testait l'API `setToken/getToken/isAuthenticated` basée sur `localStorage`. La nouvelle
façade est radicalement différente (lecture sync depuis Zustand, logout via HTTP), un
nouveau test devra être écrit s'il y a besoin de couverture — pour l'instant, ZERO test
sur cette zone (cohérent avec la position "pas de tests significatifs" du user).

### 2.c — Vue d'ensemble des fichiers touchés

**Backend (6)** :
- [admin/admin.controller.ts](../applications/backend/src/presentation/admin/admin.controller.ts)
- [admin/jwt.strategy.ts](../applications/backend/src/presentation/admin/jwt.strategy.ts)
- [participant-session/participant.controller.ts](../applications/backend/src/presentation/participant-session/participant.controller.ts)
- [invitations/invitations-public.controller.ts](../applications/backend/src/presentation/invitations/invitations-public.controller.ts)
- [invitations/Invitations-public.module.ts](../applications/backend/src/presentation/invitations/Invitations-public.module.ts)
- [application/invitations/activate-invite-with-password.usecase.ts](../applications/backend/src/application/invitations/activate-invite-with-password.usecase.ts)

**Types partagés (1)** :
- [admin-auth.ts](../packages/aor-common/types/src/admin-auth.ts) — schéma
  `AdminLoginResponse` amputé.

**Frontend (8)** :
- [stores/authStore.ts](../applications/frontend/src/stores/authStore.ts) — nouveau
- [lib/bootstrapAuth.ts](../applications/frontend/src/lib/bootstrapAuth.ts) — nouveau
- [lib/auth.ts](../applications/frontend/src/lib/auth.ts) — rewrite
- [main.tsx](../applications/frontend/src/main.tsx) — bootstrap async avant mount
- [api/client.ts](../applications/frontend/src/api/client.ts) — retrait Bearer
- [api/participantClient.ts](../applications/frontend/src/api/participantClient.ts) — idem
- [hooks/admin.ts](../applications/frontend/src/hooks/admin.ts) — `useAdminLogin`
- [hooks/participantAuth.ts](../applications/frontend/src/hooks/participantAuth.ts) — `useParticipantLogin`
- [hooks/invitations.ts](../applications/frontend/src/hooks/invitations.ts) — `useActivateInvite`

---

## 3. État actuel des gaps RGPD

| ID | Statut |
|---|---|
| **G1** — JWT en localStorage | ✅ **Résolu**. Cookies httpOnly seulement, JWTs non lisibles côté JS. |
| **G2** — Pas d'export "mes données" participant | ✅ Résolu (commit du 2026-05-01). |
| **G3** — Pas de Privacy Policy / mention pré-questionnaire | ✅ Résolu (template à compléter par DPO). |
| **G4** — `DELETE /admin/participants/:id` non filtré coachId | ✅ Résolu. Filtrage scope=coach via `findByIdEnriched({ coachId })` dans `EraseParticipantRgpdUseCase`. |
| **G5** — `GET /admin/responses/:id` et `/matrix` non filtrés | ✅ Résolu. |
| **G6** — Pas d'audit trail | ✅ Résolu. Backend (logger + table `audit_events`) + viewer admin (§4.f). |
| **G7** — Pas de cron de purge tokens expirés | ⏳ LOW (nice-to-have V2). |
| **G8** — Pas de rate limiting login | ✅ Résolu. `@nestjs/throttler` (auth-strict 5/60s, auth-refresh 30/60s, default 60/60s). Désactivé en dev via `skipIf` (§4.b). |

**Tous les gaps HIGH et MEDIUM RGPD sont fermés**. Seul reste G7 (cron purge tokens),
classé LOW — à planifier en V2 sans urgence.

---

## 4. Session UX admin & viewer audit log (après-midi)

Travaux fonctionnels et UX déclenchés par les retours d'usage de l'utilisateur sur la
console admin. Aucun changement d'auth ni de schéma sensible — les modifications de DB
restent dans le périmètre des use cases existants.

### 4.a — Suppression d'entreprise en cascade RGPD

**Symptôme** : `DELETE /admin/companies/:id` retournait
`Impossible de supprimer : des participants sont encore rattachés` dès qu'au moins un
participant existait, alors que le popup de confirmation annonçait à tort
*« Les participants ne seront pas supprimés mais perdront leur rattachement »*.

**Décision (Option A confirmée par user)** : la suppression cascade les participants
rattachés via le pattern RGPD existant.
[`DeleteAdminCompanyUseCase`](../applications/backend/src/application/admin/companies/delete-admin-company.usecase.ts)
liste désormais via `participants.listByCompanyId(companyId)` et appelle
`eraseParticipantRgpd(p.id)` pour chacun (réponses + scores + invitations + anonymisation
des FK), avant `companies.deleteById`. Les campagnes cascadent déjà via
`onDelete: 'cascade'` du schéma. La validation backend qui refusait l'opération est
retirée.

Module : [`admin-companies.module.ts`](../applications/backend/src/presentation/admin/admin-companies.module.ts)
injecte `PARTICIPANTS_REPOSITORY_PORT_SYMBOL` (déjà global via `DatabaseModule`).

Frontend : popup
[`DeleteCompanyDialog`](../applications/frontend/src/components/admin/company-detail/DeleteCompanyDialog.tsx)
explicite désormais le nombre de participants impactés et la suppression cumulée
(participants + réponses + scores + invitations + campagnes).

**Limite connue** : pas d'atomicité globale. Chaque `eraseParticipantRgpd` ouvre sa propre
transaction Drizzle ; si le processus est interrompu en cours, certains participants sont
effacés sans la company. Solution future : ajouter une méthode unique transactionnelle
côté repository. Pour l'instant, relancer la suppression nettoie le reste.

### 4.b — Throttler désactivé hors production

`@nestjs/throttler` (G8) bloquait régulièrement les tests locaux avec
`ThrottlerException: Too Many Requests`.
[`app.module.ts`](../applications/backend/src/app/app.module.ts) : ajout d'un
`skipIf: () => process.env.NODE_ENV !== 'production'` au niveau du `ThrottlerModule`. La
protection brute-force reste active en prod, désactivée en dev/test.

### 4.c — Validations UX du flow campagne

- **Création de campagne sans entreprise** :
  [`AdminCampaignDrawerForm`](../applications/frontend/src/components/admin/AdminCampaignDrawerForm.tsx)
  affiche un Alert d'avertissement et désactive le bouton **Créer** quand
  `companies.length === 0`. Le `Select` Entreprise est aussi désactivé.
- **Lancement de campagne sans participant** :
  [`CampaignStatusActions`](../applications/frontend/src/components/admin/campaign-detail/CampaignStatusActions.tsx)
  reçoit une nouvelle prop `participantsCount`. Quand `status === 'draft'` et
  `participantsCount === 0`, un Alert s'affiche, le bouton **Lancer la campagne** est
  désactivé et un Tooltip explicatif apparaît au survol (`<span>` wrapper requis car
  les boutons disabled n'émettent pas d'événement de hover).
  [`CampaignDetailPage`](../applications/frontend/src/components/scoped/CampaignDetailPage.tsx)
  passe `participants.length`.

### 4.d — Import CSV participants depuis la fiche entreprise

Nouvel endpoint REST dédié, avec confirmation explicite avant l'envoi pour éviter les
miss-clicks.

**Backend** :
- [`ImportParticipantsCsvUseCase`](../applications/backend/src/application/admin/participants/import-participants-csv.usecase.ts)
  étendu d'un `options.forcedCompanyId?` optionnel. Si fourni, la colonne `company_name`
  du CSV et la colonne `questionnaire_type` sont **ignorées** : tous les participants sont
  rattachés à la company de l'URL et aucune invitation n'est créée (pas de campagne dans
  ce contexte).
- Nouveau endpoint
  [`POST /admin/companies/:companyId/participants/import`](../applications/backend/src/presentation/admin/admin-companies.controller.ts)
  (multipart `file`). Vérifie l'existence de la company via `getAdminCompany.execute`
  (404 sinon).
- [`AdminParticipantsModule`](../applications/backend/src/presentation/admin/admin-participants.module.ts)
  exporte `IMPORT_PARTICIPANTS_CSV_USE_CASE_SYMBOL` ;
  [`AdminCompaniesModule`](../applications/backend/src/presentation/admin/admin-companies.module.ts)
  l'importe.

**Frontend** :
- Nouvel utilitaire
  [`lib/parseCsv.ts`](../applications/frontend/src/lib/parseCsv.ts) : `parseSemicolonCsvText(text)`
  (mêmes règles que `parseSemicolonCsv` côté backend dans `@aor/utils`, mais sur `string`
  au lieu de `Buffer`) + `buildParticipantImportPreview(rows)` qui valide chaque ligne.
- Hook [`useImportParticipantsToCompany`](../applications/frontend/src/hooks/admin.ts)
  qui invalide `['admin', 'participants']` (préfixe brut), `companies`,
  `company(companyId)` et `dashboard`.
- Composant dédié
  [`CompanyImportCsv`](../applications/frontend/src/components/admin/company-detail/CompanyImportCsv.tsx) :
  parse local du CSV → ouverture d'un Dialog de **confirmation avec preview** (table des
  lignes avec ligne / prénom / nom / email / statut, lignes invalides surlignées en
  `tint.warningBg`, raison affichée). L'upload effectif n'est déclenché qu'au clic sur
  *« Importer N participants »*. Bouton désactivé si parse error ou 0 ligne valide.

### 4.e — Refactor `CompanyDetailPage` (497 → 157 lignes)

Découpage en 5 composants colocalisés dans
[`components/admin/company-detail/`](../applications/frontend/src/components/admin/company-detail/),
en miroir du dossier `campaign-detail/` :

- `CompanyImportCsv` (cf. §4.d) — encapsule la mutation, le state preview, le dialog.
- `DeleteCompanyDialog` — encapsule `useDeleteCompany`. Notifie le parent via
  `onDeleted` (qui navigue vers la liste).
- `DeleteCompanyParticipantDialog` — encapsule `useDeleteParticipant`. Notifie le parent
  via `onDeleted(snackMessage)`.
- `CompanyParticipantsTable` — Card "Collaborateurs" : header + bouton import + caption
  d'aide CSV + table paginée + states loading/empty.
- `CompanyDangerZone` — Card minimaliste avec le bouton de suppression (props `disabled`
  et `error` retirées : redondantes avec le toast d'erreur de `useDeleteCompany`).

`CompanyDetailPage` ne fait plus que composer ces blocs et garder les states de pilotage
(pagination, snackbar, dialogs ouverts).

### 4.f — Audit log : viewer admin

Le système d'audit existait côté backend (`audit_events` + `AuditLoggerService`) mais
aucune surface UI ne permettait de le consulter.

**Backend** :
- [`IAuditEventsRepositoryPort`](../applications/backend/src/interfaces/audit/IAuditEventsRepository.port.ts)
  étendu d'une méthode `list({ page, perPage })` retournant `Paginated<AuditEventListItem>`.
- Implémentation
  [`DrizzleAuditEventsRepository.list`](../applications/backend/src/infrastructure/database/repositories/drizzle-audit-events.repository.ts)
  avec `desc(createdAt)`, count + offset/limit, perPage clampé à 200.
- Use case
  [`ListAdminAuditEventsUseCase`](../applications/backend/src/application/admin/audit/list-admin-audit-events.usecase.ts).
- Nouveau endpoint
  [`GET /admin/audit-events?page=&per_page=`](../applications/backend/src/presentation/admin/admin-audit.controller.ts)
  **restreint super-admin** (`if (req.user.scope !== 'super-admin') throw UnauthorizedException()`).
  Réponse formatée snake_case.
- Nouveau module
  [`AdminAuditModule`](../applications/backend/src/presentation/admin/admin-audit.module.ts)
  ajouté à `AdminModule`. `AuditModule` exporte désormais
  `AUDIT_EVENTS_REPOSITORY_PORT_SYMBOL`.

**Types partagés** :
- Nouveau fichier
  [`packages/aor-common/types/src/audit.ts`](../packages/aor-common/types/src/audit.ts) :
  `auditActorTypeSchema` / `AuditActorType` et `adminAuditEventSchema` / `AdminAuditEvent`
  (Zod + `z.infer`, pattern habituel du package). Réexport via
  [`index.ts`](../packages/aor-common/types/src/index.ts). Build du package requis
  (`pnpm --filter @aor/types build`).

**Frontend** :
- Hook [`useAdminAuditEvents(page, perPage)`](../applications/frontend/src/hooks/admin.ts).
- Page [`routes/admin/audit-log.tsx`](../applications/frontend/src/routes/admin/audit-log.tsx) :
  header descriptif (G6 RGPD), table 5 colonnes (Date / Acteur / Action / Ressource / IP)
  avec Chip coloré par type d'acteur, pagination 25/50/100/200, état empty, skeletons.
  **Pas de page détail** par décision produit.
- Item nav `Audit log` (icône `ScrollText`) ajouté à `adminNav` dans
  [`routes/admin/route.tsx`](../applications/frontend/src/routes/admin/route.tsx). Imports
  `InputBase`/`Stack`/`Search` retirés au passage (warning préexistant).

### 4.g — Standardisation des boutons d'action des tables

Les boutons « voir le détail » des listes étaient incohérents : *Détail* + `ChevronRight`
sur les campagnes, *Ouvrir* + `ArrowRight` sur les entreprises, `IconButton` + `Tooltip` +
`ArrowRight` sur les coachs.

Nouveau composant
[`OpenDetailButton`](../applications/frontend/src/components/common/data-table/OpenDetailButton.tsx)
(exposé via [`data-table/index.ts`](../applications/frontend/src/components/common/data-table/index.ts)) :

- Props : `to`, `variant?: 'table' | 'card'` (défaut `table`), `label?` (défaut `« Ouvrir »`),
  `ariaLabel?`.
- `variant="table"` : `Button` text + `ChevronRight`, pour la dernière cellule d'une row.
- `variant="card"` : `Button` contained primary + `ChevronRight`, pour l'action principale
  d'une card mobile.

Convention finale appliquée partout : label **« Ouvrir »**, icône **`ChevronRight`**.
Substitué dans
[`CampaignsListPage`](../applications/frontend/src/components/scoped/CampaignsListPage.tsx),
[`CompaniesListPage`](../applications/frontend/src/components/scoped/CompaniesListPage.tsx)
et [`routes/admin/coaches/index.tsx`](../applications/frontend/src/routes/admin/coaches/index.tsx).
Imports `IconButton`/`Tooltip`/`ArrowRight` retirés là où ils n'étaient plus nécessaires.

### 4.h — Bug latent React Query : invalidation par préfixe

**Symptôme** : la table « Collaborateurs » de `CompanyDetailPage` ne se rafraîchissait
pas après un import CSV malgré l'appel à `qc.invalidateQueries({ queryKey: adminKeys.participants() })`.

**Cause** : `adminKeys.participants(page?, companyId?, perPage?)` produit
`['admin', 'participants', undefined, undefined, undefined]`. React Query 5 fait du
partial-prefix-match strict : `undefined !== 1`, `undefined !== 25` → la clé d'invalidation
ne matche aucune query paginée comme `['admin', 'participants', 1, 23, 10]`.

**Fix local** : dans
[`useImportParticipantsToCompany`](../applications/frontend/src/hooks/admin.ts), invalidation
remplacée par le préfixe brut `['admin', 'participants']` qui matche toutes les variantes.
Invalidation aussi de `companies`, `company(companyId)` et `dashboard` pour rafraîchir
le `participant_count` du `StatCard`.

**Bug latent identique** dans 5 autres hooks (`useUpdateParticipantProfile`,
`useImportParticipants`, `useCreateInvite`, `useInviteCampaignParticipants`,
`useImportParticipantsToCampaign`) — non corrigés volontairement (hors scope, à reprendre
quand un autre symptôme se manifestera). Solution propre : factoriser un
`invalidateParticipants(qc)` qui utilise le préfixe brut.

### 4.i — Quelques ajustements de wording / typo

- Item nav `audit-log` (cf. §4.f).
- Wording du popup de suppression entreprise (cf. §4.a).
- Caption d'aide sur les colonnes attendues du CSV dans
  [`CompanyParticipantsTable`](../applications/frontend/src/components/admin/company-detail/CompanyParticipantsTable.tsx).

### 4.j — Vue d'ensemble des fichiers touchés (session après-midi)

**Backend (10)** :
- [admin/companies/delete-admin-company.usecase.ts](../applications/backend/src/application/admin/companies/delete-admin-company.usecase.ts) — cascade RGPD
- [admin/participants/import-participants-csv.usecase.ts](../applications/backend/src/application/admin/participants/import-participants-csv.usecase.ts) — `forcedCompanyId`
- [admin/audit/list-admin-audit-events.usecase.ts](../applications/backend/src/application/admin/audit/list-admin-audit-events.usecase.ts) — nouveau
- [interfaces/audit/IAuditEventsRepository.port.ts](../applications/backend/src/interfaces/audit/IAuditEventsRepository.port.ts) — `list` ajouté
- [infrastructure/database/repositories/drizzle-audit-events.repository.ts](../applications/backend/src/infrastructure/database/repositories/drizzle-audit-events.repository.ts) — `list` impl
- [presentation/admin/admin-companies.controller.ts](../applications/backend/src/presentation/admin/admin-companies.controller.ts) — endpoint import CSV
- [presentation/admin/admin-companies.module.ts](../applications/backend/src/presentation/admin/admin-companies.module.ts)
- [presentation/admin/admin-audit.controller.ts](../applications/backend/src/presentation/admin/admin-audit.controller.ts) — nouveau
- [presentation/admin/admin-audit.module.ts](../applications/backend/src/presentation/admin/admin-audit.module.ts) — nouveau
- [presentation/admin/admin.module.ts](../applications/backend/src/presentation/admin/admin.module.ts), [admin.tokens.ts](../applications/backend/src/presentation/admin/admin.tokens.ts), [admin-participants.module.ts](../applications/backend/src/presentation/admin/admin-participants.module.ts), [audit/audit.module.ts](../applications/backend/src/presentation/audit/audit.module.ts) — wiring
- [app/app.module.ts](../applications/backend/src/app/app.module.ts) — `skipIf` throttler

**Types partagés (2)** :
- [packages/aor-common/types/src/audit.ts](../packages/aor-common/types/src/audit.ts) — nouveau
- [packages/aor-common/types/src/index.ts](../packages/aor-common/types/src/index.ts) — réexport

**Frontend (~14)** :
- [lib/parseCsv.ts](../applications/frontend/src/lib/parseCsv.ts) — nouveau
- [hooks/admin.ts](../applications/frontend/src/hooks/admin.ts) — `useImportParticipantsToCompany`, `useAdminAuditEvents`, fix invalidation
- [components/common/data-table/OpenDetailButton.tsx](../applications/frontend/src/components/common/data-table/OpenDetailButton.tsx) — nouveau
- [components/common/data-table/index.ts](../applications/frontend/src/components/common/data-table/index.ts)
- [components/admin/company-detail/](../applications/frontend/src/components/admin/company-detail/) — 5 nouveaux fichiers (`CompanyImportCsv`, `CompanyParticipantsTable`, `CompanyDangerZone`, `DeleteCompanyDialog`, `DeleteCompanyParticipantDialog`)
- [components/admin/AdminCampaignDrawerForm.tsx](../applications/frontend/src/components/admin/AdminCampaignDrawerForm.tsx) — validation 0 entreprise
- [components/admin/campaign-detail/CampaignStatusActions.tsx](../applications/frontend/src/components/admin/campaign-detail/CampaignStatusActions.tsx) — validation 0 participant
- [components/scoped/CompanyDetailPage.tsx](../applications/frontend/src/components/scoped/CompanyDetailPage.tsx) — refactor (497 → 157l)
- [components/scoped/CompaniesListPage.tsx](../applications/frontend/src/components/scoped/CompaniesListPage.tsx), [CampaignsListPage.tsx](../applications/frontend/src/components/scoped/CampaignsListPage.tsx), [CampaignDetailPage.tsx](../applications/frontend/src/components/scoped/CampaignDetailPage.tsx)
- [routes/admin/audit-log.tsx](../applications/frontend/src/routes/admin/audit-log.tsx) — nouveau
- [routes/admin/route.tsx](../applications/frontend/src/routes/admin/route.tsx), [routes/admin/coaches/index.tsx](../applications/frontend/src/routes/admin/coaches/index.tsx)

**Bilan validation après-midi** :
```bash
pnpm --filter @aor/backend-api typecheck   # ✅
pnpm --filter @aor/frontend-app typecheck  # ✅
pnpm --filter @aor/types build             # ✅ (requis après ajout du type AdminAuditEvent)
```

---

## 5. À faire avant prod

1. **Compléter le template Privacy Policy** ([routes/privacy.tsx](../applications/frontend/src/routes/privacy.tsx))
   — placeholders `{{...}}` à remplacer par les infos réelles (raison sociale, SIRET, DPO,
   sous-traitants, durée de conservation, etc.) — DPO/juriste.
2. **Variable d'env `FRONTEND_ORIGIN`** : configurer pour la prod (CORS), par défaut
   `http://localhost:5173` (dev Vite).
3. **CSP** : retirer `'unsafe-inline'` sur `script-src` après audit du bundle Vite prod
   (cf. [index.html](../applications/frontend/index.html)).
4. **Lancer la migration** sur l'env cible :
   `pnpm --filter @aor/drizzle db:migrate` (si bug spinner →
   `drizzle-orm/node-postgres/migrator` direct).
