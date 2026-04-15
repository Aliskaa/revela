# Prospective: extraction progressive des types/ports/adapters backend vers `@aor/common`

**Statut :** DONE  
**Date :** 2026-04-14  
**Prospective précédente :** [Trajectoire backend SOLID/Hexagonal vers >= 9/10](./2026-04-14-DONE-backend-solid-hexagonal-roadmap.md)

## Objectif

Déplacer de manière incrémentale les éléments backend réutilisables vers `packages/aor-common` afin de maximiser la réutilisation frontend/backend sans dégrader les frontières hexagonales ni coupler le package commun à NestJS ou à la persistence applicative.

## Périmètre

### Inclus

- Types métiers transverses et stables.
- Ports applicatifs réutilisables (interfaces agnostiques framework).
- Adapters techniques génériques non couplés à la DB applicative.
- Utilitaires purs partagés (normalisation, mapping agnostique, sécurité hors wiring Nest).

### Exclus

- Controllers/modules/guards/filters Nest.
- Wiring DI applicatif (`*.module.ts`).
- Repositories Drizzle concrets et détails SQL.
- Contrats HTTP spécifiques à un seul endpoint backend.

## Critères d'éligibilité (gating)

Un fichier est extractible vers `@aor/common` seulement si les 3 conditions sont vraies:

1. **Réutilisation réelle**: utile à au moins 2 consommateurs (backend + frontend, ou backend + autre package/app).
2. **Neutralité runtime**: aucun import Nest/Express/Drizzle local app.
3. **Stabilité de contrat**: vocabulaire métier stable, faible churn.

## Plan d'exécution

### État actuel des lots

- **Lot A:** terminé.
- **Lot B:** terminé.
- **Lot C:** terminé (adapters techniques partagés extraits et consommés depuis packages).
- **Lot D:** terminé.
- **Lot E:** terminé (garde-fous CI activés via `pnpm lint`).

## Lot A - Inventaire et classification

- Cataloguer `applications/backend/src/interfaces/**`, `domain/**`, `infrastructure/crypto/**`, `application/**` utilitaires.
- Classer par statut: `extract-now`, `keep-local`, `needs-adapter`.
- Produire une matrice `source -> cible package -> risques`.

### Résultat Lot A (2026-04-14)

#### Inventaire synthétique

- `interfaces/**`: 13 ports/fichiers recensés.
- `domain/**`: 9 fichiers recensés.
- `infrastructure/crypto/**`: 2 fichiers runtime + 1 test.
- `application/**` utilitaires: 7 fichiers recensés (hors `*.usecase.ts`).

#### Classification (gating appliqué)

| Zone | Élément(s) | Statut | Justification gating |
| --- | --- | --- | --- |
| interfaces/security | `IPasswordHasher.port`, `IPasswordVerifier.port` | `done` | Extraits vers `@aor/ports`; façades backend supprimées après migration complète des imports. |
| infrastructure/crypto | `scrypt-password.ts` | `done` | Extrait vers `@aor/adapters`; façade backend supprimée après migration complète (prod + tests). |
| infrastructure/crypto | `scrypt-password.adapter.ts` | `done` | Extrait vers `@aor/adapters` et injecté directement dans les modules Nest backend. |
| interfaces/scoring | `ICalculateScoringUseCase.port` | `done` | Extrait vers `@aor/ports`; fichier backend supprimé après migration complète des imports. |
| interfaces/scoring | `IScorePersistence.port` | `done` | Extrait vers `@aor/ports`; symbole DI et contrat conservés, fichier backend supprimé après migration complète. |
| interfaces/admin + participant + invitations | `IAdminTokenSigner.port`, `IParticipantJwtSigner.port`, `IMail.port`, `IInviteUrlConfig.port`, `IAdminAuthConfig.port`, `ICutoverStrategyConfig.port` | `keep-local` | Contrats orientés use cases backend et politique d'auth/config locale. |
| interfaces/* repository | `ICompaniesRepository.port`, `ICoachesRepository.port`, `ICampaignsRepository.port`, `IParticipantsRepository.port`, `IResponsesRepository.port`, `IInvitationsRepository.port`, `IInviteActivationWrite.port` | `keep-local` | Fort couplage modèle persistance/requêtage backend (types records DB, pagination locale, invariants transactionnels). |
| domain/admin | `invitation-token-status.ts` | `done` | Extrait vers `@aor/domain`; façade backend supprimée après migration complète des consommateurs. |
| domain/admin | `admin-dashboard-snapshot.ts`, `admin-login-result.ts` | `done` | Extraits vers `@aor/domain`; fichiers backend supprimés après migration des use cases/presenters. |
| domain/errors | `admin.errors.ts`, `participant-*.errors.ts`, `invitations.errors.ts`, `responses.errors.ts`, `questionnaires.errors.ts` | `keep-local` | Couplage explicite au mapping HTTP et messages/backward-compat de l'API backend. |
| application/responses | `submission-validation.ts` | `done` | Extrait vers `@aor/domain`; façade backend supprimée, contrat local strict sans dépendance `@aor/questionnaires`. |
| application/responses | `peer-rating-stored-label.ts` | `done` | Extrait vers `@aor/domain`; façade backend supprimée après migration complète des use cases. |
| application/responses | `response-serialization.ts` | `keep-local` | Sémantique de shape API HTTP backend (`snake_case`, champs endpoint spécifiques). |
| application/admin/responses | `csv-datetime.format.ts` | `done` | Extrait vers `@aor/utils`; façade backend supprimée après migration complète des exports CSV. |
| application/admin/participants | `import-participants-csv.parse.ts` | `done` | Extrait vers `@aor/utils`; façade backend supprimée après migration complète des importeurs CSV. |
| application/admin/responses | `admin-csv-export.ts` | `keep-local` | Type contractuel strictement application backend (retour use case HTTP). |
| application/scoring/testing | `parity.fixtures.ts` | `keep-local` | Donnée de test de non-régression backend, non destinée au runtime partagé. |

#### Matrice source -> cible package -> risques

| Source | Cible package proposée | Risques principaux |
| --- | --- | --- |
| `interfaces/security/IPasswordHasher.port.ts` | `packages/aor-common/ports` (security) | Collision de naming avec symboles DI; clarifier convention `PORT_SYMBOL` backend-only. |
| `interfaces/security/IPasswordVerifier.port.ts` | `packages/aor-common/ports` (security) | Risque de dépendance involontaire aux flows legacy; documenter `verifyOrPlaintextLegacy`. |
| `infrastructure/crypto/scrypt-password.ts` | `packages/aor-common/adapters` (crypto) | Contrat de hash à figer (`scrypt1$...`) pour éviter rupture inter-apps. |
| `domain/admin/invitation-token-status.ts` | `packages/aor-common/domain` (admin/rules) | Ambiguïté timezone/horloge (`Date.now`) entre environnements. |
| `application/responses/peer-rating-stored-label.ts` | `packages/aor-common/domain` (responses/rules) | Format persisté `pid:{id}\|{label}` versionné et partagé; surveiller les impacts de compatibilité. |
| `application/admin/responses/csv-datetime.format.ts` | `packages/aor-common/utils` (formatting/date) | Nom trompeur (`French`) vs format ISO-like; renommer avant exposition publique. |
| `application/responses/submission-validation.ts` | `packages/aor-common/domain` (responses/validation) | Dépendance au modèle catalogue actuel; stabiliser l'interface d'entrée inter-packages. |
| `application/admin/participants/import-participants-csv.parse.ts` | `packages/aor-common/utils` (csv) | Couplage Node `Buffer`; prévoir API string + helper Node séparé. |

#### File de priorité Lot B (proposition)

1. `interfaces/security/IPasswordHasher.port.ts` + `interfaces/security/IPasswordVerifier.port.ts`
2. `infrastructure/crypto/scrypt-password.ts`
3. `domain/admin/invitation-token-status.ts`
4. `application/responses/peer-rating-stored-label.ts`
5. `application/admin/responses/csv-datetime.format.ts`

#### Note d'architecture: faut-il créer `@aor/di` pour les symboles ?

Constat actuel: certains tokens DI (`*_PORT_SYMBOL`) sont désormais dans `@aor/ports`, alors que d'autres restent dans le backend.

- **Option A - statu quo (recommandé court terme):** garder les symboles au plus près de leurs contrats (ports partagés -> `@aor/ports`, ports locaux -> backend).  
  **Intérêt:** migration incrémentale, pas de package supplémentaire, ownership clair.
- **Option B - package `@aor/di`:** centraliser tous les tokens DI dans un package dédié.  
  **Intérêt:** point d'entrée unique pour les symboles; **risque:** couplage artificiel et package "poubelle" transversal sans logique métier.

Décision proposée pour ce chantier: **ne pas créer `@aor/di` maintenant**; réévaluer si >20 tokens partagés inter-apps apparaissent ou si des collisions de noms se multiplient.

#### Décision de boundary DI (validée)

- `@aor/ports` contient les **ports** et leurs `*_PORT_SYMBOL`.
- Les symboles de **use cases** (orchestration applicative Nest) restent **locaux** à `applications/backend/src/presentation/**/**.tokens.ts`.
- Cette séparation évite de coupler le package de contrats partagés au wiring applicatif backend.

## Lot B - Extraction low-risk (types + ports purs)

- Extraire les types/ports les plus stables vers `packages/aor-common`.
- Ajouter exports publics explicites et conventions d'import.
- Conserver des façades locales temporaires côté backend pour migration douce.

## Lot C - Extraction adapters techniques partagés

- Déplacer adapters/utilitaires techniques agnostiques.
- Vérifier l'absence de dépendances applicatives indirectes.
- Maintenir des tests de non-régression côté backend.

## Lot D - Migration des consommateurs

- Remplacer imports backend vers `@aor/common`.
- Introduire la consommation frontend ciblée (sur besoins réels).
- Supprimer les doublons locaux devenus obsolètes.

## Lot E - Nettoyage et verrouillage

- Nettoyer alias/exports legacy.
- Ajouter garde-fous CI (règles d'import interdites backend -> packages inversés).
- Clôturer la prospective avec état final et ADR si nécessaire.

### Avancement Lot E (2026-04-14)

- Garde-fou implémenté: script racine `guard-backend-shared-imports.mjs` qui échoue si `applications/backend/src/**` réintroduit un import legacy des fichiers extraits.
- Intégration CI: le script est exécuté systématiquement via `pnpm lint` (`guard:backend-shared-imports` avant le lint workspace).
- Portée couverte: anciens chemins backend supprimés lors des lots B/C/D (ports sécurité/scoring, adapters crypto/scoring, règles domaine et utilitaires CSV/date).
- Décision de clôture: verrouillage conservé via la chaîne lint existante, sans workflow CI dédié additionnel.

## Journal d'avancement (historique)

| Date | Lot | Changement | KPI impacté | Avant | Après | Référence |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-04-14 | Baseline | Ouverture du chantier d'extraction `@aor/common` | Mutualisation, maintenabilité | éléments partagés dispersés | plan d'extraction défini | [Trajectoire backend SOLID/Hexagonal](./2026-04-14-DONE-backend-solid-hexagonal-roadmap.md) |
| 2026-04-14 | Lot A | Inventaire + classification `extract-now/keep-local/needs-adapter` et matrice de risques | éléments migrés, imports locaux résiduels | candidats non priorisés | backlog Lot B priorisé sur 5 extractions low-risk | [Cette prospective](./2026-04-14-NEW-aor-common-backend-shared-extraction.md) |
| 2026-04-14 | Lot B | Création de `@aor/ports` et migration `IPasswordHasher`/`IPasswordVerifier` (avec façades backend temporaires) | éléments migrés, imports locaux résiduels | ports sécurité localisés dans backend | ports sécurité publiés dans package commun | [Cette prospective](./2026-04-14-NEW-aor-common-backend-shared-extraction.md) |
| 2026-04-14 | Lot B | Extraction `scrypt-password` vers `@aor/adapters` avec re-export backend temporaire | éléments migrés, imports locaux résiduels | implémentation crypto uniquement backend | implémentation crypto mutualisée dans package commun | [Cette prospective](./2026-04-14-NEW-aor-common-backend-shared-extraction.md) |
| 2026-04-14 | Lot B | Extraction `invitation-token-admin-status` vers `@aor/domain` (phase intermédiaire via `@aor/types`, puis reclassification) | éléments migrés, imports locaux résiduels | règle métier locale backend | règle métier partagée via package domaine | [Cette prospective](./2026-04-14-NEW-aor-common-backend-shared-extraction.md) |
| 2026-04-14 | Lot B | Extraction `peer-rating-stored-label` vers `@aor/domain` (phase intermédiaire via `@aor/types`, puis reclassification) | éléments migrés, imports locaux résiduels | utilitaire de label local backend | utilitaire de label partagé via package domaine | [Cette prospective](./2026-04-14-NEW-aor-common-backend-shared-extraction.md) |
| 2026-04-14 | Lot B | Reclassification `types` -> `domain` pour `invitation-token-status` et `peer-rating-stored-label` + règle de taxonomie | éléments migrés, imports locaux résiduels | fonctions métier publiées dans `@aor/types` | fonctions métier publiées dans `@aor/domain` | [Cette prospective](./2026-04-14-NEW-aor-common-backend-shared-extraction.md) |
| 2026-04-14 | Lot B | Extraction `csv-datetime.format` vers `@aor/utils` (phase intermédiaire via `@aor/adapters`, puis reclassification) | éléments migrés, imports locaux résiduels | formatage date local backend | formatage date partagé via package utilitaire commun | [Cette prospective](./2026-04-14-NEW-aor-common-backend-shared-extraction.md) |
| 2026-04-14 | Lot B | Extraction `submission-validation` vers `@aor/domain` et migration des flows de soumission | éléments migrés, imports locaux résiduels | validation localisée dans backend | validation métier partagée via package domaine | [Cette prospective](./2026-04-14-NEW-aor-common-backend-shared-extraction.md) |
| 2026-04-14 | Lot B | Extraction `parseSemicolonCsv` vers `@aor/utils` (phase intermédiaire via `@aor/adapters`, puis reclassification) | éléments migrés, imports locaux résiduels | parsing CSV local backend | parsing CSV partagé via package utilitaire | [Cette prospective](./2026-04-14-NEW-aor-common-backend-shared-extraction.md) |
| 2026-04-14 | Lot D | Suppression des façades backend devenues inutiles (`security ports`, `scrypt-password`, `invitation-token-status`, `peer-rating`, `csv-datetime`, `csv-parse`) | imports locaux résiduels | façades temporaires encore présentes | imports directs vers packages partagés uniquement | [Cette prospective](./2026-04-14-NEW-aor-common-backend-shared-extraction.md) |
| 2026-04-14 | Lot D | Durcissement hexa: `@aor/domain` découplé de `@aor/questionnaires` via contrat local `SubmissionValidationQuestionnaire` | violations de dépendance | dépendance inter-package domaine non nécessaire | domaine partagé autonome sur ses abstractions | [Cette prospective](./2026-04-14-NEW-aor-common-backend-shared-extraction.md) |
| 2026-04-14 | Lot C | Extraction `ScryptPasswordAdapter` vers `@aor/adapters` et suppression de l'implémentation backend locale | éléments migrés, imports locaux résiduels | adapter crypto local dans backend | adapter crypto partagé et réutilisable cross-app | [Cette prospective](./2026-04-14-NEW-aor-common-backend-shared-extraction.md) |
| 2026-04-14 | Lot C | Reclassification utilitaires purs vers `@aor/utils` (`date-format`, `parseSemicolonCsv`) | éléments migrés, imports locaux résiduels | utilitaires mélangés aux adapters | séparation explicite adapters vs utils | [Cette prospective](./2026-04-14-NEW-aor-common-backend-shared-extraction.md) |
| 2026-04-14 | Lot C | Extraction du logger partagé vers `@aor/logger` (`console-logger`) et migration backend | éléments migrés, imports locaux résiduels | logger mélangé aux adapters | package logger dédié et frontière plus claire | [Cette prospective](./2026-04-14-NEW-aor-common-backend-shared-extraction.md) |
| 2026-04-14 | Lot C | Extraction `ICalculateScoringUseCasePort` vers `@aor/ports` + extraction `AdminDashboardSnapshot`/`AdminLoginResult` vers `@aor/domain` | éléments migrés, imports locaux résiduels | contrats/objets admin-scoring locaux backend | contrats/objets partagés avec suppression des duplicats backend | [Cette prospective](./2026-04-14-NEW-aor-common-backend-shared-extraction.md) |
| 2026-04-14 | Lot C | Extraction `IScorePersistencePort` vers `@aor/ports` et suppression du contrat backend dupliqué | éléments migrés, imports locaux résiduels | contrat de persistence scoring local backend | contrat scoring centralisé dans package ports | [Cette prospective](./2026-04-14-NEW-aor-common-backend-shared-extraction.md) |
| 2026-04-14 | Lot C | Extraction `NoopScorePersistenceAdapter` vers `@aor/adapters` et suppression de l'implémentation backend locale | éléments migrés, imports locaux résiduels | adapter scoring no-op local backend | adapter scoring no-op partagé et réutilisable | [Cette prospective](./2026-04-14-NEW-aor-common-backend-shared-extraction.md) |
| 2026-04-14 | Lot C | Clôture du lot: plus de références backend aux anciens chemins locaux extraits | imports locaux résiduels | références mixtes package/local | import unique vers packages partagés pour les éléments migrés | [Cette prospective](./2026-04-14-NEW-aor-common-backend-shared-extraction.md) |
| 2026-04-14 | Lot E | Ajout du garde-fou `guard-backend-shared-imports` et intégration dans `pnpm lint` | violations de dépendance | aucune prévention automatique contre la réintroduction d'imports legacy | contrôle bloquant exécuté sur lint local/CI | [Cette prospective](./2026-04-14-NEW-aor-common-backend-shared-extraction.md) |
| 2026-04-14 | Lot E | Clôture du lot: verrouillage validé via `lint` (sans workflow CI dédié) | violations de dépendance | lot en cours avec stratégie CI à arbitrer | lot clôturé avec garde-fou intégré au pipeline lint existant | [Cette prospective](./2026-04-14-NEW-aor-common-backend-shared-extraction.md) |

## KPI de suivi

- Nombre d'éléments migrés vers `@aor/common` (types/ports/adapters).
- Nombre d'imports backend encore locaux pour des éléments classés `extract-now`.
- Nombre de consommateurs frontend de contrats issus de `@aor/common`.
- Nombre de violations des règles de dépendance (CI).

## Risques et mitigation

- **Risque:** déplacer trop tôt des contrats instables.  
  **Mitigation:** appliquer strictement le gating d'éligibilité.
- **Risque:** couplage involontaire de `@aor/common` à Nest/DB.  
  **Mitigation:** revue systématique des imports + contrôle CI.
- **Risque:** migration massive difficile à relire.  
  **Mitigation:** lots courts, atomiques, avec validation typecheck/tests à chaque lot.
