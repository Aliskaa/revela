# ADR-005: BiomeJS comme unique outil de lint et format

## Status

Accepted

## Date

2026-04-23

## Context

Historiquement, l'écosystème JS/TS a deux outils distincts pour deux
responsabilités voisines : ESLint (lint sémantique) + Prettier (formatage).
Cette combinaison fonctionne mais a plusieurs coûts récurrents :

- **Performance** : sur un monorepo, `eslint --fix` + `prettier --write` prend
  plusieurs secondes voire plusieurs dizaines.
- **Configuration en double** : règles de formatage potentiellement contradictoires
  entre ESLint et Prettier (résolu par `eslint-config-prettier`, mais source
  régulière de conflits).
- **Maintenance des plugins** : `@typescript-eslint`, `eslint-plugin-react`,
  `eslint-plugin-jsx-a11y`, etc. — peu compatibles avec ESLint 9 flat config au
  démarrage du projet.
- **DX hooks Git** : un `lint-staged` qui doit chaîner deux outils est plus
  lent et plus fragile.

[BiomeJS](https://biomejs.dev/) est un outil unifié écrit en Rust qui couvre lint
+ format dans un seul binaire. Il vise une parité fonctionnelle avec
ESLint/Prettier sur les règles essentielles et offre des performances 10–100x
supérieures.

## Decision

1. **Aucune dépendance ESLint, aucune dépendance Prettier** dans le monorepo. Les
   `eslint*`, `prettier*`, `eslint-config-*` sont interdits dans les
   `package.json`.

2. **BiomeJS est l'unique outil** pour :
   - lint sémantique (`biome check`)
   - format (`biome format`)
   - ordre des imports (`biome check --formatter-enabled=true`)

3. **Configuration unique** dans [biome.json](../../biome.json) à la racine du
   monorepo. Les sous-projets n'ont pas leur propre config.

4. **Scripts npm uniformes** dans chaque `package.json` consommateur :

   ```json
   {
       "scripts": {
           "lint": "biome check .",
           "lint:fix": "biome check --write .",
           "format": "biome format --write ."
       }
   }
   ```

5. **CI** : `pnpm lint` est un step bloquant dans
   [.github/workflows/ci.yml](../../.github/workflows/ci.yml).

## Consequences

- **Positives**
  - Lint+format en <1 seconde sur tout le monorepo.
  - Une seule config, un seul vocabulaire, une seule version à mettre à jour.
  - Hooks git très rapides → adoption naturelle.
- **Coûts**
  - Quelques règles ESLint avancées ne sont pas (encore) couvertes par Biome
    (ex. `react-hooks/exhaustive-deps` est partiel, certains plugins a11y
    avancés). Acceptables : on a `vitest-axe` pour l'a11y (voir ADR-006).
  - Toolchain encore jeune → suivi régulier des changelogs Biome pour
    profiter des règles ajoutées.
  - La règle `lint/a11y/useSemanticElements` est parfois trop stricte (ex.
    `role="status"` sur un `<Stack>` chargement) ; on supprime localement
    avec `// biome-ignore` quand le sens sémantique est correct.

## Guardrails (règles de revue)

- Rejeter toute PR qui ajoute une dépendance `eslint*` ou `prettier*`.
- Rejeter toute PR qui désactive globalement une règle Biome importante (mieux
  vaut un `biome-ignore` ciblé avec justification que de désactiver une règle).
- Toute nouvelle règle activée doit passer en CI sans exceptions massives —
  sinon ouvrir une PR de cleanup avant.

## Alternatives Considered

- **ESLint + Prettier (status quo écosystème)** : rejeté pour la performance et la
  charge de maintenance.
- **Rome (ancêtre de Biome)** : Rome a été abandonné fin 2023 ; Biome est le
  fork maintenu par la communauté. Choix neutre.
- **Oxc / oxlint** : prometteur mais en alpha au démarrage du projet, pas de
  formatter intégré.

## References

- [biome.json](../../biome.json)
- [CLAUDE.md — Lint/Format](../../CLAUDE.md)
