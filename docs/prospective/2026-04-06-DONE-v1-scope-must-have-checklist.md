# Gel du périmètre V1 must-have

**Statut :** DONE  
**Date :** 2026-04-06

## Objectif

Figer le périmètre de livraison V1 pour sécuriser la mise en production initiale et réduire la dérive de scope avant le jalon final.

## Références

- [Plan de reprise V1 jusqu’au 16 avril](../../../.cursor/plans/reprise_v1_structuré_52244be6.plan.md)
- [Analyse d’écart cadrage Révela](../architecture/revela-cadrage-gap-analysis.md)

## Checklist V1 must-have (figée)

### 1) Parcours participant de bout en bout

- [ ] Invitation par lien/token fonctionnelle.
- [ ] Accès participant authentifié selon les règles en vigueur.
- [ ] Saisie complète du questionnaire sans blocage critique.
- [ ] Soumission persistée avec statut de progression cohérent.

### 2) Base métier minimale (campagne/participants/réponses)

- [ ] Campagne obligatoire sur le parcours participant.
- [ ] Mapping participant ↔ campagne stable et requêtable.
- [ ] Réponses enregistrées avec les attributs de soumission attendus.
- [ ] Statuts d’étape participant cohérents de l’invitation à la soumission.

### 3) Vue admin minimale

- [ ] Visualisation de la progression par campagne.
- [ ] Compteurs clés disponibles (volume de réponses, participants en attente, participants complétés).
- [ ] Lecture stable des métriques sans traitement manuel hors application.

### 4) Workflow métier minimal

- [ ] Étapes participant implémentées et respectées côté API/front.
- [ ] Blocage test paramétrable activable/désactivable.

### 5) Qualité minimale

- [ ] Tests backend critiques couverts (soumission, lecture matrice, progression).
- [ ] Smoke tests frontend validés sur le parcours prioritaire.
- [ ] Build et lint au vert sur les applications concernées.

## Hors scope V1 (explicite)

Les éléments ci-dessous ne bloquent pas la release candidate V1 et sont reportés après le 16 avril :

- Back-office avancé (filtres complexes, vues analytiques approfondies, exports enrichis).
- Automatisation complète des campagnes d’invitation (orchestration avancée, relances multi-canaux).
- Optimisations de performance non critiques tant que les parcours V1 restent stables.
- Évolutions UX non bloquantes (améliorations visuelles ou confort hors parcours critique).
- Extension fonctionnelle au-delà des questionnaires et flux déjà cadrés pour V1.

## Règle de décision pour toute nouvelle demande

Une demande est **acceptée en V1** uniquement si elle satisfait les deux conditions :

1. Elle est directement nécessaire pour un item de la checklist must-have.
2. Son absence crée un blocage de parcours participant, d’intégrité de données, ou de pilotage admin minimal.

Sinon, la demande est classée **hors scope V1** et planifiée en lot post-V1.

