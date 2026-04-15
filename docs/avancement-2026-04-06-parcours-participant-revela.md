# Avancement — Parcours participant Revela (pairs, résultats, progression)

**Date :** 2026-04-06  
**Objet :** Synthèse des correctifs et améliorations réalisés sur le questionnaire Revela (soumissions pairs, navigation vers les résultats, déblocage du test « Élément humain »).

---

## 1. Feedbacks pairs — soumissions B et C bloquées

**Problème :** Après la soumission du pair A, les soumissions B et C échouaient : la vérification de doublon traitait toute réponse `peer_rating` comme unique par sujet / questionnaire / campagne.

**Cause :** Dans [`submit-participant-questionnaire.usecase.ts`](../applications/backend/src/application/responses/submit-participant-questionnaire.usecase.ts), la condition utilisait `existing.some(r => r.submissionKind === 'peer_rating')` sans tenir compte du **libellé du pair** (`peer_label`), pourtant persisté dans le champ `name` de la réponse.

**Correction :** Un doublon n’est levé que s’il existe déjà un `peer_rating` avec le **même** `peer_label` (comparaison après `trim`), alignée sur le schéma Zod.

---

## 2. « Voir les résultats » — mêmes scores pour auto-évaluation et pairs

**Problème :** Sur l’accueil, la carte **Mes feedbacks** renvoyait les mêmes résultats que l’**auto-évaluation**.

**Cause :** Dans [`index.tsx`](../applications/frontend/src/routes/index.tsx), le lien utilisait `matrix.self_response_id` au lieu de l’identifiant des réponses `peer_rating`.

**Correction :** Un bouton **par colonne pair** dans `matrix.peer_columns`, chaque lien pointant vers `/results/$qid/$responseId` avec le `response_id` du pair concerné (libellés du type « Résultats — Pair 1 », etc.).

---

## 3. Déblocage de `element_humain_status` après auto-éval + pairs

**Problème :** Même une fois `self_rating` et `peer_feedback` à **completed**, `element_humain_status` restait **locked** tant qu’aucune logique explicite ne le passait à **pending**.

**Cause :** Lors de l’upsert dans [`drizzle-responses.repository.ts`](../applications/backend/src/infrastructure/database/repositories/drizzle-responses.repository.ts), seuls les champs de l’étape en cours étaient mis à jour.

**Correction :** Dans la même transaction, lecture de la ligne `participant_progress` existante ; si, après la soumission courante, **auto-évaluation** et **pairs** sont **completed** et que **Élément humain** est encore **locked**, ajout au patch de `elementHumainStatus: 'pending'`. Ordre des étapes (self puis pairs ou l’inverse) pris en charge.

---

## Fichiers impactés (référence rapide)

| Fichier | Rôle |
|--------|------|
| [`applications/backend/src/application/responses/submit-participant-questionnaire.usecase.ts`](../applications/backend/src/application/responses/submit-participant-questionnaire.usecase.ts) | Doublon `peer_rating` par `peer_label` |
| [`applications/frontend/src/routes/index.tsx`](../applications/frontend/src/routes/index.tsx) | Liens résultats par `peer_columns[].response_id` |
| [`applications/backend/src/infrastructure/database/repositories/drizzle-responses.repository.ts`](../applications/backend/src/infrastructure/database/repositories/drizzle-responses.repository.ts) | Déblocage `element_humain` quand self + pair sont complétés |

---

## Pistes de suivi (non réalisées dans cette passe)

- Affiner les libellés des boutons résultats pairs (ex. reprendre `col.label` du DTO matrice).
- Harmoniser le tableau « Pair 1 / Pair 2 » sur l’accueil avec le nombre réel de pairs (ex. trois onglets côté saisie).
