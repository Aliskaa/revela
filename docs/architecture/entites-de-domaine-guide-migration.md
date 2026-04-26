# Guide de migration — entités de domaine immutables

> Statut : **phase 1 livrée** (Company), phases 2-6 à faire.
> Contexte : CLAUDE.md mandate des « entités write-side immutables (`Object.freeze(this)` en fin de constructeur privé) ». L'audit d'avril 2026 a relevé que le dossier `domain/` ne contenait que des erreurs, aucune entité. Ce guide documente le pattern introduit sur Company et la feuille de route pour les autres.

## Pattern de référence : Company

**Fichiers créés/modifiés lors de la phase 1** :

| Fichier | Rôle |
|---|---|
| `applications/backend/src/domain/companies/company.entity.ts` | Classe immutable avec `private constructor` + `Object.freeze(this)`. Factories `create()` (nouvelle entité, id=0) et `hydrate()` (restauration depuis DB). Méthodes métier `rename()`, `updateContact()` qui retournent de nouvelles instances. |
| `applications/backend/src/domain/companies/companies.errors.ts` | Erreurs métier typées (`CompanyNameRequiredError` hérite de `CompanyDomainError`). |
| `applications/backend/src/domain/companies/index.ts` | Barrel public. |
| `applications/backend/src/interfaces/companies/ICompaniesRepository.port.ts` | Port découpé CQRS : write-side en `Company`, read-side en read-models purs. |
| `applications/backend/src/infrastructure/database/repositories/drizzle-companies.repository.ts` | Adapter Drizzle qui hydrate des instances `Company`. |
| `applications/backend/src/application/admin/companies/*.usecase.ts` | 5 use cases : `create-` et `update-` utilisent l'entité + factories ; `list-/get-/delete-` consomment le read-model. |
| `applications/backend/src/presentation/admin/admin.presenters.ts` | Presenter typé sur le read-model renommé. |

## Principes

### 1. Constructeur privé + freeze

```ts
export class Company {
    private constructor(
        public readonly id: number,
        public readonly name: string,
        // ...
    ) {
        Object.freeze(this);
    }
}
```

Empêche toute mutation directe et forces le passage par `Company.create()` / `Company.hydrate()`.

### 2. Deux factories distinctes

- **`create(props)`** : nouvelle entité, non persistée, `id = 0`, `createdAt = null`. **Applique les invariants métier** (ex. nom non vide) en levant des erreurs de domaine.
- **`hydrate(props)`** : restauration depuis la persistance. **Ne re-valide pas** — ce qui est en DB est présumé valide. À n'utiliser que depuis les adapters (repos).

### 3. Immutabilité par transition

Les méthodes métier (`rename`, `updateContact`, etc.) **retournent une nouvelle instance** au lieu de muter. Chacune peut re-valider ses invariants.

```ts
public rename(newName: string): Company {
    const trimmed = newName.trim();
    if (trimmed.length === 0) {
        throw new CompanyNameRequiredError();
    }
    if (trimmed === this.name) {
        return this;
    }
    return new Company(this.id, trimmed, this.contactName, this.contactEmail, this.createdAt);
}
```

### 4. Split CQRS dans les ports

Le port sépare explicitement :

```ts
export interface ICompaniesWritePort {
    create(company: Company): Promise<Company>;
    save(company: Company): Promise<Company | null>;
    deleteById(id: number): Promise<void>;
}

export interface ICompaniesReadPort {
    findByName(name: string): Promise<Company | null>;          // write-side lookup
    findById(id: number): Promise<Company | null>;              // write-side lookup
    findByIdWithParticipantCount(id: number): Promise<CompanyWithParticipantCountReadModel | null>;
    listOrderedWithParticipantCount(): Promise<CompanyWithParticipantCountReadModel[]>;
}
```

- **`Company` (entité)** : pour les chemins d'écriture (lookup + persistence).
- **Read-models** (suffixe `ReadModel`) : projections enrichies (aggregations, jointures), plat, sans comportement.

### 5. Hydratation côté adapter

Le repo Drizzle contient une fonction pure `hydrateCompany(row) => Company.hydrate(...)` et l'utilise dans tous les `find*` write-side. Les read-models restent des objets plats renvoyés tels quels.

### 6. Use cases pilotent les transitions

```ts
const current = await ports.companies.findById(id);               // entité
const updated = current.rename(newName).updateContact(c, e);     // transitions
const saved = await ports.companies.save(updated);               // persistance
```

### 7. Compatibilité par isomorphie de lecture

L'entité expose **les mêmes champs publics en lecture** que l'ancien DTO (`id`, `name`, `contactName`, `contactEmail`, `createdAt`). Les consommateurs cross-feature qui lisent `company.id` / `company.name` continuent de fonctionner sans changement. Seuls les **consommateurs d'écriture** (ex. appels à `create({ name })`) doivent migrer vers `create(Company.create({ name }))`.

## Checklist de migration pour une nouvelle entité

Pour chaque feature (Coach, Campaign, Participant, Invitation, Response), dans cet ordre :

1. **Créer le dossier domaine**
   - `domain/<feature>/<entity>.entity.ts` — classe immutable, factories, méthodes métier
   - `domain/<feature>/<feature>.errors.ts` — erreurs domaine typées (`XDomainError` base + erreurs spécifiques)
   - `domain/<feature>/index.ts` — barrel

2. **Refactoriser le port** (`interfaces/<feature>/I<Feature>Repository.port.ts`)
   - Les méthodes write-side (`create`, `save`, `delete`) prennent/retournent l'entité.
   - Les méthodes `findBy*` destinées au write-side retournent l'entité.
   - Les read-models (projections, listes enrichies) restent des DTOs plats, suffixés `ReadModel`.

3. **Refactoriser l'adapter Drizzle** (`infrastructure/database/repositories/drizzle-<feature>.repository.ts`)
   - Fonction locale `hydrate<Feature>(row): Entity` utilisant `Entity.hydrate(...)`.
   - Write-side return `hydrate...()` sur le row Drizzle.
   - Read-side continue de retourner des read-models plats.

4. **Refactoriser les use cases**
   - **Create** : `const draft = Entity.create({ ... })` puis `ports.x.create(draft)`.
   - **Update** : `const current = await ports.x.findById(id)` puis `current.methodA(...).methodB(...)` puis `ports.x.save(updated)`.
   - **Get/List** : si returns read-model, aucun changement. Si returns entité, pas besoin de mapper.
   - **Delete** : inchangé (prend un id, pas d'entité).

5. **Mettre à jour le presenter** si renommages de types (adapter le nom `XWithCountReadModel`).

6. **Traquer les consommateurs cross-feature**
   - `grep` sur l'ancien DTO (ex. `CoachRecord`) dans `applications/backend/src`.
   - Pour chaque appel à `ports.<feature>.create(payload)` où `payload` était un DTO plat, remplacer par `ports.<feature>.create(Entity.create(payload))`.
   - Pour chaque appel à `ports.<feature>.update(id, command)` ex-style, remplacer par la séquence `findById` → `.mutations()` → `save`.

7. **Valider**
   - `pnpm --filter @aor/backend-api typecheck`
   - `pnpm --filter @aor/backend-api test`
   - `pnpm --filter @aor/backend-api build && node dist/main.js` — vérifier boot + routes mappées.

## Ordre conseillé des prochaines entités

| # | Entité | Complexité | Blast radius cross-feature | Notes |
|---|---|---|---|---|
| 1 | **Coach** | Faible | Moyen (auth, campaigns) | CRUD + `changePassword(hash)` côté entité. |
| 2 | **Invitation** | Moyenne | Élevé (campaigns, participants, activation) | États : `pending` → `confirmed` → `activated` → `expired`. Machine à états à capturer dans l'entité. |
| 3 | **Participant** | Élevée | Très élevé (tous les flux) | Beaucoup de méthodes : `updateProfile`, `assignToCampaign`, `eraseRgpd` (tombstone), etc. À découper en sous-agrégats si trop gros. |
| 4 | **Campaign** | Élevée | Très élevé | Statuts (`draft`/`active`/`closed`/`archived`), ré-assignation coach, invitations de masse. |
| 5 | **Response** | Moyenne | Élevé (scoring, exports) | Immuable par nature métier (une réponse soumise ne se modifie pas). |

## Ce qui n'est **pas** dans le scope DDD

- **Les DTOs `@aor/types`** (`Company`, `Coach`, etc.) restent les contrats de frontière HTTP/frontend. **Ne pas les renommer** sans coordination avec le frontend.
- **Les read-models** (projections, aggregations) ne sont pas des entités — ce sont des objets de transfert côté read-side CQRS, sans invariants métier.
- **Les schémas Drizzle** restent la source de vérité SQL. L'entité n'est **pas** la table.

## Exemple vivant

Voir [company.entity.ts](../../applications/backend/src/domain/companies/company.entity.ts) + [drizzle-companies.repository.ts](../../applications/backend/src/infrastructure/database/repositories/drizzle-companies.repository.ts) + [create-admin-company.usecase.ts](../../applications/backend/src/application/admin/companies/create-admin-company.usecase.ts) + [update-admin-company.usecase.ts](../../applications/backend/src/application/admin/companies/update-admin-company.usecase.ts).
