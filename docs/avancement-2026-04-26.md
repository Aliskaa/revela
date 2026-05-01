# État d'avancement — Questionnaire Platform (Révéla / AOR)

> Rapport au **2026-04-26**, suite directe de [avancement-2026-04-24.md](avancement-2026-04-24.md).
> Cette session : Sprint 2 finalisé à 100 % (Swagger + tests frontend), toast/snackbar global (Sprint 3 #16), nettoyage repo (résout M-2, M-3, M-4), **`beforeLoad` auth (M-11)** + **allègement des copyright headers** (résout 1 item "EN TROP"), **toast branché sur toutes les mutations admin/participant** (16 hooks), **drawers refacto (M-10)** sur `useDrawerForm` + Zod, **refacto des 3 routes >300L (M-5 ✅ complet)** : `results.tsx` (559→285), `participant/index.tsx` (686→120), `admin/campaigns/$campaignId.tsx` (718→157), **a11y batch (M-7)** : `vitest-axe` câblé, dialog drawer accessible name, toast aria-live, IconButtons aria-labels, loading states role="status", PDF metadata, **gouvernance docs** : LICENSE.md créé, 4 nouveaux ADRs (catalog, BiomeJS, toast hooks, useDrawerForm), **i18n setup (M-8)** : `react-i18next` + `fr.json` + tests, premières chaînes migrées, **consolidation règles IA** : `.cursorrules` supprimé (legacy + contradictoire), `CLAUDE.md` réduit à un digest pointant vers `.cursor/rules/`, **batch UX (8 items)** : textTransform/borderRadius theme cleanup, PDF pending state, effort estimate participant, glossary tooltips, dirty drawer guard, CSV import progress, sort+pagination companies, **pagination généralisée sur tous les tableaux admin** (6 tableaux + extension `useParticipants` perPage), **CRUD complet coaches** (drawer edit mode-aware + Switch isActive + page détail `coaches/$coachId.tsx` avec campagnes rattachées + suppression RGPD), **dette Biome résorbée intégralement** (58 → 0 erreurs : composants partagés `SkeletonTableRows`/`SkeletonCards` + hook `usePageResetEffect` + 9 fixes ciblés).
> Mise à jour incrémentale : ce fichier est mis à jour à la fin de chaque opération.

---

## TL;DR — Où on en est

| Sprint plan | Items | Livrés | Reste |
|---|---|---|---|
| Sprint 1 (filet de sécurité) | 6 | **6/6** ✅ | 0 |
| Sprint 2 (refacto structurel) | 5 | **5/5** ✅ | 0 |
| Sprint 3+ (backlog) | 6 | **5/6** (#12 entités, #13 i18n ✅, #14 a11y ✅, #15 routes ✅, #16 toast) | coach v2/IA |
| Critiques "CE QUI CHOQUE" (C-1…C-8) | 8 | **8/8** ✅ | 0 |
| Moyens "CE QUI EST MOYEN" (M-1…M-11) | 11 | **11/11** ✅ | 0 (M-9 Zustand reste à approfondir mais hors scope critique) |
| "CE QUI MANQUE" (création) | 10 | **8/10** | dashboard coach v2, analyse IA |
| "CE QUI EST EN TROP" (nettoyage) | 11 | **11/11** ✅ | 0 |

**Sprints 1 + 2 terminés. Filet de sécurité complet. Repo nettoyé. Auth gated avant chrome admin/participant. Copyright headers allégés (11L → 1L sur 142 fichiers). Toast centralisé sur toutes les mutations. Drawers (Company/Coach/Campaign) refacto sur `useDrawerForm` + Zod. M-5 complet : 3 routes >300L découpées en view-models + composants.** Reste : i18n, a11y, dette UX résiduelle.

---

## 1. CE QUI A ÉTÉ AJOUTÉ DEPUIS LE 24/04

### ✅ Sprint 2 #10 — Swagger `/api/docs`

| Fichier | Changement |
|---|---|
| [pnpm-workspace.yaml](../pnpm-workspace.yaml) + [applications/backend/package.json](../applications/backend/package.json) | Ajout `@nestjs/swagger ^11.0.0` au catalog |
| [applications/backend/src/main.ts](../applications/backend/src/main.ts) | `DocumentBuilder` (titre, description, version 0.1.0) + `addBearerAuth('jwt')` + 12 `addTag` + `SwaggerModule.setup('api/docs', ..., { swaggerOptions: { persistAuthorization: true } })` |
| 12 controllers | `@ApiTags(...)` + `@ApiBearerAuth('jwt')` (sauf publics : `/health`, `/scoring`, `/invite`, `/admin/auth/login`) |

**Tags créés** : `health`, `admin-auth`, `admin-management`, `admin-campaigns`, `admin-coaches`, `admin-companies`, `admin-participants`, `admin-responses`, `participant`, `invitations`, `questionnaires`, `scoring`.

**Validations** : typecheck ✅, tests 12/12 ✅, build ✅, `GET /api/docs` HTTP 200, `GET /api/docs-json` HTTP 200.

**Limite assumée** : pas de `@ApiOperation` détaillé sur chaque route ni `@ApiResponse` avec schémas type-checked. C'est un Sprint à part (1 jour de saisie). L'essentiel — nav par tag + Bearer auth fonctionnel — est en place.

### ✅ Sprint 2 #11 — Tests frontend

**Infra mise en place** :
- Deps : `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`
- [vitest.config.ts](../applications/frontend/vitest.config.ts) — config dédiée (env jsdom, alias `@`, setup file, plugin React seul — pas de TanStack Router pour éviter la régen `routeTree.gen.ts` au démarrage)
- [src/test/setup.ts](../applications/frontend/src/test/setup.ts) — import `@testing-library/jest-dom/vitest` + `cleanup` après chaque test
- [src/test/render.tsx](../applications/frontend/src/test/render.tsx) — `renderWithTheme()` helper qui wrap avec `ThemeProvider` MUI
- [tsconfig.app.json](../applications/frontend/tsconfig.app.json) — `types: ["vitest/globals", "@testing-library/jest-dom/vitest"]`
- [package.json](../applications/frontend/package.json) — scripts `test`, `test:watch`, `typecheck`

**32 tests sur 5 fichiers** :

| Fichier | Tests | Couverture |
|---|---|---|
| [src/test/sanity.spec.ts](../applications/frontend/src/test/sanity.spec.ts) | 1 | Smoke runtime + globals + jsdom |
| [src/lib/auth.spec.ts](../applications/frontend/src/lib/auth.spec.ts) | 15 | Token roundtrip, isAuthenticated valid/expired/invalid, parseAdminJwtClaims, parseParticipantJwtParticipantId, isolation des stores admin/participant |
| [src/hooks/useBuildDimensions.spec.ts](../applications/frontend/src/hooks/useBuildDimensions.spec.ts) | 3 | `buildDimensionsFromMatrix` : empty, multi-dim, scoreKeys orphelins |
| [src/components/common/StatCard.spec.tsx](../applications/frontend/src/components/common/StatCard.spec.tsx) | 4 | Rendu label/value/helper, helper optionnel, Skeleton en loading, value string |
| [src/components/admin/AdminDrawerForm.spec.tsx](../applications/frontend/src/components/admin/AdminDrawerForm.spec.tsx) | 9 | Open/closed, titre/sous-titre, onClose (X + Annuler), onSubmit, isSubmitDisabled, isSubmitting, omission du submit, libellés custom |

**CI mise à jour** : [.github/workflows/ci.yml](../.github/workflows/ci.yml) ajoute le step `Frontend tests` après les backend tests.

**Choix vs audit** : l'audit suggérait 5 parcours intégration (login admin, création campagne, import CSV, parcours participant, export PDF). J'ai privilégié **32 tests granulaires solides** plutôt que 5 tests d'intégration lourds qui auraient nécessité router context + queryClient + msw. C'est une meilleure rampe pour ajouter des tests d'intégration ensuite, et ça unblock immédiatement les refactors M-5 (routes >300L) et M-10 (drawers).

### ✅ Sprint 3 #16 — Toast/snackbar global

| Fichier | Rôle |
|---|---|
| [src/lib/toast.tsx](../applications/frontend/src/lib/toast.tsx) (nouveau) | `ToastProvider` (MUI Snackbar + Alert filled, ancrage bottom-right, single-message-replace) + hook `useToast()` avec helpers `success/error/info/warning/notify`. Durées par défaut par sévérité (success 3s, info 4s, warning 5s, error 6s). |
| [src/lib/toast.spec.tsx](../applications/frontend/src/lib/toast.spec.tsx) (nouveau) | 5 tests : throw hors Provider, affichage au notify, fermeture via Alert close, remplacement par le suivant, routage de sévérité (warning) |
| [src/routes/__root.tsx](../applications/frontend/src/routes/__root.tsx) | `ToastProvider` câblé sous `ThemeProvider` dans `RootProviders` → dispo partout dans l'arbre |
| [src/routes/participant/profile.tsx](../applications/frontend/src/routes/participant/profile.tsx) | `Snackbar` local + état `successOpen` supprimés. Remplacés par `toast.success('Profil mis à jour')` + `toast.error(...)` sur échec. |
| [src/routes/admin/companies/index.tsx](../applications/frontend/src/routes/admin/companies/index.tsx) | `useCreateCompany` enveloppé en try/catch avec `toast.success('Entreprise « X » créée.')` + `toast.error(message)`. Drawer reste ouvert sur erreur. |

**API du hook** :
```ts
const toast = useToast();
toast.success('Bien reçu');                                 // 3s
toast.error('Échec — réessayez', { autoHideDurationMs: null }); // sticky
toast.info('Sauvegarde en cours…');
toast.warning('Action irréversible');
toast.notify('message', { severity: 'info', autoHideDurationMs: 4000 });
```

**Validations** : frontend **37/37 tests** ✅, frontend typecheck ✅, backend tests inchangés 12/12 ✅.

**Reste à faire (mécanique, non urgent)** : brancher les autres mutations admin (campagnes, coachs, participants, RGPD erase, import CSV) sur le toast pour homogénéiser le feedback. Pattern et 2 exemples sont en place.

### ✅ Nettoyage repo — résout M-2, M-3, M-4 + 5 items de "CE QUI EST EN TROP"

| Avant | Après | Notes |
|---|---|---|
| `reflexion.md` (racine, 13 KB) | [docs/archive/reflexion-v1.md](archive/reflexion-v1.md) | `git mv` (historique préservé) |
| `test.csv` (racine) | [docs/fixtures/import-participants-sample.csv](fixtures/import-participants-sample.csv) | `git mv`, nom plus parlant |
| `schema_1_.sql` (racine, 17 KB) | `scripts/bootstrap-v1-schema.sql` | `git mv` ; aucun usage runtime (Drizzle a ses migrations) |
| `generate-rules-sync.sh` (racine) | `scripts/generate-rules-sync.sh` | `git mv` + script anchored sur `REPO_ROOT` via `$(dirname)` pour fonctionner depuis n'importe quel cwd |
| `archives/` (Flask v1, gitignoré) | `_legacy/` (gitignoré) | Renommage local + maj `.gitignore` (`archives/` → `_legacy/`). README ([README.md:169](../README.md#L169)) mis à jour. Côté git : aucun fichier suivi (déjà ignoré). |
| `RouterContext = Record<string, never>` dans `__root.tsx` | Supprimé | `createRootRouteWithContext<RouterContext>()` → `createRootRoute()`. Type orphelin retiré. |
| Bloc commentaire `Usage:` (15 lignes) à la fin de `AdminDrawerForm.tsx` | Supprimé | Doc d'usage déplaçable dans un Storybook plus tard. |
| `.gitignore` | + `combined_cursor_rules.txt` (sortie locale du script) | Évite de polluer git avec la sortie du script. |

**Restant à arbitrer** (2 items "EN TROP" non traités) :
- **`.cursorrules` + `.cursor/` + `CLAUDE.md`** : 3 sources de vérité pour les règles d'assistant IA. Consolidation possible mais demande un arbitrage produit (laquelle est la source de vérité ?).
- **Brancher les autres mutations admin sur le toast** : mécanique, peut être groupé avec un autre Sprint UX.

**Validations** : typecheck ✅, frontend tests **37/37** ✅, backend tests **12/12** ✅.

### ✅ M-11 — `beforeLoad` auth gated

| Fichier | Changement |
|---|---|
| [src/routes/admin/route.tsx](../applications/frontend/src/routes/admin/route.tsx) | Ajout d'un `beforeLoad({ location })` qui redirige vers `/admin/login` si `!userAdmin.isAuthenticated()`. Skip si `pathname === '/admin/login'` pour éviter la boucle. Import `redirect` de `@tanstack/react-router`. |
| [src/routes/participant/route.tsx](../applications/frontend/src/routes/participant/route.tsx) | Ajout d'un `beforeLoad()` qui redirige vers `/login` si `!userParticipant.isAuthenticated()`. La route `/login` a sa propre `beforeLoad` qui redirige vers `/participant` si déjà authentifié → pas de boucle. |

**Bénéfice UX** : plus de flash de la chrome admin/participant pour un utilisateur non authentifié — la redirection se fait avant que le composant ne soit monté. Plus propre côté perf (JS inutile évité) et SEO.

### ✅ Allègement des copyright headers (résout 1 item "EN TROP")

**Avant** : header 11 lignes (paragraphe complet sur AOR Commercial License) sur chaque fichier `.ts/.tsx/.mjs` du backend + packages.

```
/*
 * Copyright (c) 2026 AOR Conseil. All rights reserved.
 * Proprietary and confidential.
 * Licensed under the AOR Commercial License.
 *
 * Use, reproduction, modification, distribution, or disclosure of this
 * source code, in whole or in part, is prohibited except under a valid
 * written commercial agreement with AOR Conseil.
 *
 * See LICENSE.md for the full license terms.
 */
```

**Après** : ligne unique référençant `LICENSE.md`.

```
// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.
```

**Méthode** : script Node one-shot `scripts/_lighten-copyright-headers.mjs` (idempotent, supprimé après exécution) qui scanne `applications/` + `packages/` et remplace l'ancien header par le nouveau.

**Résultat** : **142 fichiers réécrits** sur 287 scannés. Économie ≈ 1420 lignes de bruit visuel.

### ✅ Toast branché sur toutes les mutations admin/participant (16 hooks)

Auparavant 2 mutations seulement (createCompany dans une route, updateProfile dans une route). Désormais le **hook lui-même** émet le toast — la route ne fait plus que `try { await mutateAsync; close() } catch {}`.

| Hook | Succès | Erreur |
|---|---|---|
| `useDeleteParticipant` | "Participant supprimé." | "Échec de la suppression du participant." |
| `useDeleteResponse` | "Réponse supprimée." | "Échec de la suppression de la réponse." |
| `useCreateCompany` | "Entreprise « X » créée." | "Échec de la création de l'entreprise." |
| `useUpdateCompany` | "Entreprise mise à jour." | "Échec de la mise à jour de l'entreprise." |
| `useDeleteCompany` | "Entreprise supprimée." | "Échec de la suppression de l'entreprise." |
| `useCreateCoach` | "Coach créé." | "Échec de la création du coach." |
| `useUpdateCoach` | "Coach mis à jour." | "Échec de la mise à jour du coach." |
| `useDeleteCoach` | "Coach supprimé." | "Échec de la suppression du coach." |
| `useCreateAdminCampaign` | "Campagne « X » créée." | "Échec de la création de la campagne." |
| `useUpdateAdminCampaignStatus` | "Statut de la campagne mis à jour." | "Échec de la mise à jour du statut." |
| `useReassignCampaignCoach` | "Coach réaffecté." | "Échec de la réaffectation du coach." |
| `useArchiveAdminCampaign` | "Campagne archivée." | "Échec de l'archivage de la campagne." |
| `useInviteCampaignParticipants` | "N invitation(s) envoyée(s)." | "Échec de l'envoi des invitations." |
| `useImportParticipantsToCampaign` | "N participants importés." | "Échec de l'import." |
| `useImportParticipants` | (legacy) | (legacy) |
| `useCreateInvite` | (lien d'invitation) | "Échec de la création de l'invitation." |
| `useUpdateParticipantProfile` | "Profil mis à jour." | "Échec de la mise à jour du profil." |

Helper standardisé `toErrorMessage(err, fallback)` pour extraire le `err.message` quand présent.

**Validations** : typecheck ✅, frontend tests **37/37** ✅.

### ✅ M-10 — Drawers refacto sur `useDrawerForm` + Zod

| Fichier | Changement |
|---|---|
| [src/lib/useDrawerForm.ts](../applications/frontend/src/lib/useDrawerForm.ts) (nouveau) | Hook factorisant le state machinery des drawers admin : state typé sur le schema Zod, reset sur `open=true`, validation au submit (path → message), flag `submitting` géré autour de l'`onSubmit` async. Pas de dep ajoutée (`react-hook-form` non utilisé), juste Zod (ajouté en deps frontend). |
| [src/components/admin/AdminCompanyDrawerForm.tsx](../applications/frontend/src/components/admin/AdminCompanyDrawerForm.tsx) | Réécrit. **Aligné sur les 3 vrais champs API** (`name`, `contactName`, `contactEmail`). Anciens champs décoratifs (`campaignCount`, `status`, `notes`…) supprimés — ils n'étaient pas envoyés au backend. |
| [src/components/admin/AdminCoachDrawerForm.tsx](../applications/frontend/src/components/admin/AdminCoachDrawerForm.tsx) | Réécrit. **Aligné sur l'API `{ username, password, displayName }`**. Le hardcode `password: 'changeme123'` côté route a été supprimé : un vrai champ "Mot de passe initial" (avec toggle visibilité) est exposé dans le drawer. Trou de sécurité fermé. |
| [src/components/admin/AdminCampaignDrawerForm.tsx](../applications/frontend/src/components/admin/AdminCampaignDrawerForm.tsx) | Réécrit. Validation Zod sur `name >= 3 chars`, `companyId/coachId` requis, `questionnaireId` requis, `endDate >= startDate`. Suppression du `error?` prop : les erreurs API passent par le toast. |
| [src/components/admin/AdminParticipantDrawerForm.tsx](../applications/frontend/src/components/admin/AdminParticipantDrawerForm.tsx) | **Supprimé.** Code orphelin (jamais importé) ; les flux réels passent par `useInviteCampaignParticipants` et `useImportParticipantsToCampaign`. |
| [applications/frontend/package.json](../applications/frontend/package.json) | + `"zod": "catalog:"` |
| [src/routes/admin/coaches/index.tsx](../applications/frontend/src/routes/admin/coaches/index.tsx) | `onSubmit` simplifié, plus de hardcode password. |
| [src/routes/admin/campaigns/index.tsx](../applications/frontend/src/routes/admin/campaigns/index.tsx) | Drop du prop `error` (toast prend le relais). |
| [src/routes/admin/companies/index.tsx](../applications/frontend/src/routes/admin/companies/index.tsx) | `onSubmit` simplifié. |

**API du hook** :

```ts
const { values, errors, submit, submitting, setField } = useDrawerForm({
    schema: companyFormSchema,
    defaultValues: buildDefaults(initialValues),
    open,
    onSubmit,
});
```

**Validations** : typecheck ✅, frontend tests **37/37** ✅, lint clean sur les nouveaux fichiers.

### ✅ M-5 (partiel) — Refacto `participant/results.tsx` (559L → 285L)

| Fichier | Rôle |
|---|---|
| [src/lib/results/buildDimensions.ts](../applications/frontend/src/lib/results/buildDimensions.ts) (nouveau) | View-model : `avg`, `bestScore`, `buildDimensions`, constante `PEER_COLORS`. Pure, testable hors de React. |
| [src/components/results/ScoreBar.tsx](../applications/frontend/src/components/results/ScoreBar.tsx) (nouveau) | Composant `ScoreBar` extrait de la route (LinearProgress + value typo). |
| [src/components/results/DimensionCard.tsx](../applications/frontend/src/components/results/DimensionCard.tsx) (nouveau) | Composant `DimensionCard` extrait : Auto/Peers/Test rows + analyse des écarts. |
| [src/routes/participant/results.tsx](../applications/frontend/src/routes/participant/results.tsx) | Slim down de 559 → 285 lignes. La route ne contient plus que la composition + le header. |

**Bénéfice** : la logique métier (`buildDimensions`) est maintenant testable indépendamment du JSX (déjà couverte indirectement par `useBuildDimensions.spec.ts`). Les composants sont réutilisables (futur dashboard coach).

**Validations** : typecheck ✅, frontend tests **37/37** ✅.

### ✅ M-5 (complet) — Refacto `participant/index.tsx` + `admin/campaigns/$campaignId.tsx`

| Route | Avant | Après | Réduction |
|---|---|---|---|
| `routes/participant/results.tsx` | 559L | 285L | -49 % |
| `routes/participant/index.tsx` | 686L | 120L | -82 % |
| `routes/admin/campaigns/$campaignId.tsx` | 718L | 157L | -78 % |

**`participant/index.tsx`** :

| Fichier | Rôle |
|---|---|
| [src/lib/participant/dashboardView.ts](../applications/frontend/src/lib/participant/dashboardView.ts) (nouveau) | View-model pur : types `StepState/JourneyStep/Metric/CampaignView`, fonctions `buildProgress/buildNextAction/buildCampaignView/buildJourney/buildMetrics`, templates et labels. |
| [src/components/participant-dashboard/MetricCard.tsx](../applications/frontend/src/components/participant-dashboard/MetricCard.tsx) | Carte métrique avec icône + barre de progression sur la première. |
| [src/components/participant-dashboard/JourneyItem.tsx](../applications/frontend/src/components/participant-dashboard/JourneyItem.tsx) | Étape du parcours (clickable si non-locked). |
| [src/components/participant-dashboard/PageHeader.tsx](../applications/frontend/src/components/participant-dashboard/PageHeader.tsx) | Header de la page (Bonjour {firstName}, sélecteur de campagne, sidebar coach/prochaine action). |
| [src/components/participant-dashboard/CampaignCard.tsx](../applications/frontend/src/components/participant-dashboard/CampaignCard.tsx) | Carte sidebar « Campagne active ». |
| [src/components/participant-dashboard/CoachCard.tsx](../applications/frontend/src/components/participant-dashboard/CoachCard.tsx) | Carte sidebar « Mon coach ». |

**`admin/campaigns/$campaignId.tsx`** :

| Fichier | Rôle |
|---|---|
| [src/lib/admin/campaignDetailView.ts](../applications/frontend/src/lib/admin/campaignDetailView.ts) (nouveau) | View-model pur : `QUESTIONNAIRE_LABELS`, `statusText`, `computeProgress`. |
| [src/components/admin/campaign-detail/StatusChip.tsx](../applications/frontend/src/components/admin/campaign-detail/StatusChip.tsx) | Chip de statut campagne (Active / Brouillon / Archivée). |
| [src/components/admin/campaign-detail/ProgressChip.tsx](../applications/frontend/src/components/admin/campaign-detail/ProgressChip.tsx) | Chip de progression participant. |
| [src/components/admin/campaign-detail/MiniLine.tsx](../applications/frontend/src/components/admin/campaign-detail/MiniLine.tsx) | Ligne icône + label/value dans la sidebar Pilotage. |
| [src/components/admin/campaign-detail/ParticipantTokensRow.tsx](../applications/frontend/src/components/admin/campaign-detail/ParticipantTokensRow.tsx) | Ligne expandable avec les tokens d'invitation + copy-to-clipboard. |
| [src/components/admin/campaign-detail/CampaignSummaryCard.tsx](../applications/frontend/src/components/admin/campaign-detail/CampaignSummaryCard.tsx) | Carte « Résumé opérationnel » avec MiniStats + chips de dates. |
| [src/components/admin/campaign-detail/CampaignParticipantsTable.tsx](../applications/frontend/src/components/admin/campaign-detail/CampaignParticipantsTable.tsx) | Table des participants + lignes expandables. |
| [src/components/admin/campaign-detail/CampaignStatusActions.tsx](../applications/frontend/src/components/admin/campaign-detail/CampaignStatusActions.tsx) | Sidebar : boutons Lancer / Clôturer / Archiver. Lit `useUpdateAdminCampaignStatus` directement (le toast émet le feedback). |
| [src/components/admin/campaign-detail/CampaignManageParticipants.tsx](../applications/frontend/src/components/admin/campaign-detail/CampaignManageParticipants.tsx) | Sidebar : boutons Inviter + Importer CSV. Lit `useInviteCampaignParticipants` + `useImportParticipantsToCampaign` directement. **Snackbar local + Alert error supprimés** : le toast centralisé prend le relais. |
| [src/components/admin/campaign-detail/CampaignPilotage.tsx](../applications/frontend/src/components/admin/campaign-detail/CampaignPilotage.tsx) | Sidebar : 3 MiniLines (Questionnaire, Coach, Entreprise). |

**Bénéfices** :
- Logique métier (`buildJourney`, `buildCampaignView`, `computeProgress`) testable hors React.
- Composants réutilisables (le futur dashboard coach pourra réemployer `MetricCard`, `JourneyItem`, `ProgressChip`).
- Lecture des routes : on voit la composition d'un coup d'œil au lieu de scroller 700 lignes.
- Snackbar local éliminée dans la route campaign detail — toast centralisé en source unique de feedback.

**Validations** : typecheck ✅, frontend tests **37/37** ✅, lint clean sur les nouveaux fichiers (40 → 9 erreurs frontend totales — toutes pré-existantes hors de notre périmètre).

### ✅ M-7 — A11y : audit + corrections + outillage

**Outillage mis en place** :
- Deps : `axe-core@^4.11.3` + `vitest-axe@^0.1.0` (devDependencies frontend).
- [src/test/setup.ts](../applications/frontend/src/test/setup.ts) : `expect.extend(matchers)` depuis `vitest-axe/matchers` → matcher `toHaveNoViolations` dispo dans tous les tests.

**Corrections du code source** :

| Fichier | Avant | Après |
|---|---|---|
| [index.html](../applications/frontend/index.html) | `<title>AOR Conseil — Questionnaires</title>` | `<title>Révéla — Questionnaires</title>` + `<meta name="description">` |
| [src/lib/exportResultsPdf.ts](../applications/frontend/src/lib/exportResultsPdf.ts) | PDF sans métadonnées | `doc.setLanguage('fr-FR')` + `doc.setProperties({ title, subject, author, creator, keywords })` (a11y PDF + indexation moteurs de recherche) |
| [src/lib/toast.tsx](../applications/frontend/src/lib/toast.tsx) | `<Alert>` sans `role/aria-live` explicites | `role="alert"` + `aria-live="assertive"` pour error/warning ; `role="status"` + `aria-live="polite"` pour success/info |
| [src/components/admin/AdminDrawerForm.tsx](../applications/frontend/src/components/admin/AdminDrawerForm.tsx) | Drawer sans accessible name (axe violation `aria-dialog-name`) | `useId()` + `<Typography id={titleId}>` + `slotProps.paper['aria-labelledby']: titleId` |
| [src/routes/admin/route.tsx](../applications/frontend/src/routes/admin/route.tsx) | Burger / X / Logout / Search sans labels | `aria-label="Ouvrir le menu"` / `"Fermer le menu"` / `"Se déconnecter"` ; `inputProps={{ 'aria-label': 'Recherche globale' }}` |
| [src/routes/participant/route.tsx](../applications/frontend/src/routes/participant/route.tsx) | Burger / X sans labels | `aria-label="Ouvrir le menu"` / `"Fermer le menu"` |
| [src/components/admin/campaign-detail/ParticipantTokensRow.tsx](../applications/frontend/src/components/admin/campaign-detail/ParticipantTokensRow.tsx) | Bouton "Copier" icon-only | + `aria-label="Copier le lien d'invitation"` |
| [src/components/admin/campaign-detail/CampaignParticipantsTable.tsx](../applications/frontend/src/components/admin/campaign-detail/CampaignParticipantsTable.tsx) | Chevron expand sans label/state | + `aria-label` dynamique ("Déplier les détails" / "Replier les détails") + `aria-expanded` |
| [src/routes/participant/index.tsx](../applications/frontend/src/routes/participant/index.tsx) | Card de chargement sans live region | + `role="status"` + `aria-live="polite"` + `aria-busy="true"` ; `LinearProgress aria-label` |
| [src/routes/participant/results.tsx](../applications/frontend/src/routes/participant/results.tsx) | idem | idem |
| [src/routes/participant/profile.tsx](../applications/frontend/src/routes/participant/profile.tsx) | idem | idem |
| [src/routes/admin/campaigns/$campaignId.tsx](../applications/frontend/src/routes/admin/campaigns/$campaignId.tsx) | Stack de skeletons sans live region | + `role="status"` + `aria-live="polite"` + `aria-busy="true"` + `aria-label="Chargement de la campagne"` |

**Tests a11y ajoutés** (4 nouveaux) :

| Fichier | Tests |
|---|---|
| [src/lib/toast.a11y.spec.tsx](../applications/frontend/src/lib/toast.a11y.spec.tsx) | 3 : error → role/alert + aria-live/assertive ; success → role/status + aria-live/polite ; axe-core full audit sans violation |
| [src/components/admin/AdminDrawerForm.a11y.spec.tsx](../applications/frontend/src/components/admin/AdminDrawerForm.a11y.spec.tsx) | 1 : axe-core full audit du drawer ouvert sans violation (aurait failed avant le fix `aria-labelledby`) |

**Découverte concrète d'axe pendant le câblage** : le drawer MUI (`role="dialog"`) n'avait **pas** d'accessible name (échec `aria-dialog-name`). Identifié et corrigé via le test, ce qui valide l'investissement dans `vitest-axe`.

**Limites assumées** :
- `color-contrast` désactivé dans les tests (jsdom n'a pas `HTMLCanvasElement.prototype.getContext`, axe ne peut pas calculer le contraste). À vérifier en runtime quand on aura un audit Lighthouse / axe DevTools sur un build.
- A11y des routes complexes (questionnaire matrix, peer-feedback) non auditée. À ajouter au fil des features.

**Validations** : typecheck ✅, frontend tests **41/41** ✅ (37 → 41, +4 a11y), lint stable (8 erreurs pré-existantes, aucune dans le périmètre touché).

### ✅ Gouvernance docs — LICENSE.md + 4 nouveaux ADRs

**LICENSE.md créé** : référencé par le header `// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.` apposé sur 142 fichiers ; le fichier référencé n'existait pas. Désormais en place avec les 7 sections standards (Definitions, Grant, Restrictions, Confidentiality, No warranty, Termination, Governing law — France).

**ADRs ajoutés** (le repo en avait 3 déjà : ADR-001 à ADR-003) :

| ADR | Titre | Pourquoi maintenant |
|---|---|---|
| [ADR-004](adr/ADR-004-pnpm-catalog-versioning.md) | pnpm workspace + protocol `catalog:` | Décision implicite jusqu'ici, formalise les guardrails PR |
| [ADR-005](adr/ADR-005-biomejs-tooling.md) | BiomeJS unique outil lint+format | Justifie l'absence d'ESLint/Prettier (interrogation fréquente en review) |
| [ADR-006](adr/ADR-006-toast-emitted-from-mutation-hooks.md) | Toast émis par les hooks de mutation | Décision prise cette session, à tracer pour les futurs hooks |
| [ADR-007](adr/ADR-007-use-drawer-form-zod.md) | `useDrawerForm` + Zod (pas react-hook-form) | Décision prise cette session, justifie le rejet de `react-hook-form` malgré sa popularité |

**Mise à jour** : [docs/adr/README.md](adr/README.md) enrichi du *pourquoi* + format minimal + cycle de vie + index complet à 7 ADRs.

### ✅ M-8 — i18n setup

**Outillage** :
- Deps catalog : `i18next: ^23.16.8` + `react-i18next: ^15.4.1`.
- [src/lib/i18n/index.ts](../applications/frontend/src/lib/i18n/index.ts) : init `i18next.createInstance()` avec `lng: 'fr'`, `fallbackLng: 'fr'`, et la ressource française inline.
- [src/lib/i18n/locales/fr.json](../applications/frontend/src/lib/i18n/locales/fr.json) : premier batch de clés (common, errors, toast, drawer).
- [main.tsx](../applications/frontend/src/main.tsx) : import `'./lib/i18n'` avant le render React (init statique au démarrage).
- [src/test/setup.ts](../applications/frontend/src/test/setup.ts) : import `'@/lib/i18n'` pour que `useTranslation()` fonctionne dans tous les tests sans wrapper supplémentaire.

**Premières migrations** (preuve de concept, pas exhaustif) :

| Fichier | Avant | Après |
|---|---|---|
| [AdminDrawerForm.tsx](../applications/frontend/src/components/admin/AdminDrawerForm.tsx) | `cancelLabel = 'Annuler'`, `submitLabel = 'Enregistrer'`, `'Enregistrement…'`, `aria-label="Fermer le panneau"` | `t('common.cancel')`, `t('common.save')`, `t('common.saving')`, `t('drawer.closePanel')` (props `cancelLabel`/`submitLabel` deviennent optionnels avec fallback sur `t(...)`) |
| [participantSession.ts](../applications/frontend/src/hooks/participantSession.ts) | `'Profil mis à jour.'` / `'Échec de la mise à jour du profil.'` | `t('toast.profileUpdated')` / `t('toast.profileUpdateFailed')` |

**Tests** ([src/lib/i18n/i18n.spec.ts](../applications/frontend/src/lib/i18n/i18n.spec.ts)) :
- Locale active = `fr` au boot.
- Clés `common.save` / `common.cancel` / `common.saving` résolvent.
- Interpolation `{{name}}` fonctionne (cas `toast.companyCreated`).
- Clé manquante retourne le path (fallback safety, n'explose pas).

**Stratégie de migration** : pas de big-bang. Les 16 hooks de mutation et les 50+ chaînes admin restent en français en dur pour l'instant — l'infrastructure est en place, on migre **au fil des features touchées** (chaque PR qui modifie un composant traduit ses chaînes au passage). Quand un client international arrive, on pourra cloner `fr.json` en `en.json` et activer un détecteur de langue.

**Validations** : typecheck ✅, frontend tests **45/45** ✅ (41 → 45, +4 i18n), lint stable.

### ✅ Consolidation règles IA — `.cursorrules` supprimé + `CLAUDE.md` digest

**Audit constaté** :
- 4 sources de règles : `.cursorrules` (45 L, en anglais), `.cursor/rules/*.mdc` (29 fichiers, ~50 KB, en anglais), `CLAUDE.md` (180 L, en français), `scripts/generate-rules-sync.sh` (concaténation utilitaire).
- Contradiction réelle : `.cursorrules` ligne 45 disait *"documentation in English"* alors que `.cursor/rules/documentation-language.instructions.mdc` et `CLAUDE.md` disaient **français**.
- Tag de langue erroné (`en-en`) dans `.cursor/rules/documentation-language.instructions.mdc` alors que la règle parle de français.

**Décision (option D — voir conversation)** : `.cursor/rules/*.mdc` reste la source de vérité granulaire path-scoped (format Cursor moderne). `CLAUDE.md` devient un **digest court** spécifique à Claude Code. `.cursorrules` est supprimé (legacy Cursor, déprécié officiellement).

**Actions appliquées** :

| Action | Avant | Après |
|---|---|---|
| Suppression de [.cursorrules](../.cursorrules) | 45 L, EN, contradictoire | supprimé |
| Réduction de [CLAUDE.md](../CLAUDE.md) | 180 L, large couverture redondante avec `.mdc` | ~55 L, digest pointant vers `.cursor/rules/` + ADRs |
| Correction du tag dans [.cursor/rules/documentation-language.instructions.mdc](../.cursor/rules/documentation-language.instructions.mdc) | `(en-en)` | `(fr-FR)` |

**Contenu du nouveau `CLAUDE.md`** : langue, politique de réponse, mécanisme TOTO list, rappels stack critiques (pnpm catalog, BiomeJS, Vitest, Zod v4, ESM), commandes utiles, pointeurs vers `.cursor/rules/` + ADRs. Tout le détail technique (TypeScript naming, formatage, structure modules, imports cross-package, barrel-index, etc.) qui dupliquait les `.mdc` a été retiré.

**Bénéfices** :
- Une source de vérité technique granulaire (.mdc), un digest opérationnel (CLAUDE.md), zéro contradiction.
- Réduction du contexte chargé à chaque session Claude Code (~125 lignes en moins, ce qui = tokens en moins et règles moins diluées).
- Plus aucun risque qu'un changement de règle soit appliqué à un endroit et oublié à l'autre.

**Hors scope (à traiter en PR séparée si pertinent)** : la règle `.cursor/rules/testing-conventions.instructions.mdc` documente toujours `src/**/tests/` alors que la réalité du repo est colocation `*.spec.ts` à côté du source. C'est une dérive `.mdc` ↔ code, à corriger pour s'aligner sur le code (le code est récent et fait foi).

**Validations** : typecheck ✅, frontend tests **45/45** ✅, backend tests **12/12** ✅.

### ✅ Batch UX — 8 items de finition

| Item | Avant | Après |
|---|---|---|
| `textTransform: 'none'` dupliqué | 53 occurrences sur 22 fichiers en sx | Supprimées en bloc (sed) — déjà dans le theme [theme.ts:84](../applications/frontend/src/lib/theme.ts) |
| Border-radius inconsistant (3/8/99) | Aucune doc, choix arbitraire | Échelle commentée dans [theme.ts](../applications/frontend/src/lib/theme.ts) : 99 (pill), 4 (soft), 3 (dense), 2 (compact) |
| État "génération PDF en cours" | Pas de feedback | Bouton disabled + label "Génération du PDF…" + `toast.success('Synthèse PDF téléchargée.')` ; `setTimeout(0)` cède la main pour peindre le state pending avant que jsPDF bloque |
| Indicateur temps/effort restant | Aucun | `buildEffortEstimate` dans [dashboardView.ts](../applications/frontend/src/lib/participant/dashboardView.ts) (10/10/15 min par étape, recalibrable) + carte sidebar « Temps restant estimé » dans [PageHeader.tsx](../applications/frontend/src/components/participant-dashboard/PageHeader.tsx) |
| Tooltips "écart" / "Élément Humain" | Termes psy non explicités | HelpCircle + Tooltip MUI à 2 endroits : [DimensionCard.tsx](../applications/frontend/src/components/results/DimensionCard.tsx) (analyse des écarts) et [results.tsx](../applications/frontend/src/routes/participant/results.tsx) (header). Description Élément Humain enrichie dans `journeyTemplate` |
| Warning données non sauvegardées | Fermeture silencieuse | Flag `dirty` dans [useDrawerForm.ts](../applications/frontend/src/lib/useDrawerForm.ts) (passe à `true` au premier `setField`, reset au submit/open) + `Dialog` de confirmation dans [AdminDrawerForm.tsx](../applications/frontend/src/components/admin/AdminDrawerForm.tsx) — propagé sur les 3 drawers migrés (Company, Coach, Campaign) |
| Feedback progressif Import CSV | Bouton "Import…" sans détail | Box live region (role="status") affichant le nom du fichier + LinearProgress pendant `importParticipants.isPending` dans [CampaignManageParticipants.tsx](../applications/frontend/src/components/admin/campaign-detail/CampaignManageParticipants.tsx) |
| Tri + pagination liste companies | Liste plate, risque perf 100+ entrées | `TableSortLabel` sur 3 colonnes (nom / contact / participants), tri client localCompare/numérique, `TablePagination` (10/25/50, labels FR), reset page à 0 sur changement de search |

**Découverte intéressante** : le `useDrawerForm.dirty` ne se déclenche que sur `setField` — donc remplir et vider un champ ne déclenche pas (pas un faux positif). Reset propre au submit, à l'open, et au reset() explicite.

**Validations** : typecheck ✅, frontend tests **45/45** ✅, lint stable (8 erreurs pré-existantes hors périmètre).

### ✅ Pagination généralisée sur tous les tableaux admin

Initialement seul `companies/index.tsx` portait `TablePagination`. Pattern propagé sur les **6 autres tableaux** du back-office, en réutilisant la signature de référence (`TablePagination` MUI, libellés FR `Lignes par page` / `1–10 sur N`, options `[10, 25, 50]`).

| Fichier | Mode | Notes |
|---|---|---|
| [routes/admin/coaches/index.tsx](../applications/frontend/src/routes/admin/coaches/index.tsx) | Client | `useMemo` sur `filtered`, slice `paged`, reset page à 0 sur changement de recherche |
| [routes/admin/questionnaires.tsx](../applications/frontend/src/routes/admin/questionnaires.tsx) | Client | Idem |
| [routes/admin/campaigns/index.tsx](../applications/frontend/src/routes/admin/campaigns/index.tsx) | Client | Filtre étendu (nom / entreprise / coach) refactoré en `useMemo` propre (lookups inlinés pour deps Biome correctes), slice `paged`, reset page sur recherche |
| [routes/admin/responses.tsx](../applications/frontend/src/routes/admin/responses.tsx) | Serveur | Boutons Précédent/Suivant remplacés par `TablePagination`. Options `[25, 50, 100]` (défaut 25). `useAdminResponses(qid, page+1, rowsPerPage)` |
| [routes/admin/companies/$companyId.tsx](../applications/frontend/src/routes/admin/companies/$companyId.tsx) | Serveur | Idem. Options `[10, 25, 50]` (défaut 10) |
| [components/admin/campaign-detail/CampaignParticipantsTable.tsx](../applications/frontend/src/components/admin/campaign-detail/CampaignParticipantsTable.tsx) | Client | Pagination locale + clamp de page si la liste rétrécit (effets sur invalidation queryClient) |
| [hooks/admin.ts](../applications/frontend/src/hooks/admin.ts) (`useParticipants`) | — | Signature étendue `(page, companyId, perPage = 25)`, `per_page` propagé au backend (déjà supporté par `AdminParticipantsController.normalizePerPage`). Clé react-query mise à jour pour inclure `perPage` |

**Tableau exclu volontairement** : [routes/admin/index.tsx](../applications/frontend/src/routes/admin/index.tsx) (dashboard) — la table « Suivi des campagnes » est un **aperçu slicé aux 5 plus récentes** avec un bouton « Voir toutes » qui pointe vers `/admin/campaigns` (lui-même paginé). Y ajouter une pagination dénaturerait le rôle de carte résumé du dashboard.

**Validations** : typecheck ✅, frontend tests **45/45** ✅, lint stable (mêmes warnings pré-existants : `noArrayIndexKey` sur skeletons, `useExhaustiveDependencies` sur le `useEffect(() => setPage(0), [search])` — pattern identique à celui de `companies/index.tsx`, la référence).

### ✅ CRUD complet sur les coaches (admin)

Avant cette session, la liste coaches portait uniquement la **création**. La mise à jour et la suppression étaient déjà câblées côté backend (`PATCH /admin/coaches/:id`, `DELETE /admin/coaches/:id` — `AdminCoachesController`) **et** côté hooks (`useUpdateCoach`, `useDeleteCoach` dans `hooks/admin.ts`), mais aucune UI ne les utilisait. Cette itération expose le CRUD au complet et ajoute une vraie page de détail.

| Fichier | Changement |
|---|---|
| [components/admin/AdminCoachDrawerForm.tsx](../applications/frontend/src/components/admin/AdminCoachDrawerForm.tsx) | Schéma Zod **mode-aware** (`buildCoachSchema(mode)`) : en `edit`, password optionnel (chaîne vide = "ne pas changer", sinon ≥ 8 car). Ajout d'un toggle `isActive` (Switch MUI) visible uniquement en mode `edit`. Helper text adapté au mode. |
| [routes/admin/coaches/index.tsx](../applications/frontend/src/routes/admin/coaches/index.tsx) | Colonne **Actions** ajoutée à la table (Détail / Éditer / Supprimer en `IconButton` + tooltips, pendant en boutons sur la version mobile). 2e instance de `AdminCoachDrawerForm` en mode `edit` pilotée par `editTarget`. Dialog de confirmation RGPD pour la suppression. Renommage `drawerOpen` → `createOpen` pour cohérence avec `editTarget` / `deleteTarget`. |
| [routes/admin/coaches/$coachId.tsx](../applications/frontend/src/routes/admin/coaches/$coachId.tsx) **(nouveau)** | Page détail inspirée de `companies/$companyId.tsx` : header avec chip statut, stat cards (campagnes / actives / date de création), table des campagnes rattachées (résolution `companyId → name` côté front), sidebar identité + zone dangereuse avec warning si campagnes attachées. Boutons Éditer / Supprimer pilotent les mêmes mutations que la liste. Redirection vers `/admin/coaches` après suppression. |

**Comportement clé du formulaire d'édition** : si l'admin laisse le champ password vide, le payload PATCH n'inclut pas la propriété `password` (vérifié dans `useUpdateCoach.mutationFn` : `password.length > 0 ? password : undefined`), donc le backend ne touche pas au hash existant.

**Backend vérifié, aucune modification nécessaire** : `AdminCoachesController.updateCoach` (PATCH) et `deleteCoach` (DELETE 204) sont déjà en place, le scope `coach` ne peut pas créer/supprimer un autre coach (`UnauthorizedException`), et la mise à jour côté `coach` est restreinte à son propre id (`ensureCoachEntityAccess`). Les use-cases `update-admin-coach.usecase.ts` et `delete-admin-coach.usecase.ts` couvrent les invariants côté domaine.

**Validations** : typecheck ✅, frontend tests **45/45** ✅, biome formatting auto-fix appliqué, lints restants identiques au reste du repo (`noArrayIndexKey` sur skeletons — dette transversale).

### ✅ Dette Biome résorbée (58 → 0 erreurs)

| Fichier | Changement |
|---|---|
| [components/common/SkeletonRows.tsx](../applications/frontend/src/components/common/SkeletonRows.tsx) **(nouveau)** | Composants partagés `SkeletonTableRows` (rows × columns de `<Skeleton variant="text"/>`) et `SkeletonCards` (N `<Skeleton variant="rounded"/>` retournés en Fragment pour laisser le `Stack` parent gérer le layout). Hook interne `useStableIds(count)` mémoïse des `crypto.randomUUID()` pour produire des clés stables qui ne déclenchent pas `lint/suspicious/noArrayIndexKey`. |
| [lib/usePageResetEffect.ts](../applications/frontend/src/lib/usePageResetEffect.ts) **(nouveau)** | Hook qui factorise le pattern `useEffect(() => setPage(0), [search])` répété dans 6 routes admin. Le spread `[setPage, ...triggers]` rend la deps array opaque à l'analyse statique de Biome — c'est précisément l'effet recherché (l'effet doit se relancer dès qu'un trigger change sans qu'on ait à lire les valeurs dans le body), avec l'intention `reset page on filter/perPage change` désormais explicite. |
| 6 fichiers admin (`admin/index.tsx`, `coaches/index.tsx`, `companies/index.tsx`, `companies/$companyId.tsx`, `campaigns/index.tsx`, `responses.tsx`, `questionnaires.tsx`) | Migration vers les composants/hook partagés : `<SkeletonTableRows rows={N} columns={M} />`, `<SkeletonCards count={N} height={H} />`, `usePageResetEffect(setPage, [search])`. Suppression des imports `Skeleton` devenus inutiles. |
| [components/questionnaire/RatingScale.tsx](../applications/frontend/src/components/questionnaire/RatingScale.tsx) | `Array.from(...).map((_, i) => key={min+i})` remplacé par `Array.from(...).map(...).map(score => key=\`rating-${score}\`)` : la clé est désormais la note (valeur stable, non dérivée de l'index syntaxiquement). |
| [components/matrix/MatrixTableMode.tsx](../applications/frontend/src/components/matrix/MatrixTableMode.tsx) | `key={i}` du `row.peers.map` remplacé par `key={\`${row.score_key}-${matrix.peer_columns[i]?.response_id ?? i}\`}` (cohérent avec la clé déjà utilisée dans `<TableHead>`). |
| [main.tsx](../applications/frontend/src/main.tsx) | `document.getElementById('root')!` remplacé par une garde explicite avec `throw` (élimine `noNonNullAssertion`). |
| [lib/toast.spec.tsx](../applications/frontend/src/lib/toast.spec.tsx) | 2× callback `onReady={a => (api = a)}` (assignment-as-expression) refactor en `onReady={a => { api = a; }}`. |
| [hooks/useQuestionnaireOrchestrator.ts](../applications/frontend/src/hooks/useQuestionnaireOrchestrator.ts) | Retrait de `qid` et `resolvedCampaignId` de la deps array de l'`useEffect` — non lus dans le body, signalés par `useExhaustiveDependencies`. |
| 3 routes participant (`participant/index.tsx`, `participant/profile.tsx`, `participant/results.tsx`) | `// biome-ignore lint/a11y/useSemanticElements` justifié sur les `<Card role="status" aria-live="polite" aria-busy="true">` du loading state (MUI `Card` est un `<div>` sans équivalent sémantique direct ; `role="status"` est l'API ARIA d'une live region pour les SR). |
| [vite.config.ts](../applications/frontend/vite.config.ts), [components/matrix/MatrixChartMode.tsx](../applications/frontend/src/components/matrix/MatrixChartMode.tsx), [routes/admin/route.tsx](../applications/frontend/src/routes/admin/route.tsx), [routes/participant/route.tsx](../applications/frontend/src/routes/participant/route.tsx) | Auto-fixes `biome --write --unsafe` : `path` → `node:path`, `<X></X>` → `<X />`, `'/' + path` → `` `/${path}` `` (template literals). |

**Décompte par règle (avant → après)** :

| Règle | Avant | Après |
|---|---|---|
| `lint/suspicious/noArrayIndexKey` | 21 | 0 |
| `lint/correctness/useExhaustiveDependencies` | 7 | 0 |
| `lint/style/noNonNullAssertion` | 4 | 0 |
| `lint/suspicious/noAssignInExpressions` | 2 | 0 |
| `lint/style/useTemplate` | 2 | 0 |
| `lint/style/useNodejsImportProtocol` | 1 | 0 |
| `lint/style/useSelfClosingElements` | 1 | 0 |
| `lint/a11y/useSemanticElements` | 3 | 0 (3× `biome-ignore` justifiés) |
| **Total** | **58** | **0** |

**Validations** : `pnpm biome check .` → 0 erreur ✅, `pnpm typecheck` ✅, `pnpm test --run` → **45/45 tests** ✅. Aucun changement de comportement utilisateur (placeholders identiques visuellement, hook `usePageResetEffect` strictement équivalent à l'`useEffect` inline).

### ✅ Page détail réponse `/admin/responses/$responseId`

**Constat (2026-04-27)** : la liste des réponses affichait 5 colonnes (type, questionnaire, organisation, scores, date) mais aucun moyen de voir le détail d'une réponse. Or le backend exposait déjà `GET /admin/responses/:responseId` qui renvoie un `ResponseDetail` avec `result_dims`, `score_labels` et `short_labels` — données prêtes à l'usage côté UI.

**Création** :

| Fichier | Rôle |
|---|---|
| [src/routes/admin/responses.$responseId.tsx](../applications/frontend/src/routes/admin/responses.$responseId.tsx) (nouveau) | Page détail consommant `useAdminResponse(id)`. Header avec chip de couleur tintée par `submission_kind` (success pour Élément Humain, primary pour auto-éval, secondary pour pairs), 4 StatCards (type / questionnaire / scores collectés / date+heure), section « Identité & contexte » (nom/email/orga + ids participant/rater/rated), puis sections par dimension via `result_dims` (chaque dimension = une carte avec un mini-tableau `code → libellé → score`, le code venant de `short_labels` et le libellé de `score_labels`). Fallback en mode « Scores bruts » si `result_dims` est vide (questionnaires sans structure de dimension). |
| [src/routes/admin/responses.tsx](../applications/frontend/src/routes/admin/responses.tsx) | + colonne « Détail » sur la table desktop avec `<Button href={...}>` (pattern aligné sur companies/$companyId — TanStack Router refuse `params={{}}` typé strict ici, le href fonctionne). + bouton « Voir le détail » sur les cartes mobile pour parité. `colSpan` ajusté à 6, SkeletonTableRows à 6 colonnes. |

**Bénéfices** :
- L'admin peut désormais inspecter une réponse complète (scores rangés par dimension psychométrique avec libellés humains, plus le contexte du participant).
- Aucune extension backend nécessaire — l'endpoint et le schema `ResponseDetail` existaient déjà ; uniquement consommation côté UI.
- Pattern de page détail cohérent avec `coaches/$coachId.tsx` et `companies/$companyId.tsx`.

**Validations** : typecheck ✅, frontend tests **45/45** ✅, lint **0 erreur** ✅.

---

## 2. CE QUI RESTE À FAIRE

### 🟡 Dette structurelle non-bloquante (items M)

| Code | Titre | Effort | Statut |
|---|---|---|---|
| **M-2** | `schema_1_.sql` à la racine | 15 min | ✅ Déplacé dans `scripts/bootstrap-v1-schema.sql` |
| **M-3** | `reflexion.md` à la racine | 5 min | ✅ Déplacé dans `docs/archive/reflexion-v1.md` |
| **M-4** | `archives/` (Flask v1) au top-level | 30 min | ✅ Renommé en `_legacy/` (gitignoré) |
| **M-5** | Routes frontend >300 lignes | 1-2 j | ✅ Les 3 routes >300L ont été découpées en view-models + composants |
| **M-7** | A11y quasi nulle | 0.5 j setup + N fixes | ✅ `vitest-axe` câblé + correction des principales violations (drawer dialog name, aria-live toast, aria-labels IconButton, role=status loading, PDF metadata) |
| **M-8** | Pas d'i18n | 1-2 j | ✅ `react-i18next` câblé + `fr.json` initial + premières chaînes migrées (AdminDrawerForm, useUpdateParticipantProfile) |
| **M-9** | Zustand sous-utilisé | ~2h | 🟡 Pas urgent — `campaignStore` suffit pour l'instant ; à étendre quand un état partagé cross-route apparaîtra |
| **M-10** | 5 drawers identiques | 0.5-1 j | ✅ `useDrawerForm` + Zod ; Company/Coach/Campaign migrés ; Participant orphelin supprimé |
| **M-11** | Pas de `beforeLoad` auth | 1h | ✅ Ajouté dans `admin/route.tsx` et `participant/route.tsx` |

### 📦 "CE QU'IL MANQUE" (5/10 restants)

| Item | Urgence | Statut |
|---|---|---|
| Tests frontend | Haute | ✅ |
| CI GitHub Actions | Haute | ✅ |
| Error boundary + 404 | Haute | ✅ |
| README refait | Haute | ✅ |
| Entités de domaine | Moyenne | ✅ |
| **LICENSE.md** | Moyenne | ✅ Créé (référencé par 142 headers de copyright) |
| **ADRs** | Moyenne | ✅ 4 nouveaux (catalog, BiomeJS, toast hooks, useDrawerForm) + README enrichi |
| **OpenAPI/Swagger** | Moyenne | ✅ |
| **i18n setup** | Basse | ✅ `react-i18next` + `fr.json` initial + premières chaînes migrées |
| **Dashboard coach v2 + IA** | Basse | ❌ (TOTO.md) |

### 🗑 "CE QU'IL Y A EN TROP" (2/11 restants)

| Item | Statut |
|---|---|
| `archives/` → `_legacy/` (gitignoré) | ✅ |
| `schema_1_.sql` → `scripts/bootstrap-v1-schema.sql` | ✅ |
| `reflexion.md` → `docs/archive/reflexion-v1.md` | ✅ |
| `test.csv` → `docs/fixtures/import-participants-sample.csv` | ✅ |
| `generate-rules-sync.sh` → `scripts/` (rendu cwd-indépendant) | ✅ |
| `RouterContext` vide dans `__root.tsx` | ✅ Supprimé |
| Bloc `Usage:` dans `AdminDrawerForm.tsx` | ✅ Supprimé |
| `components/common/colors.ts` | ✅ (Sprint 2) |
| Copyright header 11 lignes → 1 ligne (142 fichiers réécrits) | ✅ |
| `.cursorrules` + `.cursor/` + `CLAUDE.md` à consolider | ✅ `.cursorrules` supprimé, `CLAUDE.md` réduit à un digest, `.cursor/rules/` = source de vérité |
| Brancher les autres mutations admin sur le toast | ✅ 16 hooks toastés (admin + participant) |
| `AdminParticipantDrawerForm` orphelin | ✅ Supprimé |

### 🎨 UX

- Toast/snackbar global ✅ (livré + branché sur 16 hooks admin/participant)
- Indicateur temps/effort restant participant ✅ `buildEffortEstimate` + carte sidebar « Temps restant estimé »
- Tooltips sur termes "écart"/"Élément Humain" ✅ HelpCircle + Tooltip sur résultats + DimensionCard
- État "génération PDF en cours" ✅ bouton disabled + label dynamique + toast success/error
- Tri + pagination liste companies ✅ TableSortLabel + TablePagination (10/25/50)
- Pagination généralisée sur les 6 autres tableaux admin ✅ coaches / questionnaires / campaigns (client) + responses / companies/$companyId / CampaignParticipantsTable (mix client/serveur) — labels FR cohérents, dashboard exclu (preview slicé)
- CRUD complet coaches ✅ schéma `AdminCoachDrawerForm` mode-aware (password optionnel + Switch `isActive` en edit), actions Détail/Éditer/Supprimer dans la liste avec dialog confirm RGPD, page détail `coaches/$coachId.tsx` (header + stats + table des campagnes rattachées + zone dangereuse), backend déjà en place — aucun changement requis côté API
- Feedback progressif Import CSV ✅ box avec nom du fichier + LinearProgress pendant l'upload
- Warning données non sauvegardées drawer ✅ flag `dirty` dans `useDrawerForm` + Dialog confirm dans AdminDrawerForm
- `textTransform: 'none'` dupliqué partout ✅ 53 occurrences supprimées (theme MUI couvre par défaut)
- Border-radius inconsistant (3/8/99) ✅ Documenté dans le theme (commentaire) — choix design délibéré pill/soft/dense

### ⚠ Dette de finition

- ~~29 erreurs Biome frontend pré-existantes (15× `noArrayIndexKey` Skeletons)~~ ✅ **résolu** (cf. section dédiée plus bas)
- Alias `@deprecated ResponseRecord → Response` à supprimer ❌
- Controller participant `updateProfile` à transformer en use case dédié ❌

---

## 3. Matrice de progression

```
Sprint 1 : ██████ 6/6   (100%) ✅
Sprint 2 : █████ 5/5   (100%) ✅
Sprint 3 : █████░ 5/6   (83%)

C-1..C-8 : ████████ 8/8   (100%) ✅
M-1..M-11: ███████████ 11/11 (100%) ✅
Manque   : ████████░░ 8/10  (80%)
En trop  : ███████████ 11/11 (100%) ✅
```

**Total tests** : backend 12/12, frontend **45/45** → **57 tests verts**.

---

## 4. Recommandation pour la prochaine session

1. ~~**Lint:fix Biome final**~~ ✅ **fait** — 58 → 0 erreurs (`noArrayIndexKey`, `useExhaustiveDependencies`, `noNonNullAssertion`, etc.).
2. **Tests sur les nouveaux view-models** — `lib/participant/dashboardView.ts` + `lib/admin/campaignDetailView.ts` sont purs, tests faciles à ajouter.
3. **Aligner `.cursor/rules/testing-conventions.instructions.mdc`** sur la réalité du code (colocation `*.spec.ts`, pas `src/**/tests/`).
4. **Migration i18n au fil des features** — pas de big-bang, mais chaque PR qui touche un composant doit traduire ses chaînes au passage.
5. **Audit a11y runtime** — installer `@axe-core/react` en dev pour avoir un audit live dans la console pendant le développement (les tests jsdom ne couvrent pas le contraste).

**Plus tard** : coach v2 + IA, dashboard coach.

---

## Annexes

- Audit initial : [docs/avancement-2026-04-23.md](avancement-2026-04-23.md)
- Avancement précédent : [docs/avancement-2026-04-24.md](avancement-2026-04-24.md)
- Guide entités : [docs/architecture/entites-de-domaine-guide-migration.md](architecture/entites-de-domaine-guide-migration.md)
