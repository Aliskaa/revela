# CLAUDE.md — Questionnaire Platform

## Langue

- Toute la documentation doit être rédigée en français.
- Le code (noms de variables, fonctions, types, commentaires inline) reste en anglais.

## Stack technique

- **Monorepo** pnpm workspace (`applications/` + `packages/`)
- **Backend** : NestJS, architecture hexagonale (Ports & Adapters), CQRS sans Event Sourcing
- **Frontend** : React, TypeScript, composants fonctionnels + hooks
- **Build** : Vite
- **Tests** : Vitest (jamais Jest)
- **Lint/Format** : BiomeJS uniquement (pas d'ESLint, pas de Prettier)
- **Modules** : ESM uniquement, pas de CommonJS
- **Validation** : Zod v4 (pas Zod v3 — voir section Zod ci-dessous)
- **Package manager** : pnpm exclusivement (pas npm, pas yarn)
- **Versions** : centralisées dans `pnpm-workspace.yaml` via le protocole `catalog:`

## Conventions de code

### TypeScript

- Typage strict, types explicites aux frontières.
- Préférer `type` à `interface`. Utiliser `interface` uniquement quand c'est nécessaire (declaration merging, class contracts).
- Les interfaces commencent par `I` (ex: `IUserRepositoryPort`).
- Les DTOs se terminent par `Dto` (ex: `CreateCiCommandDto`).
- Préférer les arrow functions.
- Pas de commentaires dans le corps des fonctions sauf si la logique n'est pas évidente.
- Toujours utiliser `const` sauf si réassignation nécessaire.
- Toujours utiliser des accolades pour `if`/`else`/`for`/`while`.
- Égalité stricte `===` / `!==` uniquement.

### Formatage (BiomeJS)

- Indentation : espaces, largeur 4
- Fin de ligne : LF
- Largeur de ligne : 120 caractères
- Guillemets simples `'`
- Points-virgules : toujours
- Virgules finales : ES5
- Parenthèses arrow functions : omises pour un seul paramètre

### Zod v4

Zod v4 a changé l'API des validateurs de format string :

```ts
// v4 (correct)          // v3 (interdit)
z.uuid()                 // z.string().uuid()
z.email()                // z.string().email()
z.url()                  // z.string().url()
z.iso.datetime()         // z.string().datetime()
z.iso.date()             // z.string().date()
z.iso.time()             // z.string().time()
```

`z.string()` sans format reste valide.

## Architecture

### Principes

- SOLID (SRP, OCP, LSP, ISP, DIP)
- Architecture hexagonale (Ports & Adapters)
- CQRS : séparation commande/query, sans Event Sourcing
- Entités write-side immutables (`Object.freeze(this)` en fin de constructeur privé)

### Structure monorepo

```
applications/         # Apps exécutables (backend, frontend)
packages/             # Librairies réutilisables
  {bc}/types/         # Schemas Zod, types TS, DTOs
  {bc}/write/         # Write-side
  {bc}/read/          # Read-side
  {bc}/core/          # (optionnel) logique partagée intra-BC
  aor-common/         # Packages transverses (@aor/types, @aor/domain, @aor/adapters, @aor/utils, @aor/ports, @aor/logger)
  integration/        # Seul package non-app autorisé à importer depuis plusieurs BCs
```

### Règles de dépendances

- `applications/` peut importer depuis `packages/`
- `packages/` ne doit jamais importer depuis `applications/`
- Les packages d'un BC ne doivent pas importer depuis un autre BC directement
- La composition cross-BC passe par `@aor/integration` ou les applications
- `@aor/types` : uniquement schemas Zod + types inférés + DTOs
- `@aor/domain` : logique métier partagée pure
- `@aor/adapters` : implémentations d'adaptateurs partagés
- `@aor/utils` : utilitaires purs (date, string, parsing)

### Imports

- **Intra-package** : toujours importer depuis le fichier source réel, jamais depuis un barrel `index.ts`
- **Cross-package** : importer depuis l'entry-point du package (le barrel)
- Utiliser l'alias `@src/*` pour les imports internes dans le backend

### Barrel index

- Chaque dossier contenant des `.ts` doit avoir un `index.ts` qui réexporte tous les symboles publics.
- Exclure `__tests__/` des barrels.
- Quand on crée/déplace un fichier, mettre à jour les barrels correspondants.

## Backend NestJS

### Structure module

```
modules/<feature>/
├── application/usecases/
├── domain/entities/, ports/, tokens.ts
├── infrastructure/adapters/, dto/
├── <feature>.controller.ts
└── <feature>.module.ts
```

### Règles

- Controllers = input adapters uniquement, appellent les use cases, pas de logique conditionnelle métier.
- Use cases = orchestration métier.
- Domaine = agnostique infra.
- Fichiers : `<Name>.usecase.ts`, `I*.port.ts`, `*.adapter.ts`
- DI par tokens `Symbol` (`@Inject(MY_SYMBOL)`), jamais par classe concrète ou string.
- Ports groupés dans un paramètre `ports` dans les signatures de méthodes.
- Un use case = un intent métier. Pas de `Save*`, `Manage*`, `*Crud*`.
- CRUD : `getAll`, `get`, `create`, `update`, `delete`.
- Classes abstraites dans un sous-dossier `base/` avec préfixe `A`.

## Frontend React

- Composants fonctionnels + hooks uniquement.
- Typer les props explicitement avec `type`.
- Extraire la logique réutilisable dans des custom hooks (`useSomething`).
- Centraliser les appels API dans des services dédiés.
- Gérer explicitement les états `loading`, `error`, `empty`.

## Tests

- Vitest uniquement, jamais Jest.
- Fichiers : `*.spec.ts` / `*.spec.tsx` dans `src/**/tests/`
- Utiliser `@src/` alias dans les tests.
- Tests isolés et déterministes (`beforeEach` pour reset mocks).
- Tests orientés comportement, pas détails d'implémentation.
- `*.spec.ts` exclus du build TypeScript.

## Commits

Format Conventional Commits, validé par commitlint via hook `commit-msg` :

```
<type>(<scope>): <subject>
```

- Types : `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`, `revert`
- Scope : kebab-case (ex: `identity-access`, `ci-management`)
- Subject : impératif, minuscules, max 72 chars, pas de point final
- Body (optionnel) : expliquer le *pourquoi*, max 100 chars/ligne

## Commandes utiles

```bash
pnpm lint          # Lint BiomeJS
pnpm format        # Format BiomeJS
pnpm check         # Lint + format
pnpm test          # Tests Vitest
pnpm commit        # Commit interactif via czg
```

## Politique de réponse

- Il est acceptable de ne pas savoir. Dire explicitement ce qui est incertain.
- Ne pas inventer de faits, APIs, versions, commandes ou contenus de fichiers.
- Poser des questions de clarification concises uniquement quand nécessaire.

## TOTO List

La liste TOTO du repo est dans `documentations/TOTO.md`. Si un message commence par `TOTO` ou `TODO`, ajouter une entrée dans cette table au lieu de répondre avec un simple rappel.
