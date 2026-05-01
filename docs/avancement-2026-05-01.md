# Plan d'avancement — Refacto architecture frontend + audit RGPD

> Suite de [avancement-2026-04-29.md](avancement-2026-04-29.md). Ce fichier trace
> deux chantiers indépendants menés le 2026-05-01 :
>
> 1. **Refacto complet de l'architecture frontend** (5 phases, mono-commit) pour
>    éliminer la duplication routes admin/coach, unifier les composants UI et
>    centraliser les conventions.
> 2. **Cleanup de l'espace « Réponses »** côté admin (sidebar + routes mortes).
> 3. **Audit RGPD** complet du repo (frontend + backend) — diagnostic uniquement,
>    aucune modification de code, prêt pour priorisation métier/juridique.

---

## TL;DR

- Refacto frontend en 5 phases :
  1. Tokens UI + StatCard unifié + Chips réutilisables.
  2. Constantes métier centralisées (`lib/labels/`).
  3. Suppression des formulaires legacy non importés.
  4. Lego CRUD réutilisables (`PageHeroCard`, `KpiGrid`, `useTablePagination`,
     helpers de table).
  5. Pages partagées admin/coach (`<CampaignsListPage scope>`, etc.) +
     `ScopedAppShell` factorisant la sidebar.
- Item « Réponses » retiré de la sidebar admin (incohérent avec coach et sans
  intérêt cross-campagnes). Routes `/admin/responses/*` supprimées, hooks
  `useAdminResponse` et `useDeleteResponse` supprimés (orphelins).
- Audit RGPD : 3 gaps **HIGH** (JWT en localStorage, pas d'export participant,
  pas de Privacy Policy), 4 gaps **MEDIUM** (filtrages coachId manquants sur
  endpoints détail, audit trail absent, pas de rate limiting), 1 gap **LOW**
  (pas de cron de purge des invite tokens expirés).

**Bilan validation** : `pnpm --filter @aor/frontend-app typecheck` ✅,
`pnpm --filter @aor/frontend-app lint` ✅. Pas de tests touchés (le user a
explicitement écarté ce périmètre, cf. tests supprimés en commit
[`e0f571c`](https://github.com)).

---

## 1. Refacto architecture frontend

### Contexte

Audit initial du dossier [`applications/frontend/src/`](../applications/frontend/src/) :
architecture saine à 70 % (TanStack Router/Query, séparation auth admin/participant,
theme MUI, hooks query bien structurés) mais fragmentée par 6 sources majeures
de duplication :

| # | Problème | Impact |
|---|---|---|
| 1 | Routes `admin/*` et `coach/*` clonées à 95 % | ~9 fichiers dupliqués |
| 2 | 2 systèmes de formulaires coexistent (legacy `campaign/form.tsx` vs `AdminCampaignDrawerForm`) | Confusion |
| 3 | 4 variants de cartes stats (`MiniStat`, `StatCard`, `MetricCard`, `InfoCard`) | ~190 lignes pour la même chose |
| 4 | `StatusChip`/`ProgressChip` avec couleurs `sx` hardcodées + variantes inline dans 7 routes | Couleurs incohérentes |
| 5 | Pas de wrapper CRUD générique → chaque page admin re-écrit search + pagination + skeleton | ~5 routes |
| 6 | Labels/enums (`QUESTIONNAIRE_LABELS`, status labels) redéfinis dans 4+ composants | Risque de divergence |

### Phase 1 — Tokens UI + StatCard unifié + Chips unifiés

**Objectif** : éliminer les 4 variants de cartes et les couleurs hardcodées.

- Création de [`components/common/cards/StatCard.tsx`](../applications/frontend/src/components/common/cards/StatCard.tsx)
  unifié avec props `variant: 'big' | 'compact' | 'mini'`, `frame: 'card' | 'box'`,
  `tint: 'primary' | 'secondary'`, `progress?: number` (LinearProgress optionnel).
  Remplace `StatCard`, `MiniStat`, `MetricCard`, `InfoCard`.
- Création de [`components/common/chips/`](../applications/frontend/src/components/common/chips/) :
  - `CampaignStatusChip` (CampaignStatus → palette via tokens du thème).
  - `ActiveStatusChip` (boolean isActive).
  - `ProgressChip` (CampaignParticipantProgress, déplacé depuis
    `campaign-detail/`).
  - `ParticipantStatusChip` (logique `getParticipantActivityStatus` extraite).
- Tous utilisent les tokens `tint.successBg / successText / mutedBg / mutedText / secondaryBg / secondaryText`
  déjà déclarés dans [`lib/theme.ts`](../applications/frontend/src/lib/theme.ts).
  Plus aucune couleur RGB hardcodée dans les chips.

**Fichiers supprimés** :
- `components/common/StatCard.tsx`, `StatCard.spec.tsx`, `MiniStat.tsx`, `InfoCard.tsx`.
- `components/participant-dashboard/MetricCard.tsx`.
- `components/admin/campaign-detail/StatusChip.tsx`, `ProgressChip.tsx`.

**Migrations** : 17 fichiers ont vu leur import `StatCard` rebasé vers
`@/components/common/cards`. 7 routes ont vu leur `function StatusChip` local
supprimé au profit de l'import depuis `@/components/common/chips`.

### Phase 2 — Constantes métier centralisées

- [`lib/labels/questionnaires.ts`](../applications/frontend/src/lib/labels/questionnaires.ts) :
  `QUESTIONNAIRE_LABELS` + helper `questionnaireLabel(id)` qui gère le fallback
  null/undefined/empty. Remplace les 4 redéfinitions locales (`routes/admin/index.tsx`,
  `routes/admin/campaigns/index.tsx`, `routes/coach/campaigns/index.tsx`,
  `lib/admin/campaignDetailView.ts`).
- [`lib/labels/campaign-status.ts`](../applications/frontend/src/lib/labels/campaign-status.ts) :
  `CAMPAIGN_STATUS_LABELS` + `CAMPAIGN_STATUS_OPTIONS` (prêt à brancher sur les
  Select MUI). Pas encore consommé partout — TODO V2.

### Phase 3 — Suppression des formulaires legacy

Trois formulaires auto-contenus (button + drawer + state) qui dupliquaient à 90 %
le système moderne `AdminDrawerForm` + `useDrawerForm` + Zod, mais qui n'étaient
**plus importés nulle part** depuis le déploiement des `Admin*DrawerForm` :

- `components/campaign/form.tsx`
- `components/coach/form.tsx`
- `components/company/form.tsx`

Suppression nette + suppression des dossiers parents (devenus vides).

### Phase 4 — Lego CRUD générique

Plutôt qu'un mega-`<CrudListPage>` rigide, création de briques réutilisables :

| Brique | Rôle |
|---|---|
| [`components/common/layout/PageHeroCard.tsx`](../applications/frontend/src/components/common/layout/PageHeroCard.tsx) | En-tête de page : eyebrow + titre + sous-titre + actions |
| [`components/common/layout/KpiGrid.tsx`](../applications/frontend/src/components/common/layout/KpiGrid.tsx) | Grille responsive 1 → N colonnes pour les `StatCard` |
| [`components/common/data-table/StandardTablePagination.tsx`](../applications/frontend/src/components/common/data-table/StandardTablePagination.tsx) | `<TablePagination>` MUI préconfiguré FR |
| [`components/common/data-table/EmptyTableRow.tsx`](../applications/frontend/src/components/common/data-table/EmptyTableRow.tsx) | Cellule "aucune ligne" centralisée |
| [`lib/useTablePagination.ts`](../applications/frontend/src/lib/useTablePagination.ts) | Hook factorisant `page / rowsPerPage / paged / reset on filter change` |

### Phase 5 — Pages scope-aware + AppShell partagé

**Layout factorisé** :

- [`components/layout/ScopedAppShell.tsx`](../applications/frontend/src/components/layout/ScopedAppShell.tsx) :
  coque applicative (sidebar desktop + topbar mobile + drawer mobile) configurable
  via `nav: ScopedNavItem[]` + `brandIcon / brandLabel / brandEyebrow / avatarInitial`.
  Avant : 2 fichiers (`routes/admin/route.tsx` et `routes/coach/route.tsx`)
  répliquaient quasi ligne pour ligne le `BrandMark`, la sidebar, le drawer mobile
  et le bouton de logout.

**Pages partagées** (un seul composant pour admin + coach, scope-driven) :

| Composant | Remplace |
|---|---|
| [`components/scoped/CampaignsListPage.tsx`](../applications/frontend/src/components/scoped/CampaignsListPage.tsx) | `routes/admin/campaigns/index.tsx` + `routes/coach/campaigns/index.tsx` |
| [`components/scoped/CampaignDetailPage.tsx`](../applications/frontend/src/components/scoped/CampaignDetailPage.tsx) | `routes/admin/campaigns/$campaignId.tsx` + `routes/coach/campaigns/$campaignId.tsx` |
| [`components/scoped/CompaniesListPage.tsx`](../applications/frontend/src/components/scoped/CompaniesListPage.tsx) | `routes/admin/companies/index.tsx` + `routes/coach/companies/index.tsx` |
| [`components/scoped/CompanyDetailPage.tsx`](../applications/frontend/src/components/scoped/CompanyDetailPage.tsx) | `routes/admin/companies/$companyId.tsx` + `routes/coach/companies/$companyId.tsx` |

Les routes admin/coach correspondantes deviennent des coquilles de 7 lignes :

```tsx
// applications/frontend/src/routes/admin/campaigns/index.tsx
import { createFileRoute } from '@tanstack/react-router';
import { CampaignsListPage } from '@/components/scoped/CampaignsListPage';

export const Route = createFileRoute('/admin/campaigns/')({
    component: () => <CampaignsListPage scope="admin" />,
});
```

Différences contextuelles encapsulées dans des objets `SCOPE_CFG` :
- Préfixe de lien (`/admin/campaigns/$id` vs `/coach/campaigns/$id`).
- Eyebrow / titre / sous-titre / message empty-state.
- Affichage de la colonne « Coach » (admin uniquement).
- Pré-remplissage `lockedCoachId` côté coach (claims JWT) — masque le `<Select>`
  Coach inutile.
- Choix du KPI « Participants » (admin, via `useAdminDashboard`) vs
  « Entreprises » (coach, calculé localement).

### Bilan refacto

- **Lignes supprimées** : ~1 500 (pages dupliquées + 4 cards + 2 chips + 3 forms
  legacy + 7 `function StatusChip` locaux + redéfinitions de constantes).
- **Lignes ajoutées** : ~900 (Lego + pages scope-aware + ScopedAppShell).
- **Net** : -600 lignes, surface de bug réduite, conventions enforcées par le
  type system.

---

## 2. Cleanup espace « Réponses » admin

### Demande

> « Comme pour les coach, avoir les réponses dans la sidebar des admin n'a pas
> vraiment d'intérêt vu qu'une réponse dépend d'un participant et de la
> campagne auquel il est rattaché. »

La consultation des réponses se fait déjà depuis :
- la fiche campagne (table participants → bouton « Voir les réponses » → matrix
  via `CampaignParticipantsTable` avec `matrixUrlPrefix`),
- la fiche participant (`ParticipantDetailView`).

Une vue cross-campagne n'a effectivement pas d'usage métier identifié.

### Modifications

- Item « Réponses » retiré de `adminNav` dans [`routes/admin/route.tsx`](../applications/frontend/src/routes/admin/route.tsx).
  Sidebar admin alignée sur sidebar coach (pas d'entrée dédiée).
- Routes supprimées :
  - `routes/admin/responses/index.tsx`
  - `routes/admin/responses/$responseId.tsx`
  - dossier `routes/admin/responses/` (vide).
- Hooks orphelins supprimés dans [`hooks/admin.ts`](../applications/frontend/src/hooks/admin.ts) :
  - `useAdminResponse(id)` (singulier — détail).
  - `useDeleteResponse()` (jamais utilisé, code mort ancien).
  - `adminKeys.response(id)` (clé associée).
  - import `ResponseDetail` de `@aor/types`.
- `useAdminResponses` (pluriel) **conservé** : utilisé par
  [`routes/coach/index.tsx`](../applications/frontend/src/routes/coach/index.tsx) pour
  le KPI « Mes réponses » du dashboard coach.
- `routeTree.gen.ts` régénéré automatiquement par le plugin
  `@tanstack/router-plugin` (déclenché par la modification du dossier `routes/`).

### Reste backend

Les use cases backend (`ListAdminResponsesUseCase`, `GetAdminResponseUseCase`,
`DeleteAdminResponseUseCase`, exports CSV) restent en place — ils servent encore
le KPI coach (`useAdminResponses`) et les endpoints sont toujours exposés. À
arbitrer en V2 si le coach passe à un endpoint dédié `coach/responses/count`.

---

## 3. Audit RGPD

### Périmètre

Audit factuel du repo (frontend + backend + schéma DB) sur les 9 grandes
catégories d'obligations RGPD. Aucune modification de code — diagnostic uniquement.
Sources principales consultées : `packages/aor-drizzle/src/schema/`,
`applications/backend/src/application/`, `applications/frontend/src/lib/auth.ts`,
`docs/adr/`, `docs/avancement-*.md`.

### Recensement des PII

**Tables Drizzle concernées** (`packages/aor-drizzle/src/schema/`) :

- `participantsTable` : `first_name`, `last_name`, `email`, `organisation`,
  `direction`, `service`, `function_level`, `password_hash`.
- `questionnaireResponsesTable` : duplique `name`, `email` au moment de la
  soumission ; FK pairs (`subjectParticipantId`, `raterParticipantId`,
  `ratedParticipantId`).
- `inviteTokensTable` : `token`, `participantId`, `expiresAt`, `usedAt`, `isActive`.
- `coachesTable` : `username`, `password` (hash scrypt), `displayName`, `isActive`.

**Frontend** : JWT admin et participant stockés en `localStorage`
([`lib/auth.ts`](../applications/frontend/src/lib/auth.ts)). Aucune autre PII
en localStorage / sessionStorage.

### Synthèse des gaps

| ID | Gap | Article RGPD | Niveau | Priorité |
|---|---|---|---|---|
| **G1** | JWT en `localStorage` (vulnérable XSS) | 32 | HIGH | P1 |
| **G2** | Pas d'endpoint d'export « mes données » pour le participant | 15 / 20 | HIGH | P1 |
| **G3** | Pas de page Privacy Policy ni de mention RGPD pré-questionnaire | 13 / 14 / 7 | HIGH | P1 |
| **G4** | `DELETE /admin/participants/:id` non filtré par `coachId` | 32 | MEDIUM | P2 |
| **G5** | `GET /admin/participants/:id/matrix` et `GET /admin/responses/:id` non filtrés par `coachId` | 32 | MEDIUM | P2 |
| **G6** | Pas d'audit trail (who-changed-what) sur les modifications de PII | 5.1(f) | MEDIUM | P3 |
| **G7** | Pas de cron de purge des invite tokens expirés | 5.1.e | LOW | P3 |
| **G8** | Pas de rate limiting sur les endpoints login | 32 | MEDIUM | P2 |

### Conformité existante (bons points)

- ✅ **Hard-delete participant en cascade + anonymisation des FK** :
  `EraseParticipantRgpdUseCase` (`applications/backend/src/application/admin/participants/`)
  supprime scores → réponses → tokens → participant en transaction, et anonymise
  les FK transverses (réponses pair-feedback rédigées par/sur ce participant
  conservent les scores avec FK → NULL pour préserver l'intégrité statistique
  sans identification résiduelle).
- ✅ **Passwords hashés** : `ScryptPasswordAdapter`
  (`packages/aor-common/adapters/src/scrypt-password.adapter.ts`) avec paramètres
  `N=16384, r=8, p=1` (résistant GPU). Note : un mode `verifyPasswordOrPlaintextLegacy`
  existe — suggère la présence ponctuelle de mots de passe en clair en BDD, à
  vérifier et purger.
- ✅ **Filtrage `coachId` sur les listes** : appliqué sur `GET /admin/campaigns`,
  `/admin/participants`, `/admin/responses`, `/admin/companies`, `/admin/dashboard`
  (cf. [avancement-2026-04-28.md §1.b](avancement-2026-04-28.md)).
- ✅ **Invite tokens single-use et expirants** : entité `Invitation` priorise
  `used → deactivated → expired → active` (`invitation.entity.ts`).
- ✅ **Droit de rectification** : participant peut modifier `organisation`,
  `direction`, `service`, `function_level` via `PATCH /participant/me/profile` ;
  champs identité (`first_name`, `last_name`, `email`, `company_id`) verrouillés
  par le use case.
- ✅ **Pas de scripts tiers de tracking** (pas de Google Analytics, pixels, etc.).
  Seul tiers : Google Fonts pour la typo (à documenter dans une future Privacy
  Policy : transfert IP utilisateur lors du chargement des polices).

### Détail des gaps prioritaires

#### G1 — JWT en localStorage (HIGH, P1)

**Constat** : [`lib/auth.ts`](../applications/frontend/src/lib/auth.ts) stocke
`aor_admin_token` et `aor_participant_token` en `localStorage`. Lisibles par tout
script injecté (XSS), pas de flag `httpOnly` possible. Pas de Content Security
Policy déclarée dans [`index.html`](../applications/frontend/index.html).

**Pistes (à arbitrer) :**
- Migrer vers cookie `httpOnly + Secure + SameSite=Strict` (nécessite côté backend
  un endpoint de set-cookie sur login + adapter l'interceptor Axios).
- Ajouter une CSP stricte (au minimum `script-src 'self'`).

#### G2 — Pas d'export « mes données » participant (HIGH, P1)

**Constat** : aucun endpoint qui retourne en JSON l'ensemble des données d'un
participant (identité + métadonnées RH + historique réponses + scores + tokens).
`GET /participant/session` retourne uniquement le profil courant.

**Piste** : nouveau use case `ExportParticipantSelfDataUseCase` qui agrège les
4 sources dans un objet exportable. UI : bouton « Télécharger mes données » sur
[`routes/_participant/profile.tsx`](../applications/frontend/src/routes/_participant/profile.tsx).

#### G3 — Pas de Privacy Policy ni de mention RGPD pré-questionnaire (HIGH, P1)

**Constat** : aucune route `/privacy`, `/rgpd`, `/mentions`, `/cookies` dans
[`applications/frontend/src/routes/`](../applications/frontend/src/routes/).
La landing token (`routes/invite.$token.tsx`) ne présente pas non plus
d'information sur le traitement avant la collecte des réponses.

**Piste** : page statique `/privacy` + Alert RGPD sur la landing token avec
bouton « J'ai compris » avant accès au questionnaire (consentement explicite).

#### G4-G5 — Filtrages `coachId` manquants sur endpoints détail (MEDIUM, P2)

**Constat** :
- `DELETE /admin/participants/:id` n'applique pas le filtre `coachId` (les listes
  le font, donc un coach ne **voit** pas les IDs hors périmètre — mais peut
  potentiellement les **deviner** par incrémentation et les supprimer).
- `GET /admin/participants/:id/matrix` et `GET /admin/responses/:id` mêmes
  limitations (cf. [avancement-2026-04-28.md §6.2](avancement-2026-04-28.md)
  qui le mentionne déjà comme dette V1.5).

**Piste** : ajouter le filtrage par `coachId` dans les use cases `Erase…`,
`Get…ResponseDetail`, `Get…Matrix` (refus 403 si la ressource n'appartient pas
au périmètre du coach connecté).

#### G6 — Pas d'audit trail (MEDIUM, P3)

**Constat** : `participantsTable` a un `updated_at` mais pas de `updated_by`.
Aucune table `audit_events` / `access_logs`. Impossible de répondre à
« qui a consulté/modifié les données du participant X et quand ».

**Piste** : table `audit_events (id, actor_type, actor_id, action, resource_type,
resource_id, payload_json, created_at)` alimentée par un middleware NestJS sur
les endpoints sensibles.

#### G7 — Pas de cron de purge tokens expirés (LOW, P3)

**Constat** : aucune mention de `cron`, `schedule`, `purge` côté backend. Les
invite tokens expirés (`expiresAt < now`) restent indéfiniment en base.

**Piste** : job NestJS `@Cron('0 3 * * *')` qui exécute `DELETE FROM
invite_tokens WHERE expires_at < NOW() - INTERVAL '30 days'`.

#### G8 — Pas de rate limiting (MEDIUM, P2)

**Constat** : grep `throttle` / `rateLimit` / `RateLimitGuard` sans résultat.
Endpoints login admin et participant exposés à du brute-force.

**Piste** : `@nestjs/throttler` (compatible NestJS, déclaratif via décorateur
`@Throttle(5, 60)` sur les login).

### Étapes suggérées

1. **Décision métier** sur les 3 HIGH (G1/G2/G3) — impact UX (flow consentement)
   et architecture (cookies httpOnly).
2. **Sprint sécu V2** : G4/G5 (filtrages détail) + G8 (rate limiting) — chantiers
   bornés.
3. **Sprint conformité long terme** : G6 (audit trail) + G7 (cron purge).

---

## Bilan validation

```bash
pnpm --filter @aor/frontend-app typecheck   # ✅ 0 erreur
pnpm --filter @aor/frontend-app lint        # ✅ 0 erreur (Biome)
```

Tests non lancés (le user a explicitement écarté ce périmètre — les tests
significatifs sur les zones touchées avaient déjà été supprimés en commit
[`e0f571c`](https://github.com)).

UI **non testée en navigateur** dans cette session — le user pilotera la
vérification visuelle avant de committer.
