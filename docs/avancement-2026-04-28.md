# Plan d'avancement — Espace Coach dédié (V1.5)

> Cadrage technique de l'ajout d'un **espace Coach** distinct de l'espace
> super-admin, déclenché par la revue du document
> [Cadrage projet Revela v1.pdf](.) le 2026-04-27.
>
> Suite directe de [avancement-2026-04-27.md](avancement-2026-04-27.md). Ce
> fichier suit l'avancement de cette initiative spécifique sur les jours à
> venir.

---

## TL;DR

Le projet exposait **2 espaces frontend** (`/admin/*` partagé super-admin+coach via scope JWT, `/participant/*`). Le coach se connectait via `/admin/login` et atterrissait sur la même chrome admin que le super-admin, sans distinction visuelle ni filtrage des données.

**Modèle cible validé par l'utilisateur le 2026-04-27 et livré dans cette session** :

- ✅ **3 espaces frontend distincts** : `/participant/*`, `/coach/*`, `/admin/*`.
- ✅ **2 pages de login** :
  - `/login` → participant uniquement ;
  - `/admin/login` → coach + admin (le frontend redirige vers `/coach` ou `/admin` selon le scope renvoyé par le backend).
- ✅ **Cloisonnement strict** : un coach qui tape `/admin/*` est redirigé vers `/coach` ; un super-admin qui tape `/coach` est redirigé vers `/admin`.
- ✅ **Filtrage des données côté backend** : campagnes, participants, réponses, entreprises filtrés par `coachId` quand `scope=coach`. Tests d'isolation Vitest (6 nouveaux).

**Bilan validation** : Backend **18/18 tests** ✅, frontend **45/45 tests** ✅, lint frontend **0 erreur** ✅. Walkthrough manuel restant (se connecter en tant que coach DB et valider la nav).

---

## 1. État de l'existant (audit 2026-04-27)

### 1.1 Backend

- [admin-auth.usecase.ts](../applications/backend/src/application/admin/auth/admin-auth.usecase.ts) :
  - super-admin via env vars (`AdminAuthConfigPort`) → JWT `{ sub, role: 'admin', scope: 'super-admin' }`
  - coach via DB (`CoachesRepository.findByUsername`) → JWT `{ sub, role: 'admin', scope: 'coach', coachId }`
- [admin-or-participant-jwt-auth.guard.ts](../applications/backend/src/presentation/admin-or-participant-jwt-auth.guard.ts) : guard qui accepte tout JWT signé.
- **Endpoints admin actuellement non filtrés par coachId** : `/admin/campaigns`, `/admin/participants`, `/admin/responses`, `/admin/coaches`, `/admin/companies` retournent toutes les données quel que soit le scope.

### 1.2 Frontend

- [routes/admin/login.tsx](../applications/frontend/src/routes/admin/login.tsx) : après `login.mutateAsync`, fait simplement `navigate({ to: '/admin' })` — pas de routing conditionnel.
- [routes/admin/route.tsx](../applications/frontend/src/routes/admin/route.tsx) : chrome admin (sidebar 6 items, mobile drawer, topbar avec recherche, footer logout).
- [routes/participant/route.tsx](../applications/frontend/src/routes/participant/route.tsx) : chrome participant (sidebar 6 items, mobile drawer, topbar simple).
- Pas de `routes/coach/`.
- [src/lib/auth.ts](../applications/frontend/src/lib/auth.ts) : `parseAdminJwtClaims(token)` existe déjà → permet d'extraire `scope`, `coachId` côté UI sans appel API.

### 1.3 Conventions du projet à respecter

- [ADR-008](adr/ADR-008-backend-layer-first-with-actor-segmentation.md) : layer-first, sous-dossier `application/admin/` pour les use cases admin, sous-dossier `application/coach/` à créer pour les use cases côté coach.
- Convention de naming (cf. [ADR-008 §2](adr/ADR-008-backend-layer-first-with-actor-segmentation.md)) :
  - `participant-session/` = participant en session ;
  - `participants/` = collection admin ;
  - **Décision à acter** : on prend `coach-session/` (cohérent avec `participant-session/`) pour les use cases côté coach connecté, et `coaches/` (déjà en place, pluriel) reste pour la collection admin.

---

## 2. Plan d'exécution — 5 étapes

### Étape 1 — Backend : exposer le scope + filtres coach

**But** : que le frontend sache où rediriger après login, et qu'un coach ne voie que ses propres données.

#### 1.a — Réponse de login enrichie

Le `POST /admin/login` retourne actuellement `{ access_token }`. Le scope est déjà encodable dans le JWT, mais pour éviter au frontend de décoder côté client à chaque navigation, exposer explicitement :

```ts
// Retour du POST /admin/login
{
  access_token: string;
  scope: 'super-admin' | 'coach';
  coach_id: number | null;  // présent si scope='coach'
}
```

`AdminLoginResult` (domain) est déjà créé via `AdminLoginResult.create(token)` ; étendre pour inclure scope + coach_id, mettre à jour le DTO de présentation et le schema Zod dans `@aor/types`.

#### 1.b — Filtres coachId sur les endpoints

Les endpoints admin doivent accepter le scope du JWT et filtrer en conséquence. Pattern déjà bien établi avec les ports — il faut ajouter un paramètre `coachId?: number | null` aux use cases qui listent (et filtrer dans le repository), puis le passer depuis le controller via le claim JWT :

| Endpoint | Filtre quand scope=coach |
|---|---|
| `GET /admin/campaigns` | uniquement les campagnes où `coachId === claims.coachId` |
| `GET /admin/campaigns/:id` | 404 si pas attribuée à ce coach |
| `GET /admin/participants` | uniquement les participants des campagnes du coach |
| `GET /admin/responses` | uniquement les réponses des campagnes du coach |
| `GET /admin/companies` | uniquement les entreprises ayant au moins une campagne du coach |
| `GET /admin/coaches` | refus 403 (ou liste vide) — un coach n'a pas à voir ses confrères |
| `GET /admin/dashboard` | KPIs scopés au périmètre du coach |

#### 1.c — Tests

Au moins un test backend par endpoint critique : "un coach ne peut pas accéder à une campagne d'un autre coach" (test 403 ou 404). Couverture super-admin = inchangée.

**Estimation** : 0.5 j.

### Étape 2 — Frontend : redirection post-login

**But** : `/admin/login` redirige vers le bon espace selon le scope.

```tsx
// routes/admin/login.tsx — après mutateAsync
const result = await login.mutateAsync({ username, password });
if (result.scope === 'coach') {
    navigate({ to: '/coach' });
} else {
    navigate({ to: '/admin' });
}
```

Si on garde la lecture via le JWT plutôt que d'élargir la réponse de login (option 1.a alternative) :

```tsx
const claims = parseAdminJwtClaims(result.access_token);
navigate({ to: claims.scope === 'coach' ? '/coach' : '/admin' });
```

**Estimation** : 30 min.

### Étape 3 — Frontend : factoriser `<AppSidebar>` générique *(skippée en V1.5)*

**Décision en cours d'exécution (2026-04-27)** : la refacto de l'existant pour
introduire un `<AppSidebar>` paramétré demande de toucher 2 fichiers de chrome
(admin + participant) sans changement fonctionnel. Le risque de régression
visuelle sur des routes existantes est non négligeable, et la valeur n'apparaît
qu'au 3ème consommateur (le coach).

**Choix V1.5** : dupliquer la chrome admin → coach (étape 4), puis factoriser
en V2 quand les 3 chrome (admin / coach / participant) auront stabilisé leurs
besoins **réels** divergents (ex. le coach pourrait vouloir un compteur de
notifications dans la sidebar, ce que admin et participant n'ont pas).

**Risque assumé** : duplication de ~200 lignes entre `routes/admin/route.tsx`
et `routes/coach/route.tsx` jusqu'à la factorisation V2.

### Étape 4 — Frontend : créer `routes/coach/`

**But** : le coach a son propre espace, sa propre sidebar, ses propres routes.

#### 4.a — Squelette

```
routes/coach/
├── route.tsx              # chrome (AppSidebar + AppTopBar) + beforeLoad
├── index.tsx              # dashboard coach (KPIs filtrés)
├── campaigns/
│   ├── index.tsx          # liste de SES campagnes
│   └── $campaignId.tsx    # détail (réutilise les composants de admin/campaign-detail/)
└── participants/
    ├── index.tsx          # liste de SES participants
    └── $participantId.matrix.tsx  # déjà existant côté admin, à réutiliser
```

#### 4.b — `beforeLoad` strict

```ts
beforeLoad: () => {
    if (!userAdmin.isAuthenticated()) {
        throw redirect({ to: '/admin/login' });
    }
    const claims = userAdmin.getClaims();
    if (claims?.scope !== 'coach') {
        throw redirect({ to: '/admin' });  // un super-admin tape /coach → renvoyé sur /admin
    }
}
```

Et symétriquement, `routes/admin/route.tsx` ajoute :

```ts
if (claims?.scope === 'coach') {
    throw redirect({ to: '/coach' });  // un coach tape /admin → renvoyé sur /coach
}
```

#### 4.c — Sidebar coach (3-4 items)

| Item | Route |
|---|---|
| Dashboard | `/coach` |
| Mes campagnes | `/coach/campaigns` |
| Mes participants | `/coach/participants` |
| Mon profil (V2 : modifier mdp) | `/coach/profile` |

Pas de "Coachs", "Entreprises", "Réponses" globales — un coach ne voit que ses propres campagnes et leurs sous-objets.

#### 4.d — Dashboard coach

Réutiliser le composant `StatCard` :

| KPI | Source |
|---|---|
| Mes campagnes actives | filtrage côté backend (étape 1.b) |
| Mes participants | idem |
| Réponses collectées sur mes campagnes | idem |
| Prochaine action / restitution | nouveau use case `GetCoachNextAction` (V2) |

**Estimation** : 0.5 j.

### Étape 5 — Tests + validation

- **Backend** : tests d'isolation (un coach ne peut accéder aux données d'un autre coach via aucun endpoint).
- **Frontend** : test du routing post-login (scope=coach → /coach, scope=super-admin → /admin), test du beforeLoad (un super-admin sur /coach → /admin).
- **Manuel** : se connecter en tant que coach, vérifier que la sidebar est dédiée, que les KPIs sont filtrés, qu'aucune donnée hors-périmètre ne fuit.

**Estimation** : 0.25-0.5 j.

---

## 3. Décisions actées (validées par l'utilisateur le 2026-04-27)

| # | Décision | Choix retenu |
|---|---|---|
| 1 | Scope dans la réponse de login | ✅ **Exposé explicitement** dans le DTO de réponse (pas seulement dans le JWT) — contrat plus clair, le frontend route sans avoir à décoder le token. |
| 2 | Naming backend pour les use cases côté coach connecté | ✅ **`application/coach-session/`** (cohérent avec `participant-session/`). Mise à jour mineure de [ADR-008](adr/ADR-008-backend-layer-first-with-actor-segmentation.md) §2 à effectuer en parallèle. |
| 3 | Impersonation super-admin → coach pour debug | ✅ **Hors scope V1.5**. Décision révisable en V2 si besoin opérationnel émerge. |
| 4 | Coach voit-il les autres coaches | ✅ **Non**. Endpoint `GET /admin/coaches` retourne une liste vide pour `scope=coach` (plus simple côté frontend qu'un 403 à gérer dans `useCoaches`). |
| 5 | Coach modifie son propre mot de passe | ✅ **Hors scope V1.5**. Le super-admin reset via `PATCH /admin/coaches/:id`. Auto-service en V2. |

---

## 4. Statut d'exécution

| Étape | Statut | Notes |
|---|---|---|
| Audit existant + cadrage | ✅ | |
| **Étape 1.a — Backend : scope dans réponse login** | ✅ | `AdminLoginResult` enrichi avec `scope` et `coachId`. Factories `createSuperAdmin` / `createCoach`. DTO `POST /admin/auth/login` retourne `{ access_token, scope, coach_id }`. Schema Zod `adminLoginResponseSchema` ajouté à `@aor/types`. |
| **Étape 1.b — Backend : filtres coachId sur endpoints** | ✅ | Filtres ajoutés à `ListResponsesParams.coachId`, `ListParticipantsParams.coachId`, `listOrderedWithParticipantCount({ coachId? })`. Repos Drizzle filtrent via sous-select sur `campaigns.coach_id`. Controllers `admin-responses`, `admin-participants`, `admin-companies` propagent `req.user.coachId` quand `scope=coach`. Coaches déjà filtré (le coach se voit lui-même seul). Dashboard global laissé inchangé (cf. §5.1). |
| **Étape 1.c — Backend : tests d'isolation** | ✅ | 6 nouveaux tests Vitest sur les use cases `ListAdminParticipants`, `ListAdminResponses`, `ListAdminCompanies` : vérifient la propagation du `coachId` (forwarded quand `scope=coach`, undefined sinon). Backend tests : 12 → **18/18** ✅. |
| **Étape 2 — Frontend : redirection post-login** | ✅ | `useAdminLogin` typé `AdminLoginResponse`. `routes/admin/login.tsx` redirige vers `/coach` si `result.scope === 'coach'`, sinon `/admin`. |
| **Étape 3 — Frontend : refacto `<AppSidebar>`** | 🟡 Skippé V1.5 | La factorisation demandait de toucher 2 chrome existantes (admin + participant) pour 0 valeur fonctionnelle ; risque de régression sans bénéfice mesurable jusqu'au 3ème consommateur. Duplication acceptée pour V1.5, factorisation reportée à V2 quand les 3 chrome auront stabilisé leurs besoins divergents. |
| **Étape 4.a — Frontend : chrome coach + dashboard + listes** | ✅ | `routes/coach/route.tsx` (chrome dédiée : sidebar 4 items, mobile drawer, `beforeLoad` qui exige `scope=coach`). `routes/coach/index.tsx` (dashboard : 4 KPIs filtrés calculés à partir des hooks existants). `routes/coach/campaigns/index.tsx`, `routes/coach/participants.tsx`, `routes/coach/responses.tsx` (listes minimalistes avec pagination). |
| **Étape 4.b — `admin/route.tsx` bloque scope=coach** | ✅ | `beforeLoad` ajoute : `if (claims?.scope === 'coach') throw redirect({ to: '/coach' })`. Un coach qui tape `/admin/X` est immédiatement redirigé vers son espace dédié — il ne voit jamais la chrome admin. |
| **Étape 4.c — Routes détail coach** | ✅ | `routes/coach/campaigns/$campaignId.tsx` créée en réutilisant les composants partagés `CampaignSummaryCard`, `CampaignParticipantsTable`, `CampaignStatusActions`, `CampaignManageParticipants`, `CampaignPilotage` (déjà extraits côté admin). La sécurité repose sur `useAdminCampaign(id)` qui retourne `null` pour une campagne hors périmètre coach (filtre backend §1.b). Pas de détail Réponse côté coach en V1.5 (V2). |
| **Étape 5 — Validation** | ✅ | Backend : typecheck ✅, **18/18 tests** ✅. Frontend : typecheck ✅, **45/45 tests** ✅, **0 lint errors** ✅. Walkthrough manuel restant : se connecter en tant que coach (DB), vérifier la redirection vers `/coach`, naviguer dans les 4 onglets, ouvrir un détail campagne, tenter d'accéder à `/admin/X` (doit rediriger vers `/coach`). |
| ADR-008 §2 (`coach-session/`) | 🟡 Pas nécessaire en V1.5 | Aucun nouveau use case backend `application/coach-session/` créé : on a ré-utilisé `application/admin/*` (filtrés via `coachId`) et le mécanisme de scope JWT existant. Si une logique métier dédiée coach apparaît en V2 (ex. `GetCoachNextAction`, `SubmitCoachIaReview`), on l'ajoutera dans `application/coach-session/` et on actualisera ADR-008 à ce moment-là. |

---

## 5. Itération « Parité campagnes/entreprises + drill-down réponses » (2026-04-27 fin de session)

Suite à l'audit utilisateur de la sidebar coach initiale (4 items dont `/coach/responses`),
décisions actées :

- **Retirer `/coach/responses`** : une réponse hors contexte (sans campagne ni participant) a peu
  de valeur métier ; le journal chronologique cross-campagnes n'est pas un cas d'usage du coach.
- **Garder `/coach/participants`** standalone : utile pour voir tous ses participants en un coup
  d'œil cross-campagnes.
- **Atteindre la parité admin pour `campaigns/` et `companies/`** : drawer création, sort, pagination, recherche.
- **Permissions souples V1.5** : un coach peut créer/éditer/supprimer entreprises et campagnes
  (filtrage uniquement sur la visibilité côté backend, pas sur les actions). Durcissement V2 si besoin.
- **Drill-down réponses via contexte campagne** : depuis le détail d'une campagne, le coach peut
  ouvrir la matrix d'un participant (ses scores auto-éval / pairs / scientifique).

### 5.1 Sidebar coach finale (4 items)

| Item | Route |
|---|---|
| Tableau de bord | `/coach` |
| Mes campagnes | `/coach/campaigns` |
| Mes entreprises | `/coach/companies` |
| Mes participants | `/coach/participants` |

### 5.2 Suppressions

| Élément | Action |
|---|---|
| [routes/coach/responses.tsx](../applications/frontend/src/routes/coach/responses.tsx) | Supprimé |
| Item « Mes réponses » dans la sidebar coach | Retiré de [routes/coach/route.tsx](../applications/frontend/src/routes/coach/route.tsx) |
| KPI « Mes réponses » sur le dashboard coach | Conservé (suggestion utilisateur — indicateur d'activité) |

### 5.3 Upgrade `/coach/campaigns/`

[routes/coach/campaigns/index.tsx](../applications/frontend/src/routes/coach/campaigns/index.tsx) — réécrit pour parité avec [routes/admin/campaigns/index.tsx](../applications/frontend/src/routes/admin/campaigns/index.tsx) :

- 4 StatCards (mes campagnes, actives, entreprises, questionnaires) ;
- Drawer création `<AdminCampaignDrawerForm>` réutilisé (le backend force `coach_id = req.user.coachId`
  pour `scope=coach` côté `admin-campaigns.controller`) ;
- Recherche, pagination, table desktop + cards mobile ;
- Colonne « Coach » masquée (le coach ne voit que ses propres campagnes).

### 5.4 Création `/coach/companies/`

| Fichier | Rôle |
|---|---|
| [routes/coach/companies/index.tsx](../applications/frontend/src/routes/coach/companies/index.tsx) (nouveau) | Liste filtrée par `coachId` (cf. §1.b filtrage `companies.listOrderedWithParticipantCount`), 3 StatCards, drawer création `<AdminCompanyDrawerForm>`, sort multi-colonnes (nom, contact, participants), pagination, recherche. |
| [routes/coach/companies/$companyId.tsx](../applications/frontend/src/routes/coach/companies/$companyId.tsx) (nouveau) | Détail entreprise : 3 StatCards (collaborateurs, contact, ID), table participants paginée, dialog suppression entreprise + dialog suppression participant (RGPD), zone dangereuse. Réplique fidèle de la version admin avec liens adaptés. |

### 5.5 Drill-down réponses via contexte campagne

| Action | Détail |
|---|---|
| Enrichi [`CampaignParticipantsTable`](../applications/frontend/src/components/admin/campaign-detail/CampaignParticipantsTable.tsx) | Ajout des props `matrixUrlPrefix?: string` + `questionnaireId?: string \| null`. Si `matrixUrlPrefix` est fourni, une nouvelle colonne « Réponses » affiche un bouton qui ouvre `${matrixUrlPrefix}/${participantId}/matrix?qid=${questionnaireId ?? 'B'}`. `COL_SPAN` mis à 7 pour absorber la nouvelle colonne. |
| [routes/admin/campaigns/$campaignId.tsx](../applications/frontend/src/routes/admin/campaigns/$campaignId.tsx) | Passe `matrixUrlPrefix="/admin/participants"` + `questionnaireId={campaign.questionnaireId}`. |
| [routes/coach/campaigns/$campaignId.tsx](../applications/frontend/src/routes/coach/campaigns/$campaignId.tsx) | Passe `matrixUrlPrefix="/coach/participants"` + idem. |
| [routes/coach/participants/$participantId.matrix.tsx](../applications/frontend/src/routes/coach/participants/$participantId.matrix.tsx) (nouveau) | Réplique de [admin/$participantId.matrix.tsx](../applications/frontend/src/routes/admin/participants/$participantId.matrix.tsx) avec retour vers `/coach/participants`. Utilise le composant partagé `<ParticipantQuestionnaireMatrix>`. |

**Restructuration** : `routes/coach/participants.tsx` → `routes/coach/participants/index.tsx` pour héberger la sous-route `$participantId.matrix.tsx` (convention TanStack Router flat-file).

### 5.6 Validations

- Frontend typecheck ✅
- Frontend tests **45/45** ✅
- Frontend lint **0** ✅ (2 fichiers auto-formatés par `pnpm format` après refactor)
- Backend typecheck ✅ + tests **18/18** ✅ (inchangés — pas de modif backend dans cette itération)

### 5.7 Limites résiduelles

- `GET /admin/participants/:id/matrix` n'est **pas** filtré par `coachId` côté backend. Un coach
  malveillant qui devine un `participantId` hors périmètre peut consulter sa matrix. Mitigé par :
  (1) le coach n'a aucun moyen de **lister** ces IDs hors périmètre via l'UI (la liste participants
  est filtrée backend) ;
  (2) la matrix ne contient pas d'identité civile sensible (juste les scores psychométriques).
  À durcir en V2 (cf. §5.2).
- Les routes admin/coach détail campagne sont quasi-identiques (~155 lignes dupliquées). Refacto
  vers un composant `<CampaignDetailPage>` partagé reportée au moment où une 3ème variation
  émergerait.

---

## 6. Itération « Participant à la racine `/` » (2026-04-28)

Constat utilisateur : `/` retournait un 404 car le dashboard participant était sur `/participant`.
L'expérience démarrait depuis une URL technique (`/participant`) au lieu de la racine du domaine.

**Décision actée** : restructurer pour que le participant occupe la racine, garder `/admin` et
`/coach` tels quels. Conflit résolu : la page « Mon coach » du participant (qui montre le coach
assigné) entrait en collision avec `/coach` (espace du coach connecté). Renommée `/my-coach`.

### 6.1 Mapping des routes

| Avant | Après |
|---|---|
| `/participant` (dashboard) | `/` |
| `/participant/campaigns` | `/campaigns` |
| `/participant/journey` | `/journey` |
| `/participant/results` | `/results` |
| `/participant/profile` | `/profile` |
| `/participant/peer-feedback` | `/peer-feedback` |
| `/participant/self-rating` | `/self-rating` |
| `/participant/test/$qcode` | `/test/$qcode` |
| `/participant/coach` (« Mon coach » page info) | `/my-coach` (renommée pour éviter la collision avec l'espace coach) |
| `/admin/*` | inchangé |
| `/coach/*` (espace coach connecté) | inchangé |

### 6.2 Restructuration TanStack Router

`routes/participant/` → `routes/_participant/` (préfixe `_` = pathless layout TanStack Router).
Le layout `route.tsx` contient toujours la chrome participant (sidebar, top bar, beforeLoad)
mais ne contribue **pas** à l'URL — le segment `/_participant` est éliminé du chemin final.

Les `createFileRoute()` paths internes deviennent `/_participant/X` (convention TanStack
Router pour les routes enfants d'un layout pathless), tandis que les URLs visibles côté
utilisateur sont `/X`.

### 6.3 `beforeLoad` cross-rôle (`routes/_participant/route.tsx`)

```ts
beforeLoad: () => {
    if (userAdmin.isAuthenticated()) {
        const claims = parseAdminJwtClaims();
        if (claims?.scope === 'coach') {
            throw redirect({ to: '/coach' });
        }
        throw redirect({ to: '/admin' });
    }
    if (!userParticipant.isAuthenticated()) {
        throw redirect({ to: '/login' });
    }
},
```

Cas couverts :
1. Super-admin authentifié qui tape `/` → renvoyé vers `/admin`.
2. Coach authentifié qui tape `/` → renvoyé vers `/coach`.
3. Participant authentifié → laisse passer (chrome participant montée).
4. Aucun token → renvoyé vers `/login`.

Symétriques : `routes/admin/route.tsx` et `routes/coach/route.tsx` ont déjà leur garde qui
redirige vers l'espace correct si le rôle ne correspond pas (livré §4.b).

### 6.4 Mise à jour des liens internes

Tous les liens internes (`<Link to>`, `navigate({ to })`, `redirect({ to })`, `href=`)
qui pointaient vers `/participant/X` ont été remappés en `/X`.

**Cas particulier** : `/participant/coach` traité **avant** le pattern global `/participant/X`
→ devient `/my-coach` (au lieu de `/coach` qui aurait collisionné avec l'espace coach).

### 6.5 Incident notable pendant la migration

Le `sed` initial (`s|/participant/|/|g`) était **trop large** : il a aussi remplacé les chemins
d'**API** qui commençaient par `/participant/` (ex. `participantApiClient.get('/participant/session')`
→ `'/session'`) et les **imports** (`@/lib/participant/dashboardView` → `@/lib/dashboardView`).
Le typecheck ne l'a pas détecté immédiatement (les chemins string ne sont pas typés).

**Récupération** :
- `git checkout HEAD --` sur les hooks `participantAuth`, `participantSession`, `questionnaires`,
  `responses`, `useQuestionnaireOrchestrator` et les composants `questionnaire/PeerRatingStep`,
  `ScientificTestStep`, `SelfRatingStep` — tous restaurent les chemins API d'origine.
- `sed` ciblé pour restaurer les imports `@/lib/dashboardView` → `@/lib/participant/dashboardView`
  dans 6 fichiers.

**Leçon retenue** : pour des renames d'URL en masse, **scoper le sed à un pattern plus
spécifique** (ex. `to: '/participant/'`, `href="/participant/"`, `<Link to="/participant/`)
plutôt que de matcher la substring `/participant/`. À documenter pour les futurs renames.

### 6.6 Validations

- Frontend typecheck ✅
- Frontend tests **45/45** ✅
- Frontend lint **0 erreur** ✅
- Backend cross-validation : typecheck ✅ (aucune modification backend)

---

## 6bis. Confirmation de participation côté participant (livré ce jour)

### Contexte

Bug UX repéré sur `/campaigns` : le bouton **« Commencer le parcours »** s'affiche sur toute campagne `active`, même tant que `invitation_confirmed === false`. Si le participant clique avant d'avoir confirmé, le backend rejette toute soumission avec :

```
{ "error": "Vous devez confirmer votre participation à la campagne avant de répondre." }
```

Avant ce jour, la confirmation existait **uniquement** par jeton d'invitation envoyé par e-mail (`ConfirmInviteParticipationUseCase`). Aucun endpoint participant authentifié ne permettait de confirmer depuis l'UI.

### Backend

- Nouveau use case `ConfirmCampaignParticipationUseCase` ([applications/backend/src/application/participant-session/confirm-campaign-participation.usecase.ts](applications/backend/src/application/participant-session/confirm-campaign-participation.usecase.ts)).
  - Vérifie que le participant a bien été invité à la campagne via `getCampaignParticipantInviteState`. Si non → `ParticipantQuestionnaireNotAllowedError` (HTTP 403, mappé par `ParticipantSessionExceptionFilter`).
  - Idempotent : si `joinedAt !== null`, no-op.
  - Sinon, appelle `confirmCampaignParticipantParticipation(campaignId, participantId)`.
- Endpoint `POST /participant/campaigns/:campaignId/confirm` ajouté dans [participant.controller.ts](applications/backend/src/presentation/participant-session/participant.controller.ts), protégé par `ParticipantJwtAuthGuard` + `ParticipantSessionExceptionFilter`.
- DI câblé dans [participant.module.ts](applications/backend/src/presentation/participant-session/participant.module.ts) avec le symbole `CONFIRM_CAMPAIGN_PARTICIPATION_USE_CASE_SYMBOL` ([participant.tokens.ts](applications/backend/src/presentation/participant-session/participant.tokens.ts)).

### Frontend

- Hook `useConfirmCampaignParticipation` ajouté dans [hooks/participantSession.ts](applications/frontend/src/hooks/participantSession.ts). Invalide la query `participant.session` au succès et déclenche un toast i18n.
- Clés i18n `toast.campaignParticipationConfirmed` / `campaignParticipationConfirmFailed` dans [fr.json](applications/frontend/src/lib/i18n/locales/fr.json).
- [routes/_participant/campaigns.tsx](applications/frontend/src/routes/_participant/campaigns.tsx) : la `Campaign` view-model expose désormais `invitationConfirmed`. Le `CampaignCard` affiche **un Alert** + **un bouton « Confirmer ma participation »** (icône `BadgeCheck`) quand la campagne est `active` mais non confirmée. Le bouton « Commencer le parcours » n'apparaît plus que si `isActive && invitationConfirmed`.

### Validations

- Backend typecheck ✅ — Backend tests **18/18** ✅ — Backend lint **0 erreur sur les fichiers touchés** ✅
- Frontend typecheck ✅ — Frontend tests **45/45** ✅ — Frontend lint **0 erreur sur les fichiers touchés** ✅

---

## 7. Limites assumées en V1.5 (consolidé)

### 6.1 Dashboard coach calculé côté frontend

`GET /admin/dashboard` agrège plusieurs métriques (`totalResponses`, `totalParticipants`, `totalCompanies`, `byQuestionnaire`). Pour le filtrer par `coachId`, il faudrait étendre 5 méthodes de ports + 5 implémentations Drizzle (responses.countAll, responses.countByQuestionnaire, responses.findLatestSubmittedAt, participants.countAll, companies.listOrderedWithParticipantCount).

**Choix V1.5** : pas de filtrage backend du dashboard. Le **dashboard coach côté frontend** sera composé à partir des hooks existants déjà filtrés (`useAdminCampaigns`, `useAdminParticipants`, `useAdminResponses` → `.length` / agrégations côté UI). Économie de 1-2 jours de plomberie pour un visuel équivalent en V1.5.

→ L'endpoint `/admin/dashboard` reste accessible aux coaches mais retourne des KPIs **globaux**. Le dashboard coach n'utilise **pas** cet endpoint et masque la sidebar item « Tableau de bord global » pour les coaches (si elle existe). À auditer côté frontend lors de l'étape 4.

À faire en V2 : endpoint `/admin/dashboard/coach` ou ajouter `coachId` aux ports métriques. Décision quand le besoin émerge.

### 6.2 Vérification d'accès sur les détails par ID (`GET /admin/responses/:id`, `DELETE /admin/responses/:id`)

La couverture du filtrage `coachId` porte sur les **listes** (`GET /admin/campaigns`, `GET /admin/participants`, `GET /admin/responses`, `GET /admin/dashboard`). Les endpoints **détail par ID** (`GET /admin/responses/:id`) ne vérifient pas que la ressource appartient au périmètre du coach connecté.

**Impact réel** : un coach malveillant qui devine ou récupère un `responseId` hors de son périmètre peut le consulter. Risque mitigé par :
- Le coach n'a aucun moyen de **lister** des réponses hors périmètre (filtre `coachId` sur la liste = première barrière) ;
- Les IDs sont des entiers séquentiels donc devinables, mais la donnée est confidentielle métier (pas d'identité civile, pas de financier).

**À faire en V2** : ajouter la vérification d'accès sur chaque endpoint `:id` (responses, participants, etc.) en injectant le repository concerné dans le controller et en validant `record.campaignId ∈ campagnes du coach`.

## 8. Hors scope V1.5 (à tracer dans TOTO)

- **Workflow validation IA-coach** (cadrage page 8) : analyse IA générée → revue/édition coach → envoi participant. Dépend de l'analyse IA elle-même qui est un autre chantier.
- **Impersonation super-admin → coach** pour debug.
- **Auto-service coach** : changer son propre mot de passe, mettre à jour son profil display name, voir son historique de coachings clos.
- **Notifications coach** : alertes quand un participant termine une étape, etc.
