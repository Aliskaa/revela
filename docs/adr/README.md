# Architecture Decision Records

Ce dossier contient les **Architecture Decision Records** : les décisions
structurantes qui orientent l'architecture, le stack ou les pratiques de
l'équipe. Le format est inspiré de [Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions),
adapté aux conventions du projet.

## Pourquoi des ADRs ?

Quand on lit le code six mois plus tard, on voit *quoi* — pas *pourquoi*. Un
ADR documente le pourquoi, l'alternative écartée, le contexte du moment. Si
le contexte change, on **n'édite pas un ADR Accepté** ; on en écrit un nouveau
qui le remplace (`Status: Superseded by ADR-XXX`). Cela préserve l'historique
des trajectoires.

## Format minimal

```markdown
# ADR-XXX: Titre court

## Status
Accepted | Proposed | Deprecated | Superseded by ADR-YYY

## Date
YYYY-MM-DD

## Context
Le problème, les contraintes, les forces en présence.

## Decision
Ce qu'on choisit, en une phrase ou un court paragraphe.

## Consequences
Ce qui devient plus simple / plus difficile, ce qu'il faut surveiller.

## Alternatives Considered (optionnel)
Ce qu'on a sérieusement envisagé et pourquoi on ne l'a pas pris.

## References (optionnel)
Liens code, autres ADRs, documents externes.
```

## Index

| ADR | Title | Status | Date |
| --- | --- | --- | --- |
| [ADR-001](./ADR-001-user-facing-questionnaires-matrix-api.md) | User-facing questionnaires and participant score matrix API | Accepted | 2026-04-03 |
| [ADR-002](./ADR-002-participant-session-and-campaign-scoped-flows.md) | Session participant unifiée et flux scoppés par campagne | Accepted | 2026-04-06 |
| [ADR-003](./ADR-003-backend-solid-and-hexagonal-target.md) | Cible SOLID/Hexagonal backend >= 9/10 | Accepted | 2026-04-14 |
| [ADR-004](./ADR-004-pnpm-catalog-versioning.md) | pnpm workspace + protocol `catalog:` pour les versions | Accepted | 2026-04-23 |
| [ADR-005](./ADR-005-biomejs-tooling.md) | BiomeJS comme unique outil de lint et format | Accepted | 2026-04-23 |
| [ADR-006](./ADR-006-toast-emitted-from-mutation-hooks.md) | Toast émis par les hooks de mutation, pas par les routes | Accepted | 2026-04-26 |
| [ADR-007](./ADR-007-use-drawer-form-zod.md) | `useDrawerForm` + Zod pour les formulaires drawer admin | Accepted | 2026-04-26 |
