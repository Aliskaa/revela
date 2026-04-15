# ADR-003: Cible SOLID/Hexagonal backend >= 9/10

## Status

Accepted

## Date

2026-04-14

## Context

Un audit de `applications/backend/src` met en évidence une base architecturelle saine (couches `domain`, `application`, `interfaces`, `infrastructure`, `presentation`) avec des écarts bloquants pour atteindre un niveau de qualité cible >= 9/10 sur SOLID et architecture hexagonale:

- dépendances directes `application -> infrastructure` (crypto),
- contrats de ports couplés à la technologie de persistence,
- parsing HTTP et formats API présents dans certains use cases,
- interfaces de repository trop larges,
- contrôleurs/modules trop volumineux côté admin.

Le projet a besoin d'une décision explicite pour stabiliser les règles d'architecture, prioriser les refactors, et tracer l'historique des progrès.

## Decision

Le backend adopte la cible suivante, mesurée en continu:

1. **DIP strict en couche application**
   - Aucun import `@src/infrastructure/*` dans `applications/backend/src/application`.
   - Les besoins techniques (hash/verify password, config, signature token, etc.) passent par des ports `interfaces/*`.

2. **Ports indépendants de l'ORM**
   - Aucun type venant de `@aor/drizzle` dans `applications/backend/src/interfaces`.
   - Les contrats exposent des types métier/app locaux.

3. **Frontières transport vs métier explicites**
   - Le parsing `*Raw`, la normalisation query string, et le shape API (`snake_case`) restent en `presentation`.
   - Les use cases manipulent des entrées/sorties métier neutres.

4. **Interface Segregation appliquée**
   - Les interfaces de repository sont découpées par responsabilité (lecture, écriture, analytics, privacy, etc.).
   - Un use case ne dépend que du sous-contrat nécessaire.

5. **Réduction de la taille des points d'entrée**
   - Les contrôleurs et modules admin sont scindés par sous-domaines métier.
   - Les dépendances croisées `presentation -> presentation` sont évitées.

6. **Pilotage qualité obligatoire**
   - Couverture de tests unitaires des use cases critiques.
   - Tableau de bord d'indicateurs d'architecture maintenu et historisé.

## Consequences

- **Positives**
  - Diminution du couplage et meilleure testabilité.
  - Refactors futurs plus sûrs (coût de changement réduit).
  - Frontières hexagonales explicites et vérifiables.
- **Coûts**
  - Refactor incrémental de modules existants (effort court/moyen terme).
  - Mise à jour de tests et de signatures de ports.
  - Besoin d'une discipline de revue systématique sur les imports et contrats.

## Guardrails (règles de revue)

- Rejeter toute PR qui introduit un import infra dans un use case application.
- Rejeter tout nouveau type ORM exposé dans `interfaces`.
- Rejeter tout parsing HTTP ajouté dans `application`.
- Exiger un test unitaire pour tout nouveau use case non trivial.

## Alternatives Considered

- **Ne pas formaliser (guidelines implicites):** rejeté, car les écarts reviennent sans trace décisionnelle.
- **Big-bang refactor complet:** rejeté, trop risqué pour la cadence produit.
- **Cible partielle (uniquement DIP):** rejeté, insuffisant pour atteindre >= 9/10 global.

## References

- [Prospective 9/10 backend SOLID/Hexagonal](../prospective/2026-04-14-DONE-backend-solid-hexagonal-roadmap.md)
- [ADR-002: Session participant unifiée et flux scoppés par campagne](./ADR-002-participant-session-and-campaign-scoped-flows.md)
