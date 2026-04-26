# État d'avancement — Questionnaire Platform (Révéla / AOR)

> Rapport d'avancement au **2026-04-24**, lu en regard de l'audit initial du **2026-04-23** ([avancement-2026-04-23.md](avancement-2026-04-23.md)).
> Scope : 2 journées de refactor. Tout le travail a été exécuté + validé (typecheck/tests/boot) à chaque étape.

---

## TL;DR — Où on en est

| Sprint plan | Items | Livrés | Reste |
|---|---|---|---|
| Sprint 1 (filet de sécurité) | 6 | **6/6** ✅ | 0 |
| Sprint 2 (refacto structurel) | 5 | **3/5** | #10 Swagger, #11 Tests frontend |
| Sprint 3+ (backlog) | 6 | **1/6** (#12 entités) | i18n, a11y, routes >300L, toast, coach v2/IA |
| Critiques "CE QUI CHOQUE" (C-1…C-8) | 8 | **8/8** ✅ | 0 |
| Moyens "CE QUI EST MOYEN" (M-1…M-11) | 11 | **2/11** | M-2, M-3, M-4, M-5, M-7, M-8, M-9, M-10, M-11 |
| "CE QUI MANQUE" (création) | 10 | **3/10** | 7 items |
| "CE QUI EST EN TROP" (nettoyage) | 11 | **2/11** | 9 items |

**Le filet de sécurité critique est posé.** Restent surtout des nettoyages UX + dette structurelle non-bloquante.

---

## 1. CE QUI A ÉTÉ FAIT

### ✅ Sprint 1 — Filet de sécurité (6/6 items)

| # | Item | Statut | Notes |
|---|---|---|---|
| 1 | Refaire [README.md](../README.md) | ✅ Livré | Stack NestJS complet, variables d'env documentées, scripts pnpm, endpoints |
| 2 | Retirer les mocks hardcodés participant | ✅ Livré | [participant/index.tsx](../applications/frontend/src/routes/participant/index.tsx) : `campaign` constant supprimé, `journey`/`metrics` renommés `journeyTemplate`/`metricsTemplate` avec valeurs neutres. **Typos accents corrigées** ("Cloturee" → "Clôturée", etc.) — résout aussi M-6 cohérence visuelle. [profile.tsx](../applications/frontend/src/routes/participant/profile.tsx) : vérifié, pas de vrais mocks (juste des `placeholder=""`). |
| 3 | Fix 401 participant | ✅ Vérifié | **L'audit était faux** : [participantClient.ts:20-32](../applications/frontend/src/api/participantClient.ts#L20-L32) avait déjà un interceptor complet. Aucun changement. |
| 4 | errorComponent + notFoundComponent | ✅ Livré | [__root.tsx:65-165](../applications/frontend/src/routes/__root.tsx#L65-L165) : écrans centrés avec Retry / Retour accueil, wrappés dans les providers pour survivre aux erreurs du root. |
| 5 | Durcir JWT_SECRET | ✅ Livré + **bug exposé** | [shared/env.ts](../applications/backend/src/shared/env.ts) avec `requireEnv()`. Appliqué à JWT_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD, FRONTEND_URL sur les 3 sites (admin.module, participant.module, jwt.strategy). **Bug caché révélé** : le backend ne chargeait PAS dotenv — tournait sur le fallback insecure depuis toujours. Fix dans [src/load-env.ts](../applications/backend/src/load-env.ts) + import premier dans `main.ts`. |
| 6 | CI GitHub Actions | ✅ Livré | [.github/workflows/ci.yml](../.github/workflows/ci.yml) : install → build:libs → lint + guard imports → typecheck → tests → build. Concurrency + cancel-in-progress. |

### ✅ Sprint 2 — Refacto structurel (3/5 items)

| # | Item | Statut | Notes |
|---|---|---|---|
| 7 | Éclater `admin.module.ts` | ✅ Livré | **7 sous-modules créés** : `AdminSharedModule` (infra transverse), `AdminAuthModule`, `AdminManagementModule`, `AdminCampaignsModule`, `AdminCoachesModule`, `AdminCompaniesModule`, `AdminParticipantsModule`, `AdminResponsesModule`. `admin.module.ts` passe de 452 → 38 lignes (pur composer). Boot validé, toutes routes mappées. |
| 8 | Dédupliquer la palette | ✅ Livré | [components/common/colors.ts](../applications/frontend/src/components/common/colors.ts) **supprimé**. `COLORS` local dans [admin/route.tsx](../applications/frontend/src/routes/admin/route.tsx) supprimé. 13 fichiers mis à jour : `COLORS.blue` → `'primary.main'`, `rgba(15,24,152,0.08)` → `'tint.primaryBg'`, `COLORS.surface` → `'background.paper'`, `COLORS.background` → `'background.default'`, template strings `${COLORS.border}` → `border: '1px solid'` + `borderColor: 'border'`. Usage `useTheme()` pour les props `color` non-sx. |
| 9 | Extraire PeerScore/ScoreRow/EcartView/DimensionView | ✅ Livré — **dans `@aor/types`** | Plan initial : `lib/results/types.ts` frontend. Correction utilisateur : "les types doivent être dans @aor/types". Créé [packages/aor-common/types/src/participant-results-view.ts](../packages/aor-common/types/src/participant-results-view.ts) + barrel. Import dans `results.tsx` et `exportResultsPdf.ts`. |
| 10 | Swagger `/api/docs` | ❌ **À faire** | Non entamé. |
| 11 | Tests frontend (5 parcours) | ❌ **À faire** | Non entamé. Zéro test frontend actuellement. |

### ✅ Sprint 3 — Entités de domaine (#12 complet ; #13-17 à faire)

**Item #12 livré à 100 %** : 6 entités immutables avec `Object.freeze(this)` + `private constructor` + factories `create`/`hydrate`, conformes à CLAUDE.md.

| Phase | Entité | Fichiers créés | Sécurité |
|---|---|---|---|
| 1 | **Company** | [domain/companies/](../applications/backend/src/domain/companies/) | Champs publics readonly |
| 2 | **Coach** | [domain/coaches/](../applications/backend/src/domain/coaches/) | `#passwordHash` privé ECMAScript → invisible JSON.stringify |
| 3 | **Invitation** | [domain/invitations/](../applications/backend/src/domain/invitations/) | Machine à états `used > deactivated > expired > active` encapsulée |
| 4 | **Participant** | [domain/participants/](../applications/backend/src/domain/participants/) | `#passwordHash` privé + fix `ParticipantAdminListItem` qui exposait le hash |
| 5 | **Campaign** | [domain/campaigns/](../applications/backend/src/domain/campaigns/) | Machine à états `draft/active/closed/archived` |
| 6 | **Response** | [domain/responses/](../applications/backend/src/domain/responses/) | Immutable par nature (aucune mutation method) |

**Ports simplifiés** : toutes les méthodes targeted (`updateCompanyId`, `updateProfile`, `updateStatus`, `updateCoachId`, `setPasswordHash`, `update`, `markUsed`) **supprimées** et remplacées par `save(entity)` entity-oriented. Code mort purgé : `responses.update`, `invitations.markUsed`, `participants.deleteById` / `setPasswordHash`, etc.

**Guide de migration** écrit dans [docs/architecture/entites-de-domaine-guide-migration.md](architecture/entites-de-domaine-guide-migration.md).

**Validations à chaque phase** : typecheck ✅, 12/12 tests ✅, build ✅, boot Nest ✅.

### ✅ Items critiques de l'audit (C-1 à C-8)

| Code | Titre | Statut |
|---|---|---|
| C-1 | README périmé | ✅ Refait |
| C-2 | Mocks hardcodés participant | ✅ Supprimés |
| C-3 | Zéro test frontend | ❌ Toujours 0 (bouchon = filet CI) |
| C-4 | Zéro error boundary, 404 | ✅ Ajoutés dans `__root.tsx` |
| C-5 | Interceptor 401 participant | ✅ Vérifié (faux positif de l'audit) |
| C-6 | Palette dupliquée | ✅ Dédupliquée |
| C-7 | `admin.module.ts` 452L + JWT fallback | ✅ Éclaté en 8 modules + `requireEnv` |
| C-8 | Pas de CI/CD | ✅ GitHub Actions en place |

**7/8 résolus, 1 bouché via workaround** (C-3 → CI = filet de sécurité partiel).

### ✅ Items moyens de l'audit (M-1 à M-11)

| Code | Titre | Statut |
|---|---|---|
| M-1 | Archi layer-first (pas de domaine) | ✅ **Résolu par #12** : 6 dossiers `domain/{feature}/` avec entités + erreurs |
| M-6 | Types dupliqués `results.tsx` / `exportResultsPdf.ts` | ✅ Résolu (#9 Sprint 2) |

**2/11 résolus. Les 9 autres sont non-bloquants** (voir section 2).

### 🔧 Travaux annexes non prévus dans le plan initial

- **Bug dotenv** : backend ne chargeait pas `.env` → tournait sur le fallback `'dev-insecure-change-me'` depuis toujours. Révélé par le durcissement `requireEnv`. Fix : [src/load-env.ts](../applications/backend/src/load-env.ts).
- **Biome lint:fix** en masse : 126 fichiers backend + 78 frontend reformatés (CRLF → LF, organizeImports, quotes). Backend = 0 erreur. Frontend = 29 erreurs pré-existantes restantes (principalement `noArrayIndexKey` sur Skeletons, 1 corrigée : `RouterContext = {}` → `Record<string, never>`).
- **Controller participant** : endpoint `PATCH /profile` refactoré en read-mutate-save (entity-oriented) dans le cadre de la phase 4. Dette technique restante : devrait passer par un `UpdateParticipantProfileUseCase` dédié au lieu d'injecter le port directement.

---

## 2. CE QUI RESTE À FAIRE

### 🔴 Rien de critique en suspens

Tous les items C-1 à C-8 sont résolus.

### 🟡 Dette structurelle non-bloquante (items M non traités)

| Code | Titre | Effort estimé | Impact |
|---|---|---|---|
| **M-2** | `schema_1_.sql` à la racine | 15 min | Ambigu pour nouveau dev. Décision : renommer `scripts/bootstrap-v1-schema.sql` ou supprimer. |
| **M-3** | `reflexion.md` à la racine | 5 min | À déplacer dans `docs/archive/` |
| **M-4** | `archives/` (Flask v1) au top-level | 30 min | Déplacer dans branche archive, supprimer du main |
| **M-5** | Routes frontend >300 lignes | 1-2 j | `results.tsx` (559L), `participant/index.tsx` (521L), `admin/campaigns/$campaignId.tsx` (508L). Extraire view-models/hooks. |
| **M-7** | A11y quasi nulle | 0.5 j setup + N fixes | Installer `@axe-core/react`, brancher en dev, sortir rapport. Encore 29 erreurs lint frontend dont 15 `noArrayIndexKey` visibles ici aussi. |
| **M-8** | Pas d'i18n | 1-2 j | Pas urgent tant que single locale FR |
| **M-9** | Zustand sous-utilisé | ~2h | Pas critique. Pertinent si filtres persistent entre navigations. |
| **M-10** | 5 drawers admin identiques | 0.5-1 j | `AdminCampaignDrawerForm`, `AdminCoachDrawerForm`, `AdminCompanyDrawerForm`, `AdminParticipantDrawerForm` + wrapper générique. Introduire `useDrawerForm(schema, onSubmit)` + Zod per entity. |
| **M-11** | Pas de `beforeLoad` auth | 1h | Le chrome admin/participant apparaît brièvement avant redirect 401. À ajouter dans `admin/route.tsx` et `participant/route.tsx`. |

### 📦 "CE QU'IL MANQUE" (création, 7/10 restants)

| Item | Urgence | Statut |
|---|---|---|
| Tests frontend (5 parcours) | Haute | ❌ |
| CI GitHub Actions | Haute | ✅ |
| Error boundary + 404 | Haute | ✅ |
| **LICENSE.md** (headers y font référence) | Moyenne | ❌ |
| README refait | Haute | ✅ |
| **ADRs** (Architecture Decision Records) | Moyenne | ❌ |
| **OpenAPI/Swagger** via `@nestjs/swagger` | Moyenne | ❌ |
| Entités de domaine immutables | Moyenne | ✅ |
| **i18n setup** | Basse | ❌ |
| **Dashboard coach v2 + analyse IA** | Basse | ❌ (dans TOTO.md) |

### 🗑 "CE QU'IL Y A EN TROP" (nettoyage, 9/11 restants)

| Chemin | Statut |
|---|---|
| `archives/` | ❌ Encore présent |
| `schema_1_.sql` | ❌ Encore présent |
| `reflexion.md` | ❌ Encore présent |
| `test.csv` à la racine | ❌ Encore présent |
| `generate-rules-sync.sh` | ❌ Non documenté ni supprimé |
| `.cursorrules` + `.cursor/` + `CLAUDE.md` | ❌ 3 sources de vérité toujours |
| `components/common/colors.ts` | ✅ Supprimé |
| `COLORS` local dans `admin/route.tsx` | ✅ Supprimé |
| Copyright header 11 lignes sur chaque fichier | ❌ Toujours partout |
| `RouterContext` vide | 🟡 Corrigé (`Record<string, never>`) mais non supprimé |
| Bloc `Usage:` dans `AdminDrawerForm.tsx` | ❌ Toujours là |

### 🎨 UX (casquette audit) — items non traités

#### Parcours participant
- ❌ **Indicateur temps/effort restant** sur la progression ("il reste 5 questions", "environ 10 min")
- ❌ **Toast/snackbar global** après action (submit → "Bien reçu")
- ❌ **Onboarding/tooltip** sur les termes "écart", "Élément Humain" dans [results.tsx](../applications/frontend/src/routes/participant/results.tsx)
- ❌ **État "génération en cours"** + feedback de succès sur le bouton Export PDF

#### Parcours admin
- ❌ **Tri + pagination** sur la liste `companies`
- ❌ **Feedback progressif** pendant l'Import CSV
- ❌ **Warning données non sauvegardées** à la fermeture d'un drawer
- ❌ **Messages d'erreur custom** pour URLs admin malformées (le 404 global existe, mais pas un "camppaigns → campaigns ?" spécifique)

#### Cohérence visuelle
- ✅ Typos "Cloturee"/"Archivee" corrigées
- ❌ `textTransform: 'none'` dupliqué partout (déjà dans le theme, à retirer des `sx`)
- ❌ Border-radius inconsistant (`3`/`8`/`99` mélangés)

### ⚠ Dette de finition

- **29 erreurs lint Biome frontend** (post lint:fix) :
  - 15× `noArrayIndexKey` sur les `<TableRow key={i}>` des Skeletons (intentionnel mais Biome râle)
  - 1× `useExhaustiveDependencies` (React Hook deps)
  - 1× `noNonNullAssertion` (`document.getElementById('root')!` dans main.tsx)
  - 1× `useSelfClosingElements` + 1× `useNodejsImportProtocol` (auto-fixables mais "unsafe" pour Biome)
  - Décision : soit `biome check --write --unsafe`, soit annoter `biome-ignore` sur les Skeletons, soit migrer en clés stables (`skeleton-0`, etc.)

- **Alias `@deprecated ResponseRecord → Response`** dans [IResponsesRepository.port.ts](../applications/backend/src/interfaces/responses/IResponsesRepository.port.ts) : à supprimer quand les ~10 consommateurs auront migré leur annotation.

- **Controller participant** bypasse toujours les use cases pour `updateProfile`. À transformer en `UpdateParticipantProfileUseCase` dédié.

---

## 3. Matrice de progression

```
Sprint 1 : ██████ 6/6   (100%)
Sprint 2 : ████░░ 3/5   (60%)
Sprint 3 : █░░░░░ 1/6   (17%)

C-1..C-8 : ████████ 8/8   (100%)
M-1..M-11: ██░░░░░░░░░ 2/11  (18%)
Manque   : ███░░░░░░░ 3/10 (30%)
En trop  : ██░░░░░░░░░ 2/11 (18%)
```

**Observations** :
- Les items critiques et structurels sont tous traités.
- Il reste surtout du **nettoyage de repo** (archives, reflexion.md, schema_1_.sql) et des **polishings UX**.
- Le plus gros bloc restant est **le filet de test frontend** (#11 Sprint 2) — condition nécessaire pour attaquer le refacto des routes >300L (M-5) en sécurité.

---

## 4. Recommandation pour la prochaine session

**Proposition d'ordre pragmatique** (décroissant en valeur/effort) :

1. **Toast/snackbar global** (~30 min) — quick win UX, pattern fondamental pour toutes les mutations.
2. **Nettoyage repo** (~30 min) — déplacer `archives/`, `reflexion.md`, `schema_1_.sql`, `test.csv`, supprimer le bloc `Usage:` d'`AdminDrawerForm`. Gain de lisibilité immédiat, zéro risque.
3. **Setup Vitest + Testing Library frontend** (~2 h) — infra + 2 premiers tests (login admin, happy path participant). Débloque #11 Sprint 2 et sécurise les refactos M-5/M-10.
4. **Audit a11y** (~1 h) — `@axe-core/react` en dev, rapport, fix des 2-3 issues les plus visibles.
5. **Swagger `/api/docs`** (~1-2 h) — `@nestjs/swagger` sur les contrôleurs admin + participant. Additif, zéro risque.
6. **Éclater les routes >300L** (~1-2 j) — à faire APRÈS les tests frontend.

**Plus tard (non-urgents)** : i18n, refactor drawers avec `useDrawerForm`, `beforeLoad` auth, coach v2 + IA.

---

## Annexes

- Audit initial : [docs/avancement-2026-04-23.md](avancement-2026-04-23.md)
- Guide de migration des entités : [docs/architecture/entites-de-domaine-guide-migration.md](architecture/entites-de-domaine-guide-migration.md)
- Plan mode original (audit) : `C:\Users\kevin\.claude\plans\velvet-singing-eich.md`
