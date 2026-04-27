# ADR-008: Architecture backend layer-first avec segmentation par acteur

## Status

Accepted — supersedes the structural mandate of [ADR-003](./ADR-003-backend-solid-and-hexagonal-target.md). The SOLID / DIP / ISP / port-naming clauses of ADR-003 remain in force.

## Date

2026-04-27

## Context

[ADR-003](./ADR-003-backend-solid-and-hexagonal-target.md), accepté en avril 2026,
mandatait une organisation **feature-first** :
`modules/<feature>/{application,domain,infrastructure}`. Cette mandate s'inspirait
des conventions DDD strictes et de la *screaming architecture* d'Uncle Bob.

Dans la pratique, le backend a été développé selon une organisation **layer-first
avec segmentation par acteur** :

```
applications/backend/src/
├── application/
│   ├── admin/<feature>/        # use cases servant le controller admin
│   ├── participant/            # use cases servant le controller participant
│   └── <feature>/              # use cases transverses (cross-acteur)
├── domain/<feature>/
├── interfaces/<feature>/
├── infrastructure/{database,mail}/
└── presentation/{admin,participant,...}/
```

Cette divergence entre la règle et la réalité a été pointée dans deux audits
successifs (M-1 dans l'audit initial du 2026-04-23, puis [docs/avancement-2026-04-27.md](../avancement-2026-04-27.md)).
Trois options ont été posées : refonte complète (option A), quick wins de naming
(option B), pilote sur un module (option C).

Après plusieurs sprints d'usage et de refacto réussis (drawers extraits sur
`useDrawerForm`, routes >300L découpées en view-models, page détail
`/admin/responses/$responseId` ajoutée sans friction), l'équipe constate que
**la structure actuelle ne bloque pas la productivité** et que le coût de migration
n'est pas justifié par un bénéfice métier mesurable.

L'ADR-003 reste correct sur les **principes** d'architecture (DIP strict, ports
agnostiques de l'ORM, frontières transport/métier, interface segregation, pilotage
qualité). Seule sa clause sur la **structure physique** est révisée.

## Decision

### 1. Structure physique officielle

Le backend conserve l'organisation suivante, qui est désormais l'architecture
officielle du projet :

```
applications/backend/src/
├── application/                     # use cases (1 fichier = 1 intent métier)
│   ├── admin/<feature>/             # use cases appelés par les controllers admin
│   ├── participant-session/         # use cases appelés par le controller participant
│   │                                # (login, get-session, get-matrix, list-peers)
│   └── <feature>/                   # use cases transverses ou shared cross-acteur
│                                    # (ex. responses/submit-participant-questionnaire,
│                                    #  responses/get-public-response)
│
├── domain/<feature>/                # entités, errors, types métier purs
│   └── participant-session/         # errors d'auth/session du participant connecté
│   └── participants/                # entités de la collection vue par l'admin
│
├── interfaces/<feature>/            # ports (contrats abstraits typés)
│   └── participant-session/         # ports de session (JWT signer, etc.)
│   └── participants/                # ports de la collection admin
│
├── infrastructure/                  # adapters concrets
│   ├── database/repositories/       # implémentations Drizzle
│   └── mail/
│
└── presentation/                    # controllers + Nest modules + filters
    ├── admin/                       # tous les controllers admin (1 par feature),
    │                                # leurs modules et filters associés
    ├── participant-session/         # controller + filters/guards du participant connecté
    ├── invitations/
    ├── questionnaires/
    ├── responses/
    └── scoring/
```

### 2. Conventions de naming explicites

Pour lever les ambiguïtés singulier/pluriel **historiquement** observées dans
`domain/` et `interfaces/` (le singulier `participant/` cohabitait avec le
pluriel `participants/`), le dossier "participant en session" est renommé
explicitement :

- **`participant-session/`** = artifacts pour le **participant en session**
  (login, session, questionnaire matrix, peers). Présent dans `application/`,
  `domain/`, `interfaces/`, `presentation/`.
- **`participants/` (pluriel)** = artifacts pour la **collection vue par l'admin**
  (list, import CSV, erase RGPD, list-tokens). Présent dans `domain/`,
  `interfaces/`, et utilisé par `application/admin/participants/`.
- Tout autre BC (`responses`, `coaches`, `companies`, `campaigns`,
  `invitations`, `questionnaires`) reste au pluriel.

Le mot composé `participant-session` lève l'ambiguïté à la fois singulier/pluriel
(plus de confusion possible avec `participants`) et sémantique (un dossier
`session/` seul aurait évoqué une notion HTTP/JWT générique, ici on parle bien
du **domaine Participant en session**).

L'historique du renommage est tracé dans
[docs/avancement-2026-04-27.md](../avancement-2026-04-27.md).

### 3. Cross-acteur explicite

Un controller admin **peut légitimement** appeler un use case situé dans
`application/<feature>/` (et non `application/admin/<feature>/`) lorsque l'intent
métier est neutre par rapport à l'acteur. Exemple actuel :
`AdminResponsesController` appelle `GetPublicResponseUseCase` (dossier
`application/responses/`) pour afficher le détail d'une réponse côté admin.

Ce pattern est documenté ici comme **accepté**, pas une dette à résorber.

### 4. Règles de placement des nouveaux artifacts

Lors de l'ajout d'un nouveau use case :

| Cas | Destination |
|---|---|
| Use case appelé exclusivement par un controller admin | `application/admin/<feature>/` |
| Use case appelé exclusivement par le controller participant en session | `application/participant-session/` |
| Use case réutilisé par plusieurs acteurs (admin + participant + invitation publique) | `application/<feature>/` |
| Entité, error, value-object | `domain/<feature>/` |
| Port (contrat repository ou service) | `interfaces/<feature>/` |
| Adapter Drizzle | `infrastructure/database/repositories/` |
| Adapter mail / autre infra | `infrastructure/<infra>/` |
| Controller HTTP | `presentation/<acteur>/<feature>-<acteur>.controller.ts` (admin) ou `presentation/<feature>/<feature>.controller.ts` (public/participant) |

### 5. Ce qui reste en vigueur depuis ADR-003

Aucun changement sur les principes :

- DIP strict : aucun import `@src/infrastructure/*` dans `application/`.
- Ports agnostiques de l'ORM : pas de type Drizzle exposé dans `interfaces/`.
- Frontières transport vs métier : parsing HTTP, snake_case API, normalisation
  query string restent dans `presentation/`.
- Interface segregation : ports découpés par responsabilité (lecture, écriture,
  analytics, privacy).
- Naming des artifacts : `<Name>.usecase.ts`, `I*.port.ts`, `*.adapter.ts`,
  classes abstraites en `base/` avec préfixe `A`, DI par tokens `Symbol`.

## Consequences

### Positives

- **Suppression d'une dette fantôme** : la règle reflète enfin la réalité, plus
  l'inverse. Plus de cycles "pourquoi le code ne match pas la règle".
- **Onboarding moins ambigu** : un nouveau dev lit ADR-008 et trouve le code
  exactement comme décrit.
- **Coût de migration évité** : ~1-2 sprints économisés (estimation de l'option
  A dans l'audit du 2026-04-27).
- **Cross-acteur formalisé** : le pattern `controller admin → use case shared`
  est documenté comme accepté, plus une bizarrerie tolérée.

### Coûts assumés

- **Lecture cross-dossier** : pour comprendre tout ce qui se passe sur `Response`,
  il faut continuer à inspecter 5 dossiers (`domain/responses/`,
  `application/responses/`, `application/admin/responses/`, `interfaces/responses/`,
  `presentation/responses/` + `presentation/admin/admin-responses.controller.ts`).
  Atténué par les barrels et la convention de naming.
- **Naming `participant-session/` vs `participants/`** : levé par le renommage
  effectué le 2026-04-27 (cf. décision §2). L'ambiguïté singulier/pluriel
  historique n'existe plus.

## Guardrails (règles de revue)

- Rejeter toute PR qui crée un dossier `applications/backend/src/modules/`
  (vestige de l'ancien mandat ADR-003 §2 supplanté ici).
- Rejeter toute PR qui ajoute un use case dans le mauvais dossier d'acteur
  (ex. use case strictement participant placé dans `application/admin/`).
- Toute nouvelle ambiguïté singulier/pluriel doit être justifiée explicitement
  ou évitée.
- Les guardrails ADR-003 sur DIP / ports / parsing HTTP / ISR / tests
  **restent en vigueur**.

## Alternatives Considered

- **Option A — Refonte feature-first complète** (`modules/<feature>/{...}`) :
  rejetée. Coût ~1-2 sprints, gel des features pendant la migration, risque de
  régression sur 12 controllers, aucun bénéfice métier mesurable pour
  l'utilisateur final.
- **Option C — Pilote sur 1 module** : rejetée. Créerait deux conventions
  cohabitantes dans le repo pendant la transition (lisibilité réduite jusqu'à
  fin de migration), discipline accrue requise sur chaque PR pour respecter
  la frontière, et le bénéfice supposé n'est plus une priorité produit.
- **Édition directe d'ADR-003** pour modifier sa décision : rejetée. Le README
  de [docs/adr/](./README.md) explicite que les ADRs Acceptés ne sont pas
  édités pour changer la décision — ils sont supersedés. Ceci préserve
  l'historique des trajectoires architecturales.

## References

- [ADR-003](./ADR-003-backend-solid-and-hexagonal-target.md) — superseded
  partially par cet ADR (clause structure physique uniquement).
- [docs/avancement-2026-04-27.md](../avancement-2026-04-27.md) — audit qui a
  posé les options et déclenché cette décision.
- [.cursor/rules/architecture-patterns.instructions.mdc](../../.cursor/rules/architecture-patterns.instructions.mdc)
  — règles de naming use case / port / adapter, atomicité CQRS, regroupement
  des ports en `ports`. Toujours en vigueur.
- [audit initial du 2026-04-23](./avancement-2026-04-23.md) — item M-1 où la
  divergence règle/code avait été pointée pour la première fois.
