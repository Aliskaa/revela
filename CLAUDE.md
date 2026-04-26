# CLAUDE.md — Questionnaire Platform

> **Digest spécifique à Claude Code.** Pour les conventions techniques détaillées
> (architecture, naming, Zod v4, BiomeJS, imports, barrel-index, tests, etc.),
> voir `.cursor/rules/*.mdc` — c'est la source de vérité granulaire et
> path-scoped. Ce fichier ne reprend que ce qui est spécifique à Claude Code
> ou qui change si fréquemment qu'un rappel court vaut la peine.

## Langue

- **Documentation** rédigée en français.
- **Code** (variables, fonctions, types, commentaires inline) en anglais.

## Politique de réponse

- Il est acceptable de ne pas savoir — dire explicitement ce qui est incertain.
- Ne pas inventer de faits, APIs, versions, commandes ou contenus de fichiers.
- Poser des questions de clarification concises uniquement quand nécessaire.

## TOTO list

Tracker du repo : [docs/TOTO.md](docs/TOTO.md). Si un message commence par `TOTO`
ou `TODO`, ajouter une entrée dans cette table **au lieu** de répondre avec un
simple rappel.

## Stack — rappels critiques

Tout est centralisé dans `pnpm-workspace.yaml` (catalog) — voir [ADR-004](docs/adr/ADR-004-pnpm-catalog-versioning.md).

- **pnpm** exclusivement (pas npm, pas yarn).
- **BiomeJS** seul outil lint+format — pas d'ESLint, pas de Prettier (voir
  [ADR-005](docs/adr/ADR-005-biomejs-tooling.md)).
- **Vitest** seul runner de tests — pas de Jest.
- **Zod v4** — `z.uuid()`, `z.email()`, `z.iso.datetime()` (jamais
  `z.string().uuid()`).
- **ESM** uniquement, pas de CommonJS.

## Commandes utiles

```bash
pnpm lint          # Lint BiomeJS
pnpm format        # Format BiomeJS
pnpm check         # Lint + format
pnpm test          # Tests Vitest
pnpm commit        # Commit interactif (Conventional Commits via czg)
```

## Architecture

Les décisions structurantes sont tracées dans [docs/adr/](docs/adr/). En cas de
désaccord entre code et règle, **le code récent fait foi** — ouvrir une PR pour
mettre à jour la règle, ne pas réécrire le code.

## Pour creuser

- [.cursor/rules/](.cursor/rules/) — 29 fichiers `.mdc` path-scoped (conventions code/test/import/zod/etc.)
- [docs/adr/](docs/adr/) — 7 ADRs (architecture hexagonale, CQRS, catalog, BiomeJS, toast hooks, useDrawerForm, etc.)
- [docs/](docs/) — fixtures, archive, avancement
