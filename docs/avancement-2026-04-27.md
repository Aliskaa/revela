# État d'avancement — Questionnaire Platform (Révéla / AOR)

> Rapport au **2026-04-27**, suite directe de [avancement-2026-04-26.md](avancement-2026-04-26.md).
> Cette session démarre par un **audit de l'architecture backend** (la couche `applications/backend/src`)
> et propose une décision structurelle de migration vers feature-first
> (alignement [ADR-003](adr/ADR-003-backend-solid-and-hexagonal-target.md)).
>
> Mise à jour incrémentale : ce fichier est mis à jour à la fin de chaque opération.

---

## TL;DR

Audit de la structure backend → 3 options posées (refonte feature-first complète,
quick wins de naming, pilote sur 1 module). **Décision actée** : on garde
l'architecture actuelle (layer-first + segmentation par acteur) qui fonctionne
bien, et on révise [ADR-003](adr/ADR-003-backend-solid-and-hexagonal-target.md)
en conséquence plutôt que de migrer le code. Cette décision est formalisée dans
le nouveau [ADR-008](adr/ADR-008-backend-layer-first-with-actor-segmentation.md).

**Suivi (même session)** : renommage `participant/` → `participant-session/` sur
les 4 layers (`application/`, `domain/`, `interfaces/`, `presentation/`) +
15 imports mis à jour. L'ambiguïté singulier/pluriel `participant/` (session) vs
`participants/` (collection admin) est levée définitivement. Backend
**12/12 tests** ✅, frontend **45/45 tests** ✅.

---

## 1. Audit de la structure backend

### 1.1 Cartographie actuelle

```
applications/backend/src/
├── application/                       # use cases (1 fichier = 1 intent métier)
│   ├── admin/                         # use cases appelés par les controllers admin
│   │   ├── auth/                      # admin login
│   │   ├── campaigns/                 # CRUD + invitations + import + reassign
│   │   ├── coaches/                   # CRUD coaches
│   │   ├── companies/                 # CRUD companies
│   │   ├── dashboard/                 # snapshot tableau de bord
│   │   ├── mail/                      # admin mail status
│   │   ├── participants/              # list, erase RGPD, import CSV, invite, list-tokens
│   │   └── responses/                 # list, delete, export CSV (clair + anonymisé)
│   ├── invitations/                   # parcours public via token
│   ├── participant/                   # use cases appelés par le controller participant
│   │                                  # (login, get-session, get-matrix, list-peers)
│   ├── questionnaires/                # listing public + admin
│   ├── responses/                     # use cases TRANSVERSES sur Response :
│   │                                  #   submit-participant-questionnaire
│   │                                  #   get-participant-owned-response
│   │                                  #   get-public-response (réutilisé par admin GET)
│   │                                  #   response-serialization (helper)
│   └── scoring/                       # moteur de scoring + testing/
│
├── domain/                            # entités, errors, ports métier purs
│   ├── admin/
│   ├── campaigns/
│   ├── coaches/
│   ├── companies/
│   ├── invitations/
│   ├── participant/                   # ⚠ SINGULIER : participant côté login/session
│   ├── participants/                  # ⚠ PLURIEL  : participants côté admin (collection)
│   ├── questionnaires/
│   └── responses/
│
├── infrastructure/                    # adapters concrets (DB, mail)
│   ├── database/
│   │   └── repositories/              # implémentations Drizzle
│   └── mail/
│
├── interfaces/                        # ports (contrats abstraits typés)
│   ├── admin/
│   ├── campaigns/
│   ├── coaches/
│   ├── companies/
│   ├── invitations/
│   ├── participant/                   # ⚠ idem domain : ports pour participant en session
│   ├── participants/                  # ⚠ idem domain : ports pour participants admin
│   └── responses/
│
└── presentation/                      # controllers + Nest modules + filters
    ├── admin/                         # 1 dossier mégaplat avec TOUS les controllers admin
    │                                  # (admin-auth, admin-campaigns, admin-coaches,
    │                                  #  admin-companies, admin-management, admin-participants,
    │                                  #  admin-responses)
    ├── invitations/
    ├── participant/
    ├── questionnaires/
    ├── responses/                     # controller public/participant Responses
    └── scoring/
```

### 1.2 Constats

| # | Constat | Impact |
|---|---|---|
| 1 | **Layer-first au lieu de feature-first** : les 5 dossiers de niveau 1 (`application/`, `domain/`, `interfaces/`, `infrastructure/`, `presentation/`) cassent la *screaming architecture*. Un nouveau dev qui ouvre le projet voit des couches, pas des features. | Pour comprendre tout ce qui se passe sur **Response**, il faut lire 5 dossiers : `domain/responses/`, `application/responses/`, `application/admin/responses/`, `interfaces/responses/`, `presentation/responses/` + `presentation/admin/admin-responses.controller.ts`. |
| 2 | **Segmentation par acteur dans `application/`** : les use cases sont éclatés en `admin/<feature>/` (vue admin) **et** `<feature>/` (vue participant ou transverse) sans naming explicite. | Pas une duplication, mais le code source ne traduit pas l'intention. Et ça crée des passerelles cross-acteur non documentées : le controller admin appelle `GetPublicResponseUseCase` (situé dans `application/responses/`, pas dans `application/admin/responses/`). |
| 3 | **`participant/` (singulier) vs `participants/` (pluriel)** dans `domain/` ET `interfaces/`. | Naming qui force l'inspection du contenu pour comprendre. Singulier = login/session. Pluriel = collection vue par l'admin. C'est une convention non documentée. |
| 4 | **`presentation/admin/` mégaplat** : 7 controllers + autant de modules + filters dans un seul dossier (déjà éclaté en sprint 2 pour les modules, mais les controllers cohabitent). | Lecture moins ciblée que si chaque feature avait son propre `presentation/`. |
| 5 | **`infrastructure/database/repositories/`** mélange tous les repositories (companies, coaches, campaigns, participants, responses, etc.) | Au-delà d'une dizaine de fichiers, navigation pénible. Aussi non aligné avec feature-first. |

### 1.3 Ce qui marche bien (à préserver lors de la migration)

- **DI par tokens Symbol** : aucun couplage par classe concrète, refacto safe.
- **Ports typés agnostiques de l'infra** (les types ORM ne fuitent pas dans `interfaces/`) — ADR-003 respecté sur ce point.
- **Use case = un intent métier** : pas de `Manage*` ou `*Crud*`, naming respecté (`InviteCampaignParticipants`, `EraseParticipantRgpd`, etc.).
- **Guards d'imports** : [guard-backend-shared-imports.mjs](../guard-backend-shared-imports.mjs) bloque déjà les imports legacy.
- **CQRS sans Event Sourcing** : séparation commande/query respectée.

---

## 2. Décisions possibles

### Option A — Refonte feature-first complète

```
applications/backend/src/modules/
├── responses/
│   ├── domain/             (entités + ports + errors)
│   ├── application/
│   │   ├── admin/          (list, delete, export)
│   │   └── participant/    (submit, get-own, get-public)
│   ├── infrastructure/     (adapters Drizzle)
│   └── presentation/       (controllers admin + participant)
├── participants/
├── campaigns/
├── coaches/
├── companies/
├── invitations/
├── questionnaires/
└── scoring/
```

- **Avantages** : alignement parfait avec ADR-003, screaming architecture, les
  "doublons" `admin/X` deviennent des sous-dossiers d'acteur **à l'intérieur** d'un module
  cohérent. Le naming `participant/` vs `participants/` disparaît (un seul module
  `participants/` avec sous-dossiers `application/admin/` et `application/session/`).
- **Coûts** : refacto **massif** (~1-2 sprints), réécriture des paths d'imports sur
  ~60 fichiers, risque de régression sur 12 controllers, gel des features pendant la
  migration.
- **Risque** : pari de 1-2 sprints sans avoir validé que le pattern marche dans ce
  contexte précis.

### Option B — Quick wins de naming uniquement

- Renommer `domain/participant/` et `interfaces/participant/` en `participant-session/`
  (lève l'ambiguïté singulier/pluriel) ;
- Documenter dans un commentaire en tête de chaque dossier `application/admin/<feature>/`
  qu'il contient les use cases servant le controller admin uniquement.

- **Avantages** : effort limité (~0.5 j), zéro risque.
- **Coûts** : ne corrige pas la dispersion layer-first, dette structurelle préservée.

### Option C — Migration pilote sur 1 module *(recommandée)*

- Choisir le module le plus dispersé : **`responses`** (5 dossiers).
- Le migrer **complètement** vers `applications/backend/src/modules/responses/{domain,application,infrastructure,presentation}`.
- Garder le reste du backend tel quel pendant la transition.
- Si la migration valide le pattern, étendre aux autres modules au fil des features
  (chaque PR qui touche un module déclenche sa migration).

- **Avantages** :
  - Valide ADR-003 sur un cas réel et chiffre le coût par module avant de s'engager sur le big-bang.
  - Pendant la migration, l'équipe développe en parallèle sur les modules non-touchés.
  - Le module pilote sert de **template** pour les suivants.
  - Préserve l'historique git via `git mv` (pas de réécriture en bloc).
- **Coûts** :
  - Pendant la transition, **deux conventions cohabitent** dans le repo (une partie
    en feature-first, l'autre layer-first). Lisibilité réduite jusqu'à fin de migration.
  - Demande discipline : si un nouveau use case `responses` est créé pendant la
    migration, il doit aller dans `modules/responses/`, pas dans l'ancien `application/responses/`.

### 2.1 Décision finale (2026-04-27)

**Aucune migration. La structure actuelle (layer-first + segmentation par acteur)
est validée comme architecture officielle.**

Justification :

1. Après plusieurs sprints d'usage et de refacto réussis (drawers extraits sur
   `useDrawerForm`, routes >300L découpées en view-models, page détail
   `/admin/responses/$responseId` ajoutée sans friction), la structure actuelle
   ne bloque pas la productivité.
2. Le coût d'une refonte (~1-2 sprints) n'est pas justifié par un bénéfice métier
   mesurable pour l'utilisateur final.
3. Le mandate `modules/<feature>/{...}` d'ADR-003 §2 n'a jamais été appliqué et
   ne correspond plus à la réalité validée du projet.
4. CLAUDE.md (consolidé le 2026-04-26) inscrit déjà la règle "**le code récent
   fait foi** — ouvrir une PR pour mettre à jour la règle, ne pas réécrire le
   code". On applique exactement cette règle ici.

→ Création de [ADR-008](adr/ADR-008-backend-layer-first-with-actor-segmentation.md)
qui formalise l'architecture actuelle comme standard du projet et **supersede
partiellement** [ADR-003](adr/ADR-003-backend-solid-and-hexagonal-target.md) sur
sa clause "structure physique". Les principes (DIP, ports agnostiques de l'ORM,
ISR, frontières transport/métier, naming use case/port/adapter, pilotage qualité)
**restent en vigueur**.

---

## 3. Actions exécutées (2026-04-27)

| Action | Résultat |
|---|---|
| Création [ADR-008](adr/ADR-008-backend-layer-first-with-actor-segmentation.md) | Documente la structure actuelle comme architecture officielle, formalise les conventions de sous-dossiers (`application/admin/`, `application/participant/`, `application/<feature>/`), résout l'ambiguïté `participant/` vs `participants/` par convention de naming explicite, ajoute un guardrail interdisant la création de `applications/backend/src/modules/`. |
| Mise à jour [ADR-003](adr/ADR-003-backend-solid-and-hexagonal-target.md) | Le **header status** seul est modifié pour signaler `partially superseded by ADR-008` sur la clause structure physique. Le contenu reste inchangé pour préserver l'historique des trajectoires architecturales (cf. règle du [README ADR](adr/README.md) : "on n'édite pas un ADR Accepté pour changer la décision — on en écrit un nouveau qui le remplace"). Les principes SOLID/DIP/ISP/naming d'ADR-003 restent en vigueur. |
| Mise à jour [docs/adr/README.md](adr/README.md) | Index enrichi de l'entrée ADR-008 ; statut d'ADR-003 annoté `Accepted (partially superseded by ADR-008)`. |
| `.cursor/rules/architecture-patterns.instructions.mdc` | Aucune modification — relecture confirme qu'aucune mention de `modules/` n'y figure. La règle ne mandate que les principes (SOLID, hexagonal, CQRS, atomicité, naming) qui restent valables. |
| CLAUDE.md | Aucune modification — la version consolidée du 2026-04-26 dit déjà "le code récent fait foi", et pointe vers `docs/adr/` pour les détails. |

### Conventions actées par ADR-008 (pour référence rapide)

| Cas | Destination |
|---|---|
| Use case appelé exclusivement par un controller admin | `application/admin/<feature>/` |
| Use case appelé exclusivement par le controller participant en session | `application/participant/` |
| Use case réutilisé par plusieurs acteurs (admin + participant + invitation publique) | `application/<feature>/` |
| Entité, error, value-object | `domain/<feature>/` |
| Port (contrat repository ou service) | `interfaces/<feature>/` |
| Adapter Drizzle | `infrastructure/database/repositories/` |
| Adapter mail / autre infra | `infrastructure/<infra>/` |
| Controller HTTP admin | `presentation/admin/<feature>-admin.controller.ts` |
| Controller HTTP participant/public | `presentation/<feature>/<feature>.controller.ts` |

### Naming `participant/` vs `participants/`

- **`participant/` (singulier)** = artifacts pour le **participant en session**
  (login, session, matrix, peers, profile).
- **`participants/` (pluriel)** = artifacts pour la **collection vue par l'admin**
  (list, import CSV, erase RGPD, list-tokens).
- Cette convention est documentée dans ADR-008 §2 et doit être annotée en tête
  d'`index.ts` pour les dossiers concernés (`domain/participant/`,
  `domain/participants/`, `interfaces/participant/`, `interfaces/participants/`).

---

## 4. Reste à faire (hérité de la session précédente)

Voir la section "CE QUI RESTE À FAIRE" dans
[avancement-2026-04-26.md](avancement-2026-04-26.md). Pas de changement
substantiel — la dette de finition (lint résorbé, tests verts à 45/45) est très
faible. La grosse pièce restante est précisément cette migration backend.

Items mineurs déjà identifiés pour plus tard :
- `.cursor/rules/testing-conventions.instructions.mdc` mentionne `src/**/tests/`
  alors que la réalité est colocation `*.spec.ts` à côté du source — alignement à
  faire en PR séparée.
- Coach v2 + analyse IA des résultats (TOTO.md).
- Migration i18n au fil des features (les chaînes restantes sont en dur en français,
  l'infra est en place).

---

## 4. Renommage `participant/` → `participant-session/`

Suite à la formalisation d'ADR-008, l'ambiguïté `participant/` (singulier =
session) vs `participants/` (pluriel = collection admin) a été levée par un
renommage explicite. Le mot composé `participant-session/` est préféré à
`session/` seul pour éviter la polysémie HTTP/JWT (`session` aurait évoqué une
notion d'auth-as-a-service générique alors qu'on parle du domaine Participant
en session).

### Renommages exécutés (`git mv`)

| Avant | Après |
|---|---|
| `applications/backend/src/application/participant/` | `applications/backend/src/application/participant-session/` |
| `applications/backend/src/domain/participant/` | `applications/backend/src/domain/participant-session/` |
| `applications/backend/src/interfaces/participant/` | `applications/backend/src/interfaces/participant-session/` |
| `applications/backend/src/presentation/participant/` | `applications/backend/src/presentation/participant-session/` |

L'historique git est préservé via `git mv`.

### Imports mis à jour

15 fichiers contenant `@src/(application|domain|interfaces|presentation)/participant/`
ont été mis à jour vers `@src/.../participant-session/` via un `sed` ciblé. Aucun
import relatif à modifier (le projet utilise systématiquement l'alias `@src/`).

Fichiers touchés (vue rapide) :
- `applications/backend/src/app/app.module.ts`
- `applications/backend/src/application/invitations/activate-invite-with-password.usecase.{ts,spec.ts}`
- `applications/backend/src/application/participant-session/*.ts` (use cases qui s'auto-référencent)
- `applications/backend/src/presentation/admin/admin-participants.{controller,module}.ts`
- `applications/backend/src/presentation/invitations/Invitations-public.module.ts`
- `applications/backend/src/presentation/participant-session/*.ts` (filters, guards, controller, module)

### Validations

- `pnpm --filter '@aor/backend-api' typecheck` ✅
- `pnpm --filter '@aor/backend-api' test` → **12/12 tests** ✅
- `pnpm --filter '@aor/backend-api' lint` → 4 erreurs pré-existantes (aucune dans
  les fichiers renommés)
- `pnpm --filter '@aor/frontend-app' typecheck` ✅
- `pnpm --filter '@aor/frontend-app' test` → **45/45 tests** ✅

ADR-008 mis à jour pour refléter le renommage : la section §2 ne parle plus
d'une ambiguïté à atténuer par JSDoc mais d'un naming résolu, l'arbre
`Decision §1` est mis à jour avec `participant-session/` partout.

---

## 5. Refonte des layouts (full-width + sidebar fixe + logout unique)

### 5.1 Suppression des contraintes de largeur structurelles

| Fichier | Avant | Après |
|---|---|---|
| [routes/admin/route.tsx](../applications/frontend/src/routes/admin/route.tsx) `AdminShell` | `maxWidth: 1600, mx: 'auto'` | (retiré) — le contenu prend désormais toute la largeur |
| [routes/participant/route.tsx](../applications/frontend/src/routes/participant/route.tsx) `ParticipantShell` | `maxWidth: 1600, mx: 'auto'` | (retiré) |
| [routes/admin/participants/$participantId.matrix.tsx](../applications/frontend/src/routes/admin/participants/$participantId.matrix.tsx) | `maxWidth: 1400, mx: 'auto'` | (retiré) |

**Conservé intentionnellement** : 17 contraintes typographiques `maxWidth: 860/900` sur des `<Typography>` de paragraphes descriptifs. C'est volontaire pour la lisibilité — un paragraphe qui dépasse ~80 caractères/ligne devient inconfortable à lire (règle UX classique).

### 5.2 Sidebar fixe (sans scroll)

Sidebar admin et participant rendues **sticky** sur toute la hauteur du viewport. Quand le contenu principal scrolle, la sidebar reste visible.

```ts
// Avant
sx={{
    width: 280,
    display: { xs: 'none', lg: 'flex' },
    flexDirection: 'column',
    px: 2.5,
    py: 3,
}}

// Après
sx={{
    width: 280,
    flexShrink: 0,
    display: { xs: 'none', lg: 'flex' },
    flexDirection: 'column',
    px: 2.5,
    py: 3,
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflow: 'hidden',
}}
```

`flexShrink: 0` empêche le shrink de la sidebar dans le flex parent ; `overflow: hidden` garantit qu'aucun scroll interne n'apparaît même si la liste de nav dépasse (cas extrême non rencontré ici avec 6 items max).

### 5.3 Déconnexion unique en bas de la sidebar

Auparavant, le bouton **Déconnexion** apparaissait à 2 endroits en desktop :

- En bas de la sidebar (intentionnel) ;
- Dans le `TopBar` (à droite, à côté de la barre de recherche admin / à droite du header participant).

**Suppression de la déconnexion du TopBar** sur les deux routes (admin + participant). Le `TopBar` admin garde la barre de recherche globale ; le `TopBar` participant ne contient plus que le titre + sous-titre.

### 5.4 Bonus : 4 lint errors pré-existantes corrigées

Dans [routes/admin/responses/$responseId.tsx](../applications/frontend/src/routes/admin/responses/$responseId.tsx), 4 occurrences de `noUnusedTemplateLiteral` (template literals `` `...` `` sans interpolation) ont été remplacées par des strings simples. Lint frontend désormais à **0 erreur**.

⚠ **À noter** : `pnpm format` (Biome) a aggressivement converti des template literals **avec** interpolation (`` `#${detail.X}` ``) en strings littérales (`'#${detail.X}'`) — bug de la règle `noUnusedTemplateLiteral` quand un template literal côtoie un autre déjà transformé. Restauration manuelle effectuée. À surveiller lors des futurs `pnpm format`.

### 5.5 Validations

- `pnpm --filter '@aor/frontend-app' typecheck` ✅
- `pnpm --filter '@aor/frontend-app' test` → **45/45 tests** ✅
- `pnpm --filter '@aor/frontend-app' lint` → **0 erreur** ✅

---

## 6. Statut de la session

| Étape | Statut |
|---|---|
| Audit de la structure backend | ✅ |
| Diagnostic + 3 options posées | ✅ |
| **Décision utilisateur : garder l'architecture actuelle** | ✅ |
| Création [ADR-008](adr/ADR-008-backend-layer-first-with-actor-segmentation.md) | ✅ |
| Marquage [ADR-003](adr/ADR-003-backend-solid-and-hexagonal-target.md) en `partially superseded` | ✅ |
| Mise à jour [docs/adr/README.md](adr/README.md) (index + statut) | ✅ |
| Vérification `.cursor/rules` (rien à modifier) | ✅ |
| Renommage `participant/` → `participant-session/` (4 dossiers + 15 imports) | ✅ |
| Layout full-width (3 contraintes structurelles retirées) | ✅ |
| Sidebar fixe non-scrollable (admin + participant) | ✅ |
| Déconnexion unique en bas de la sidebar (suppression du TopBar) | ✅ |
| 4 lint errors pré-existantes corrigées (lint frontend = 0) | ✅ |
