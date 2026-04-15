# Prospective: Trajectoire backend SOLID/Hexagonal vers >= 9/10

**Statut :** DONE  
**Date :** 2026-04-14  
**Décision associée :** [ADR-003](../adr/ADR-003-backend-solid-and-hexagonal-target.md)

## Objectif

Atteindre puis maintenir un score minimum de **9/10** sur SOLID et architecture hexagonale pour `applications/backend/src`, avec un historique de progression traçable.

## Clôture

Cette prospective est clôturée suite à l'atteinte de l'objectif de trajectoire (score >= 9 global et >= 9 par principe SOLID dans l'état courant), avec journal des lots complété.

Le chantier suivant est suivi dans [Prospective: extraction progressive des types/ports/adapters backend vers `@aor/common`](./2026-04-14-NEW-aor-common-backend-shared-extraction.md).

## Point de départ (baseline)

Évaluation initiale (audit statique):

- **S**: 5/10
- **O**: 6/10
- **L**: 5/10
- **I**: 4/10
- **D**: 6/10
- **Hexagonal global**: 6.5/10

## Cibles mesurables (Definition of Done)

1. **DIP**
   - 0 import `@src/infrastructure/*` depuis `application/*`.
2. **Ports**
   - 0 import de types ORM dans `interfaces/*`.
3. **Frontières**
   - 0 parsing HTTP (`*Raw`) dans les use cases applicatifs.
4. **ISP**
   - `IResponsesRepositoryPort` et `IParticipantsRepositoryPort` découpés en sous-ports.
5. **SRP**
   - `admin-management.controller.ts` découpé en contrôleurs spécialisés.
6. **Tests**
   - Couverture unitaire des use cases critiques >= 80% (cible progressive).

## Plan d'exécution

## Lot 1 (Semaine 1-2) - DIP et ports techniques

- Introduire `IPasswordHasherPort` et `IPasswordVerifierPort`.
- Remplacer les imports directs crypto infra dans les use cases admin/participant/invitations.
- Ajouter tests unitaires sur les use cases touchés.

**Résultat attendu:** D +1.5 à +2 points.

## Lot 2 (Semaine 2-3) - Frontières application/presentation

- Déplacer parsing query/body `*Raw` vers DTO/mappers de `presentation`.
- Normaliser les sorties API (`snake_case`) en présentation uniquement.

**Résultat attendu:** S +1 point, Hexagonal +1 point.

## Lot 3 (Semaine 3-5) - Segregation des interfaces

- Découper `IResponsesRepositoryPort` (read/write/export/metrics).
- Découper `IParticipantsRepositoryPort` (identity/invitations/privacy/admin-read).
- Adapter progressivement les use cases aux sous-ports.

**Résultat attendu:** I +3 à +4 points.

## Lot 4 (Semaine 5-7) - Taille des entrypoints admin

- Scinder `admin-management.controller.ts` par sous-domaines.
- Scinder `admin.module.ts` en sous-modules de composition.
- Réduire les dépendances croisées entre modules de présentation.

**Résultat attendu:** S +1.5 à +2 points, O +1 point.

## Lot 5 (Semaine 7-8) - Durcissement qualité

- Compléter les tests use case critiques restants.
- Ajouter un check CI (script) sur imports interdits (application -> infrastructure).
- Valider la matrice de score finale.

**Résultat attendu:** stabilisation >= 9/10.

## Journal d'avancement (historique)

> Mettre à jour cette table à chaque PR de refactor.

| Date | Lot | Changement | KPI impacté | Avant | Après | Référence |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-04-14 | Baseline | Initialisation de la trajectoire et de la grille de mesure | S/O/L/I/D, Hexa | 5/6/5/4/6, 6.5 | - | [ADR-003](../adr/ADR-003-backend-solid-and-hexagonal-target.md) |
| 2026-04-14 | Lot 1 | Ports crypto introduits + suppression imports infra crypto dans les use cases applicatifs ciblés | DIP, D | imports directs présents | imports directs retires (hors specs) | `application/admin/auth`, `application/admin/coaches`, `application/participant`, `application/invitations` |
| 2026-04-14 | Lot 2 (partiel) | Parsing query HTTP déplacé vers `presentation/admin` pour listing/export admin | Frontières, S | parsing `*Raw` dans use cases admin ciblés | use cases reçoivent paramètres normalisés | `admin-management.controller.ts`, `application/admin/responses`, `application/admin/participants` |
| 2026-04-14 | Lot 2 (suite) | Parsing `campaign_id` et `qid` déplacé vers `presentation/participant` et `presentation/admin` pour matrix/submit/reassign | Frontières, S, O | use cases participant/campaign parseaient encore des entrées transport | parsing consolidé en controllers, signatures use case simplifiées | `participant.controller.ts`, `application/participant/*matrix*`, `application/responses/submit-participant-questionnaire.usecase.ts`, `application/admin/campaigns/reassign-admin-campaign-coach.usecase.ts` |
| 2026-04-14 | Lot 3 (responses) | Segmentation du port responses en sous-ports (reader/writer/list/export/metrics) et typage use cases par dépendance minimale | ISP, D, Hexa | interface monolithique unique | dépendances use case affinées + contrat interfaces découplé de Drizzle | `interfaces/responses/IResponsesRepository.port.ts`, `application/admin/*responses*`, `application/responses/*`, `application/invitations/submit-invite-questionnaire.usecase.ts`, `application/admin/dashboard/get-admin-dashboard.usecase.ts` |
| 2026-04-14 | Lot 3 (participants) | Segmentation du port participants en sous-ports (identity/invite-state/participation/admin-read/writer/metrics) et retapage des use cases | ISP, D, Hexa | port participants monolithique utilisé partout | use cases typés par besoin minimal, couplage réduit | `interfaces/participants/IParticipantsRepository.port.ts`, `application/admin/*participants*`, `application/participant/*`, `application/invitations/*`, `application/responses/submit-participant-questionnaire.usecase.ts` |
| 2026-04-14 | Lot 4 (partie 1) | Découpage du contrôleur admin en sous-controllers dédiés responses et participants | S, O, Hexa | `admin-management.controller` centralisait la majorité des endpoints | responsabilités isolées par domaine d'entrée sans changement de routes | `presentation/admin/admin-responses.controller.ts`, `presentation/admin/admin-participants.controller.ts`, `presentation/admin/admin-management.controller.ts`, `presentation/admin/admin.module.ts` |
| 2026-04-14 | Lot 4 (partie 2) | Extraction des endpoints companies/coaches/campaigns dans des controllers dédiés, `admin-management` réduit au noyau dashboard/mail | S, O, Hexa | contrôleur admin encore multi-domaines | séparation complète par sous-domaine d'entrée, surface de responsabilité réduite | `presentation/admin/admin-companies.controller.ts`, `presentation/admin/admin-coaches.controller.ts`, `presentation/admin/admin-campaigns.controller.ts`, `presentation/admin/admin-management.controller.ts`, `presentation/admin/admin.module.ts` |
| 2026-04-14 | Lot 5 (partie 1) | Segmentation des ports `campaigns`, `invitations`, `coaches`, `companies` en sous-contrats read/write et retapage des use cases | ISP, L, D | ports restants majoritairement monolithiques | dépendances affinées par use case, contrats explicites, substituabilité améliorée | `interfaces/campaigns/ICampaignsRepository.port.ts`, `interfaces/invitations/IInvitationsRepository.port.ts`, `interfaces/coaches/ICoachesRepository.port.ts`, `interfaces/companies/ICompaniesRepository.port.ts`, `application/admin/*`, `application/invitations/*`, `application/responses/*` |
| 2026-04-14 | Lot 5 (partie 2) | Structuration de la composition DI admin via regroupement de providers par sous-domaine (companies/coaches/campaigns) dans `admin.module` | O, L, D | liste providers monolithique difficile à maintenir | points de composition explicités par groupes, meilleure lisibilité et substituabilité de wiring | `presentation/admin/admin.module.ts` |
| 2026-04-14 | Lot 6 | Finalisation du typage DI en modules `presentation` avec sous-ports minimaux (admin/participant/invitations/responses) | O, I, L, D | factories DI encore typées sur ports agrégés | injection alignée sur besoins minimaux des use cases, couplage composition réduit | `presentation/admin/admin.module.ts`, `presentation/participant/participant.module.ts`, `presentation/invitations/Invitations-public.module.ts`, `presentation/responses/responses.module.ts` |

## KPI de suivi hebdomadaire

- Nombre d'imports interdits `application -> infrastructure`.
- Nombre de ports couplés ORM dans `interfaces`.
- Nombre de use cases contenant des paramètres `*Raw`.
- Taille moyenne des contrôleurs admin (LOC + nombre d'injections).
- Nombre de use cases avec test unitaire dédié.

## Décision différée: package DTO partagé

- **Décision actuelle:** ne pas créer `packages/aor-dto` pendant la refactor SOLID/Hexagonal.
- **Approche retenue pour Lot 2:** DTO de transport et mappers maintenus localement dans `applications/backend/src/presentation/**`.
- **Point de revue:** réévaluer après finalisation de la refactor.
- **Critères de déclenchement d'extraction:** duplication stable des mêmes DTO sur au moins deux contextes
  (backend + frontend ou backend + autre service), coût de maintenance local jugé significatif.

## Risques et mitigation

- **Risque:** refactor transverse trop large.  
  **Mitigation:** travailler par lots atomiques et testés.
- **Risque:** régression fonctionnelle admin.  
  **Mitigation:** prioriser tests des use cases critiques avant découpage modules.
- **Risque:** dérive de conventions.  
  **Mitigation:** garde-fous de revue définis dans [ADR-003](../adr/ADR-003-backend-solid-and-hexagonal-target.md).
