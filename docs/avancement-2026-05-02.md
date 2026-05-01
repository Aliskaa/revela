# Plan d'avancement — Finalisation G1 RGPD : auth cookies-only complet

> Suite de [avancement-2026-05-01.md](avancement-2026-05-01.md). Cette session finalise
> le chantier **G1 RGPD** (cookies httpOnly + refresh tokens) en supprimant la dette
> laissée par la phase de transition : retrait du `localStorage` côté frontend, retrait
> du fallback `Authorization: Bearer` côté backend, et adaptation de l'endpoint d'invite.
>
> Cette session corrige aussi quelques régressions découvertes après le commit du
> 2026-05-01 :
>  - migration Drizzle 0013 corrompue par un index dupliqué dans le schéma ;
>  - footer participant manquant (lien Privacy Policy invisible côté `_participant/*`) ;
>  - import `cookie-parser` cassé sous le tsconfig de build NestJS.

---

## TL;DR

- **Auth cookies-only complet** : le frontend ne stocke plus aucun JWT en `localStorage`.
  Les claims utiles (scope admin, coachId, participantId) vivent dans un store Zustand
  hydraté au boot via `GET /<scope>/auth/me`. Toutes les requêtes API envoient les cookies
  httpOnly via `withCredentials: true`. L'injection `Authorization: Bearer` côté axios a
  disparu, ainsi que l'extracteur Bearer côté `JwtStrategy` Passport.
- **Endpoint `POST /invite/:token/activate`** aligné sur le même pattern : pose les cookies
  httpOnly + retourne `{ participant_id }`. Le hook `useActivateInvite` hydrate le store
  au lieu de stocker un JWT.
- **Dette tsconfig** : `esModuleInterop: true` ajouté au `tsconfig.json` backend pour que
  `import cookieParser from 'cookie-parser'` compile aussi sous `module: CommonJS` (mode du
  build NestJS).
- **Migration 0013** régénérée propre (`0013_sturdy_champions.sql`) après nettoyage de
  l'état BDD partiel laissé par l'index dupliqué.
- **Footer participant** : `<FooterLayout />` remonté dans `ParticipantShell`
  (`routes/_participant/route.tsx`) — le lien "Politique de confidentialité" est
  désormais visible sur tout l'espace participant.

**Bilan validation** :
```bash
pnpm --filter @aor/backend-api typecheck   # ✅
pnpm --filter @aor/backend-api lint        # ✅
pnpm --filter @aor/frontend-app typecheck  # ✅
pnpm --filter @aor/frontend-app lint       # ✅
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
| **G4** — `DELETE /admin/participants/:id` non filtré coachId | ⏳ MEDIUM, pas attaqué. |
| **G5** — `GET /admin/responses/:id` et `/matrix` non filtrés | ⏳ MEDIUM. |
| **G6** — Pas d'audit trail | ⏳ MEDIUM. |
| **G7** — Pas de cron de purge tokens expirés | ⏳ LOW. |
| **G8** — Pas de rate limiting login | ⏳ MEDIUM. |

Les 3 gaps **HIGH** sont fermés. Les 4 MEDIUM (G4/G5/G6/G8) constituent le prochain
chantier sécu V2. G7 (cron purge) est un nice-to-have.

---

## 4. À faire avant prod

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
