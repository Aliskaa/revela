# État des lieux — Questionnaire Platform (Révéla / AOR)

> Rapport d'audit critique demandé par l'utilisateur. Casquette : expert full-stack + expert UX.
> Source : inspection directe du code au 2026-04-23, branche `frontendv2`.
> Note : ce fichier tient lieu de livrable ; en plan mode c'est le seul fichier éditable.

---

## Contexte

Projet : plateforme de questionnaires psychométriques (FIRO-B + dérivés) rebrandée Révéla.
Stack : pnpm monorepo, NestJS + hexagonal + CQRS, React + Vite + TanStack Router/Query, MUI v7, Drizzle ORM (PostgreSQL), BiomeJS, Vitest, Zod v4.
Utilisateur : tu veux savoir **ce qui choque, ce qui est solide, ce qui manque, ce qui est en trop**. Pas de brochure, mode strict.

---

## TL;DR — Verdict global

Architecture **ambitieuse et bien intentionnée**, respectée à ~70 %. Le backend est **propre sur la forme** (ports, symboles DI, use cases atomiques) mais **trahit l'hexagonal dans la structure physique** (organisation layer-by-layer au lieu de modules métier, zéro entité de domaine, câblage DI explosé en un seul `admin.module.ts` de 452 lignes).

Le frontend est **joli mais fragile** : UI MUI cohérente et soignée visuellement, mais **zéro test**, **zéro error boundary**, **zéro 404**, **mocks hardcodés en prod**, design system inexistant (c'est juste MUI), couleurs dupliquées à 3 endroits, routes monolithiques de 500+ lignes.

Le projet est **à mi-chemin** : la v1 fonctionne, la v2 Révéla est plaquée dessus, mais la dette UX et l'absence de filet de sécurité testuel est un risque majeur avant mise à l'échelle.

---

## 1. CE QUI EST SOLIDE (keep it)

### Backend
- **Séparation ports / adapters / use cases correcte** sur le principe. Les ports sont typés, préfixés `I`, exposés via symboles (`PASSWORD_HASHER_PORT_SYMBOL`, etc.), et les use cases prennent leurs dépendances groupées dans `{ ports }`.
- **Un use case = un intent métier** est réellement respecté : `CreateAdminCampaignUseCase`, `InviteCampaignParticipantsUseCase`, `EraseParticipantRgpdUseCase`… pas de `ManageX` / `XCrud`. C'est rare, c'est bien.
- **Guard d'imports** (`guard-backend-shared-imports.mjs`) qui bloque les imports d'artefacts legacy : bon pattern, montre que l'équipe gère activement la dette.
- **Conformité Zod v4** : 0 usage de `z.string().uuid()` / `.email()` / `.datetime()` dans le code applicatif (seulement dans la doc et .cursorrules).
- **Drizzle migrations versionnées** (13 migrations dans `packages/aor-drizzle/drizzle/`), nommées, avec `meta/` et snapshot. C'est propre.
- **Catalog pnpm** centralisé, versions alignées (Nest 11, Zod 4, Vitest 4, etc.).
- **Copyright header** appliqué uniformément (même si c'est du bruit, c'est intentionnel et traçable).

### Frontend
- **TanStack Router file-based** bien utilisé, tree `admin/` vs `participant/` clair.
- **TanStack Query correctement câblé** : queryKeys organisés en `adminKeys` objet, staleTime 30s global, retry désactivé sur mutations, token injecté via interceptor Axios. [applications/frontend/src/hooks/admin.ts:21-36](applications/frontend/src/hooks/admin.ts#L21-L36), [applications/frontend/src/routes/__root.tsx:19-30](applications/frontend/src/routes/__root.tsx#L19-L30).
- **Tableau responsive desktop/mobile** correctement implémenté (pattern Table + Cards mobiles) dans [applications/frontend/src/routes/admin/companies/index.tsx:125-217](applications/frontend/src/routes/admin/companies/index.tsx#L125-L217).
- **Skeletons** bien utilisés pendant le chargement (ex. lignes 137-143).
- **Theme MUI typé** avec augmentation de module pour `border` et `tint.*` : [applications/frontend/src/lib/theme.ts:3-32](applications/frontend/src/lib/theme.ts#L3-L32).

---

## 2. CE QUI CHOQUE (critique — à corriger en priorité)

### 🔴 C-1 · README complètement périmé
[README.md](README.md) décrit encore le stack **Flask + SQLAlchemy + MySQL + pytest**, qui est archivé dans `archives/`. Les routes documentées ne correspondent plus à l'API NestJS. Un nouveau dev arrivant sur le projet est désorienté dès la page 1.
**Impact** : onboarding cassé, documentation = mensonge.

### 🔴 C-2 · Mocks hardcodés dans des routes de prod
[applications/frontend/src/routes/participant/index.tsx:59-107](applications/frontend/src/routes/participant/index.tsx#L59-L107) contient un objet `campaign` avec `"Leadership DSJ 2026"`, `"Ville de Lyon"`, `"Claire Martin"`, une `journey` de 5 étapes en dur, et 4 `metrics` codées en dur. Idem dans [applications/frontend/src/routes/participant/profile.tsx](applications/frontend/src/routes/participant/profile.tsx).
**Impact** : un participant voit des données **fictives** si les hooks n'ont pas encore réhydraté. Risque : affichage d'une campagne inventée pendant un flash de rendu.

### 🔴 C-3 · Zéro test côté frontend
0 fichier `.spec.ts` ou `.spec.tsx` sous `applications/frontend/`. Vérifié.
**Impact** : pas de filet pour un parcours participant qui touche à l'argent (résultats, coaching). La moindre régression UX passera en prod.

### 🔴 C-4 · Zéro error boundary, zéro 404, zéro fallback
Grep sur `ErrorBoundary` / `errorComponent` / `notFoundComponent` dans `applications/frontend/src` : **0 match**. TanStack Router supporte `errorComponent` et `notFoundComponent` nativement, rien n'est branché.
**Impact UX** : si une query échoue hors 401, l'utilisateur voit soit un écran blanc, soit des données vides sans message. Si l'URL est fausse, pas de 404.

### 🔴 C-5 · Interceptor Axios qui ne gère que les admins
[applications/frontend/src/api/client.ts:22](applications/frontend/src/api/client.ts#L22) redirige sur 401 seulement si `pathname.startsWith('/admin')`. Le **participant n'a donc aucun traitement 401** — si son token expire au milieu du parcours, il reste bloqué sur une page en erreur silencieuse.
**Impact** : utilisateur abandonné en cas de session expirée côté participant.

### 🔴 C-6 · Palette de couleurs dupliquée à 3 endroits
- [applications/frontend/src/lib/theme.ts:37-48](applications/frontend/src/lib/theme.ts#L37-L48) : palette MUI officielle.
- [applications/frontend/src/components/common/colors.ts](applications/frontend/src/components/common/colors.ts) : `ADMIN_COLORS = { blue, yellow, border }`.
- [applications/frontend/src/routes/admin/route.tsx:36-42](applications/frontend/src/routes/admin/route.tsx#L36-L42) : **re-définit un `COLORS` local** avec les mêmes valeurs.

13 fichiers utilisent `rgb(15,24,152)` / `#0F1898` / `ADMIN_COLORS` de façon inconsistante. Les mêmes 3 couleurs sont retapées en RGB littéral dans `exportResultsPdf.ts`.
**Impact** : un changement de marque (rebrand AOR → Révéla en cours, d'après les commits) demande de tout éditer à la main. Le theme MUI ne sert quasiment à rien pour l'identité visuelle.

### 🔴 C-7 · `admin.module.ts` — câblage DI monolithique de 452 lignes
[applications/backend/src/presentation/admin/admin.module.ts](applications/backend/src/presentation/admin/admin.module.ts) contient ~40 providers `useFactory` en flat, plus 3 sous-tableaux (`ADMIN_COMPANIES_PROVIDERS`, `ADMIN_COACHES_PROVIDERS`, `ADMIN_CAMPAIGNS_PROVIDERS`) qui sont déclarés **hors du décorateur**, concaténés avec `...`. C'est le symptôme d'un module qui devrait être **éclaté en AdminCampaignsModule, AdminCoachesModule, AdminCompaniesModule**, chacun avec son propre câblage.

De plus, `JWT_SECRET ?? 'dev-insecure-change-me'` ligne 279 est un anti-pattern : en prod si l'env var n'est pas set, le fallback signe avec un secret connu publiquement.
**Impact** : maintenance douloureuse, test unitaire du module quasi impossible, risque de sécurité si déploiement mal configuré.

### 🔴 C-8 · Pas de CI/CD
Pas de `.github/` ni `.gitlab-ci.yml`. Aucun pipeline qui lance `pnpm check` / `pnpm test` / `pnpm build` à chaque PR.
**Impact** : les règles BiomeJS, Vitest, guard-imports ne sont appliquées que si le dev pense à les lancer localement.

---

## 3. CE QUI EST MOYEN (à retravailler sans urgence)

### 🟡 M-1 · Architecture physique backend incohérente avec l'hexagonal
Le CLAUDE.md mandate `modules/<feature>/{application,domain,infrastructure}`. Le code est en réalité organisé **layer-first** :
```
applications/backend/src/
├── application/{admin,participant,responses,...}/  # use cases
├── domain/{admin,invitations,...}/                 # uniquement des erreurs, pas d'entités
├── infrastructure/{database,mail}/                 # adapters
├── interfaces/{admin,campaigns,...}/               # ports
└── presentation/{admin,participant,...}/           # controllers + modules
```
C'est **screaming architecture inversé**. Quand j'ouvre le projet, je vois des couches, pas des features. `domain/` ne contient que des erreurs (pas d'entités immutables avec `Object.freeze`, contrairement à la règle CLAUDE.md "Entités write-side immutables").

**Ce qui manque côté DDD** : aucune entité métier (Campaign, Coach, Participant, Response) visible en tant qu'objet de domaine. Les use cases parlent directement à des repositories qui renvoient des DTOs. Tu as un backend **procédural + CQRS**, pas vraiment un backend **hexagonal + DDD**.

### 🟡 M-2 · `schema_1_.sql` (17 KB) à la racine du repo
C'est un script "V1 CLEAN SCHEMA" PostgreSQL. Cohabite avec les migrations Drizzle. Soit c'est un seed initial (alors renomme-le `scripts/bootstrap-v1-schema.sql`), soit c'est un snapshot (alors supprime-le, Drizzle a déjà les migrations). **En l'état c'est ambigu** et un nouveau dev ne sait pas s'il doit le jouer ou le laisser.

### 🟡 M-3 · `reflexion.md` (13 KB) à la racine
Document de réflexion — ça a de la valeur historique mais ça pollue la racine. À déplacer dans `docs/archive/` ou `docs/decisions/`.

### 🟡 M-4 · `archives/` au top-level
La v1 Flask est là. Décision à prendre : soit on supprime (git log garde la trace), soit on met dans un dossier clairement nommé `_legacy/` avec un README explicite.

### 🟡 M-5 · Routes frontend qui font 300-560 lignes
- [participant/results.tsx](applications/frontend/src/routes/participant/results.tsx) : 559 lignes
- [participant/index.tsx](applications/frontend/src/routes/participant/index.tsx) : 521 lignes
- [admin/campaigns/$campaignId.tsx](applications/frontend/src/routes/admin/campaigns/$campaignId.tsx) : 508 lignes

Logique métier (calculs d'écarts, `buildDimensions`, `buildNextAction`, `buildProgress`) **mêlée au JSX**. À extraire en hooks ou en `lib/view-models/`.

### 🟡 M-6 · Types dupliqués entre `results.tsx` et `exportResultsPdf.ts`
`PeerScore`, `ScoreRow`, `EcartView`, `DimensionView` définis deux fois à l'identique :
- [applications/frontend/src/routes/participant/results.tsx:30-51](applications/frontend/src/routes/participant/results.tsx#L30-L51)
- [applications/frontend/src/lib/exportResultsPdf.ts:19-40](applications/frontend/src/lib/exportResultsPdf.ts#L19-L40)

À sortir dans un `lib/results/types.ts` et à importer des deux côtés.

### 🟡 M-7 · Accessibility quasi nulle
Grep `aria-` / `role=` : **7 occurrences sur tout le frontend** (dont 2 dans des SVG). MUI fournit une base, mais :
- Aucun `aria-live` sur les messages d'erreur/succès.
- Aucun audit automatisé (pas de `@axe-core/react`, pas de `jest-axe`).
- Le PDF exporté n'a pas de `title` / `language` métadonnées.

### 🟡 M-8 · Pas d'i18n
Chaînes françaises en dur partout. Pas de `react-i18next` ni équivalent. Le PDF ([exportResultsPdf.ts](applications/frontend/src/lib/exportResultsPdf.ts)) contient "Synthèse des résultats" etc. en dur. Pour l'instant c'est OK (client francophone), mais la dette grandira vite si clients internationaux.

### 🟡 M-9 · Stores Zustand quasi inexistants
Un seul store : `campaignStore.ts`. Les autres états globaux (filtres de tableaux, sélection de participant, drawer open/closed) sont stockés en `useState` local. Pas critique, mais **la cohérence cross-route est à surveiller** (ex : revenir sur une liste filtrée doit garder le filtre).

### 🟡 M-10 · Cinq formulaires drawer qui se ressemblent
[AdminDrawerForm](applications/frontend/src/components/admin/AdminDrawerForm.tsx) est un bon wrapper générique. Mais les 4 enfants (`AdminCampaignDrawerForm`, `AdminCoachDrawerForm`, `AdminCompanyDrawerForm`, `AdminParticipantDrawerForm`) ré-implémentent chacun :
- leur state de champs
- leur validation (probablement à la main, pas de `@tanstack/react-form` malgré la dépendance)
- leur gestion d'erreurs

**Refacto** : introduire un couple `useDrawerForm(schema, onSubmit)` + un schema Zod par entité, pour factoriser la plomberie.

### 🟡 M-11 · Absence de protection de route
`admin/route.tsx` et `participant/route.tsx` n'ont pas de `beforeLoad` qui vérifie l'auth et redirige. Le token est lu à l'appel API, donc un utilisateur non-auth voit le chrome admin (nav, sidebar) avant de se prendre un 401 + redirect. **L'UX est correcte mais pas propre**, et côté perf/SEO c'est du JS inutile.

---

## 4. CE QU'IL MANQUE (création nécessaire)

| Item | Urgence | Justification |
|---|---|---|
| **Tests frontend** (au moins 5 : login admin, création campagne, import CSV, parcours participant happy-path, export PDF) | Haute | 0 test = 0 confiance pour refactorer |
| **CI GitHub Actions** (lint + typecheck + test + build sur PR) | Haute | Aucune automatisation d'enforcement |
| **Error boundary global + 404 route** | Haute | UX cassée en cas d'erreur imprévue |
| **Fichier `LICENSE.md`** (référencé dans les headers, introuvable dans le repo) | Moyenne | Headers mentent |
| **README.md refait** basé sur le stack NestJS actuel | Haute | Onboarding |
| **`ADRs/`** (Architecture Decision Records) | Moyenne | `reflexion.md` est un brouillon, pas une trace structurée |
| **Documentation des endpoints** (OpenAPI/Swagger via `@nestjs/swagger`) | Moyenne | Pas de Swagger détecté |
| **Entités de domaine réelles** (Campaign, Participant, etc. comme classes write-side immutables) | Moyenne | Respect de CLAUDE.md (qui le mandate explicitement) |
| **i18n setup** (même si un seul locale) pour extraire les chaînes | Basse | Prévient la dette future |
| **Dashboard coach (v2)** et **analyse IA** | Basse | Déjà dans TOTO.md, correctement tracké |

---

## 5. CE QU'IL Y A EN TROP (à supprimer ou archiver)

| Chemin | Proposition |
|---|---|
| `archives/` | Déplacer dans branche archive, supprimer du main |
| `schema_1_.sql` | Renommer et bouger dans `scripts/` OU supprimer si redondant avec migrations Drizzle |
| `reflexion.md` | Bouger dans `docs/archive/reflexion-v1.md` |
| `test.csv` à la racine | Bouger dans `docs/fixtures/` ou dans un `.gitignore` |
| `generate-rules-sync.sh` | Documenter son rôle ou supprimer |
| `.cursorrules` + `.cursor/` + `CLAUDE.md` | Consolider si possible — trois sources de vérité pour règles d'assistant IA |
| `components/common/colors.ts` | Remplacer par lecture du theme MUI (`theme.palette.primary.main`) |
| Redéfinition de `COLORS` dans `admin/route.tsx` | Supprimer, utiliser le theme |
| Copyright header de 11 lignes sur **chaque** fichier backend | Garder 1 ligne `// Copyright (c) 2026 AOR Conseil` suffit ; le pavé actuel gonfle le bruit |
| `RouterContext` vide avec commentaire "Extend this later" | Supprimer jusqu'à ce qu'on en ait besoin |
| Bloc commentaire `Usage:` de 15 lignes à la fin d'`AdminDrawerForm.tsx` | La doc va dans un storybook, pas en bas d'un composant |

---

## 6. CASQUETTE UX — ce qui mérite attention côté utilisateur

### Parcours participant
- **Landing participant (`participant/index.tsx`)** : bonne intention (journey en 5 étapes avec icônes + metrics), mais les données réelles se mélangent avec des fallbacks hardcodés. Quand un utilisateur arrive sans `assignment` il voit **"Leadership DSJ 2026 — Ville de Lyon — Claire Martin"**. C'est grave.
- **Progression** : calculée en `useMemo` mais **aucun indicateur temps / effort restant** ("il reste 5 questions", "environ 10 min"). Un utilisateur ne sait pas s'il en a pour 2 ou 20 minutes.
- **Feedback après action** : pas de toast/snackbar visible. Après un submit, l'utilisateur espère un "Bien reçu" — il aura au mieux une navigation silencieuse.
- **Résultats (`results.tsx`)** : 559 lignes, radar + cartes + écarts + export PDF. Très riche. Mais : **aucun onboarding/tooltip** expliquant ce qu'est un "écart" ou un "Élément Humain". L'utilisateur découvre les termes.
- **Export PDF** : le bouton est là, mais pas d'état "génération en cours", pas de feedback de succès. Pour un PDF de restitution coaching c'est dommage, c'est un moment émotionnel.

### Parcours admin
- **Tableau Entreprises** : recherche OK, tri absent, pagination absente sur la liste companies (alors que `useCompanies()` est présumé renvoyer potentiellement 100+ entreprises). Risque de perf future.
- **Import CSV** : l'use case existe côté backend, mais je n'ai pas vu de feedback progressif côté UI. L'utilisateur uploade 500 lignes et espère qu'il se passe quelque chose.
- **Admin drawers** : bonne UX de panel latéral, mais **pas de warning de données non sauvegardées** si on ferme accidentellement.
- **404 / erreurs** : inexistants. `/admin/camppaigns` (typo) renvoie vers l'écran admin vide sans message.

### Cohérence visuelle
- Trois typos de "Cloturee", "Archivee" sans accents dans [participant/index.tsx:116-120](applications/frontend/src/routes/participant/index.tsx#L116-L120). Problème de charset dans l'édition probablement. À corriger.
- `textTransform: "none"` appliqué partout individuellement alors que c'est déjà dans le theme.
- Border-radius inconsistant : `borderRadius: 3` / `8` / `99` / `3xl` mélangés.

---

## 7. Plan d'action priorisé (si tu veux actionner)

### Sprint 1 (une semaine, effort ~5 j)
1. Refaire [README.md](README.md) pour le stack actuel.
2. Supprimer les mocks hardcodés dans [participant/index.tsx](applications/frontend/src/routes/participant/index.tsx) et [participant/profile.tsx](applications/frontend/src/routes/participant/profile.tsx), afficher un vrai empty state.
3. Corriger [api/client.ts](applications/frontend/src/api/client.ts) pour gérer aussi les 401 côté `/participant/*`.
4. Ajouter un `errorComponent` global + un `notFoundComponent` dans `__root.tsx`.
5. Retirer le fallback `'dev-insecure-change-me'` dans [admin.module.ts:279](applications/backend/src/presentation/admin/admin.module.ts#L279) — crasher si `JWT_SECRET` absent.
6. Mettre en place une CI GitHub Actions (lint + test + build).

### Sprint 2 (deux semaines)
7. Éclater `admin.module.ts` en `AdminCampaignsModule`, `AdminCoachesModule`, `AdminCompaniesModule`, `AdminParticipantsModule`, `AdminResponsesModule`.
8. Dédupliquer la palette de couleurs : tout passer par le theme MUI.
9. Extraire `PeerScore`, `ScoreRow`, `EcartView`, `DimensionView` dans un module partagé.
10. Ajouter `@nestjs/swagger` et générer `/api/docs`.
11. Premier batch de tests frontend (5 parcours critiques).

### Sprint 3+ (backlog)
12. Introduire des entités de domaine immutables (respect CLAUDE.md).
13. Setup i18n avec un seul locale pour découpler.
14. Audit a11y avec `axe-core/react`.
15. Refactoriser les routes >300 lignes (extraire view-models).
16. Toast/snackbar global pour feedback.
17. Interface coach (v2) + analyse IA (déjà dans TOTO.md).

---

## 8. Fichiers critiques à retravailler (référence rapide)

- [applications/backend/src/presentation/admin/admin.module.ts](applications/backend/src/presentation/admin/admin.module.ts) — à éclater
- [applications/frontend/src/api/client.ts](applications/frontend/src/api/client.ts) — 401 participant manquant
- [applications/frontend/src/routes/participant/index.tsx](applications/frontend/src/routes/participant/index.tsx) — mocks à retirer
- [applications/frontend/src/routes/participant/profile.tsx](applications/frontend/src/routes/participant/profile.tsx) — mocks à retirer
- [applications/frontend/src/routes/__root.tsx](applications/frontend/src/routes/__root.tsx) — error/404 boundaries à ajouter
- [applications/frontend/src/lib/exportResultsPdf.ts](applications/frontend/src/lib/exportResultsPdf.ts) — types à mutualiser
- [applications/frontend/src/routes/admin/route.tsx](applications/frontend/src/routes/admin/route.tsx) — `COLORS` local à supprimer
- [applications/frontend/src/components/common/colors.ts](applications/frontend/src/components/common/colors.ts) — à supprimer au profit du theme
- [README.md](README.md) — à refaire
- [schema_1_.sql](schema_1_.sql) — à statuer (supprimer ou déplacer)

---

## Vérification end-to-end (si tu implémentes le plan d'action)

- `pnpm lint && pnpm check && pnpm test` doivent passer après chaque sprint.
- Faire tourner `node guard-backend-shared-imports.mjs` manuellement (et l'ajouter à la CI).
- Tester manuellement le parcours participant complet (login → self-rating → peer-feedback → résultats → export PDF).
- Tester manuellement le parcours admin (login → création campagne → import CSV → invitation → consultation réponses → export CSV).
- Vérifier que `/n'importe-quoi` affiche un 404, que couper le backend affiche l'error boundary, et qu'une session expirée côté participant redirige vers `/login`.

---

**Conclusion** : ton projet a des fondations correctes (hexagonal câblé, Drizzle versionné, TanStack bien utilisé, theme MUI propre) mais **traîne de la dette de finition** qui l'empêche d'être production-grade : tests absents, error handling silencieux, mocks résiduels, structure backend qui ne reflète pas l'architecture annoncée, documentation périmée. Rien d'irrécupérable — tout est corrigeable en 2-3 sprints focalisés. La priorité absolue est le **filet de sécurité** (tests + CI + error boundaries + mocks retirés) avant d'empiler de nouvelles features v2.
