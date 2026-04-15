# ADR-002: Session participant unifiée et flux scoppés par campagne

## Status

Accepted

## Date

2026-04-06

## Context

La V1 impose un parcours participant aligné sur la structure métier `Entreprise -> Campagne -> Questionnaire`, avec une règle explicite: un participant peut être assigné à plusieurs campagnes. Le modèle initial mélangeait des informations de session entre JWT, endpoint `/participant/me`, et résolution implicite du questionnaire/campagne au moment des lectures et soumissions. Ce fonctionnement devenait ambigu dès qu’un même participant était assigné à plusieurs campagnes, en particulier si le même questionnaire était présent dans plusieurs campagnes.

## Decision

1. **Unifier la lecture de session participant**: supprimer `/participant/me` et utiliser `/participant/session` comme endpoint de session principal.
2. **Exposer des assignations multiples**: `/participant/session` retourne un tableau `assignments[]` contenant `campaign_id`, `questionnaire_id`, et la `progression` associée.
3. **Scopper les lectures de matrice par campagne**: `GET /participant/matrix` accepte `campaign_id` (en plus de `qid`) et valide la paire `(campaign_id, questionnaire_id)` contre les assignations du participant.
4. **Scopper les soumissions par campagne**: `POST /participant/questionnaires/:qid/submit` accepte `campaign_id` et refuse les combinaisons non assignées.
5. **Rendre la propagation explicite côté frontend**: la navigation vers `questionnaire/$qid` transporte `campaign_id`, puis ce paramètre est réutilisé pour `/participant/matrix` et `/submit`.
6. **Verrouiller la cohérence d’invitation**: une invitation est liée à une campagne (`invite_tokens.campaign_id`) et sa création vérifie la cohérence campagne/questionnaire.

## Consequences

- **Suppression de l’ambiguïté multi-campagnes**: les données lues et écrites sont résolues sur une assignation explicite.
- **Contrat session plus riche et stable**: le frontend peut piloter l’UI à partir d’un seul endpoint de session.
- **Traçabilité métier améliorée**: réponses et progression restent alignées sur la campagne concernée.
- **Migration frontend nécessaire**: tous les usages de `/participant/me` doivent passer à `/participant/session`.
- **Compatibilité descendante réduite**: les clients historiques qui appelaient `/participant/me` doivent être adaptés.

## Alternatives Considered

- **Conserver `/participant/me` et ajouter `/participant/session` en parallèle long terme**: rejeté, car maintient une dualité de contrats et un risque de divergence.
- **Résolution implicite par “dernière invitation”**: rejeté, car non déterministe en cas d’assignations multiples.
- **Ne scopper que la lecture (`/matrix`) et pas la soumission (`/submit`)**: rejeté, car laisse une ambiguïté critique sur les écritures.

## References

- [Gel du périmètre V1 must-have](../prospective/2026-04-06-DONE-v1-scope-must-have-checklist.md)
- [ADR-001-user-facing-questionnaires-matrix-api.md](./ADR-001-user-facing-questionnaires-matrix-api.md)
