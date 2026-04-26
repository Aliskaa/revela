# ADR-004: pnpm workspace + protocol `catalog:` pour les versions

## Status

Accepted

## Date

2026-04-23

## Context

Le monorepo contient deux applications (`backend`, `frontend`) et plus de dix
packages internes. Plusieurs dépendances tierces structurantes (NestJS, Zod,
Vitest, MUI, TanStack Router/Query/Form/Table, etc.) sont consommées par
plusieurs packages.

Sans gouvernance des versions, on observe rapidement des divergences (deux
versions de Zod en parallèle dans le bundle, deux versions de NestJS qui font
exploser la DI au runtime, etc.). Le coût d'une remontée de version devient
linéaire au nombre de packages, et les mises à jour de sécurité (`pnpm
audit`) ne savent plus quoi recommander.

## Decision

1. **pnpm est l'unique gestionnaire de packages** du repo. Aucun `package-lock.json`,
   aucun `yarn.lock`, aucun `bun.lockb`. Le hook `preinstall` peut bloquer
   l'usage de `npm`/`yarn` au besoin.

2. **Toutes les dépendances tierces partagées passent par le protocole `catalog:`** déclaré
   dans [pnpm-workspace.yaml](../../pnpm-workspace.yaml). Exemple :

   ```yaml
   catalog:
     '@nestjs/common': ^11.0.0
     zod: ^4.0.0
     vitest: ^4.1.2
   ```

   Et dans chaque package qui consomme :

   ```json
   "dependencies": {
     "zod": "catalog:"
   }
   ```

3. **Une dépendance qui n'est utilisée qu'une fois** peut rester avec une version
   explicite (ex. `jspdf: "^4.2.1"` dans `applications/frontend`). Si elle finit
   utilisée par un second package, on la promeut au catalog.

4. **`pnpm-workspace.yaml` est l'unique source de vérité pour les versions partagées.** Une PR qui
   change une version doit modifier ce fichier, pas les `package.json`
   individuels.

## Consequences

- **Positives**
  - Une seule version de chaque dépendance partagée dans tout le monorepo,
    vérifiable visuellement.
  - Mises à jour de sécurité centralisées (1 ligne change → tous les packages
    suivent).
  - Plus de divergences silencieuses lors d'un `pnpm install` désynchronisé.
- **Coûts**
  - Tout nouveau collaborateur doit comprendre `catalog:` (rare hors écosystème
    pnpm).
  - L'introduction d'une dépendance dans un seul package nécessite quand même
    de l'ajouter au catalog si on veut bénéficier de la centralisation.

## Guardrails (règles de revue)

- Rejeter toute PR qui introduit une version explicite (`"^x.y.z"`) dans un
  `package.json` pour une dépendance déjà au catalog.
- Rejeter toute PR qui ajoute un `package-lock.json` ou `yarn.lock`.
- Promouvoir au catalog dès qu'une dépendance est consommée par 2 packages.

## References

- [pnpm catalog protocol](https://pnpm.io/catalogs)
- [CLAUDE.md — section Stack technique](../../CLAUDE.md)
