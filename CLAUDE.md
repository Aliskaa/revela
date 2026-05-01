# CLAUDE.md - Questionnaire Platform

> Digest specifique aux configurations tierces importees par Cursor.
> Les regles projet dans `.cursor/rules/` et les regles locales dans
> `applications/**/.cursor/rules/` et `packages/**/.cursor/rules/`
> restent la source de verite principale.

## Langue

- Documentation en francais.
- Code, noms de symboles, routes, variables, fonctions et types en anglais.

## Politique de reponse

- Dire explicitement ce qui est incertain.
- Ne pas inventer de faits, APIs, versions, commandes ou contenus de fichiers.
- Poser des questions de clarification concises uniquement quand c'est necessaire.
- En cas de conflit entre une regle et le code recent, le code recent fait foi.
  Mettre a jour la regle ou la documentation plutot que reecrire le code
  pour coller a une convention obsolete.

## TOTO

- Le tracker du repo est `docs/TOTO.md`.
- Modifier ce fichier seulement quand l'utilisateur demande explicitement
  d'ajouter, changer ou cloturer une entree.

## Stack

- `pnpm` uniquement.
- BiomeJS comme seul outil de lint et de format.
- Zod v4 pour les schemas partages.
- ESM par defaut.
- Conserver le runner de tests deja utilise par la zone touchee:
  Vitest pour les applications, `tsx --test` pour `@aor/scoring`.

## Commandes utiles

### Racine

```bash
pnpm lint
pnpm typecheck
pnpm build
```

### Backend

```bash
pnpm --filter @aor/backend-api dev
pnpm --filter @aor/backend-api test
pnpm --filter @aor/backend-api typecheck
```

### Frontend

```bash
pnpm --filter @aor/frontend-app dev
pnpm --filter @aor/frontend-app test
pnpm --filter @aor/frontend-app typecheck
```

## Architecture

- Les decisions structurantes vivent dans `docs/adr/`.
- Le repo utilise une approche hybride:
  - regles transverses a la racine dans `.cursor/rules/`
  - regles de stack au plus pres du code dans les dossiers `.cursor/rules`
    du backend, du frontend et des packages

## Pour creuser

- `.cursor/rules/` et les regles locales imbriquees
- `docs/adr/`
- `docs/`
