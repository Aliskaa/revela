# Plan d'avancement — Restructuration espace participant (V1.5)

> Suite de [avancement-2026-04-28.md](avancement-2026-04-28.md). Ce fichier
> trace les itérations UX/route effectuées sur l'espace participant le
> 2026-04-29 après le déploiement de l'espace coach et de la mise à la racine.

---

## TL;DR

L'espace participant a été simplifié en plusieurs passes itératives au fil de la session :

1. **Confirmation explicite de participation** côté participant authentifié (endpoint backend + UI)
2. **Étapes verrouillées une fois soumises** (auto-éval, feedback pairs, test EH) → bandeau « Étape déjà soumise »
3. **Dashboard refait en mode résumé** (4 cards : Campagnes / En cours / À confirmer / Progression moyenne + liste compacte)
4. **`/journey` clickable** pour naviguer vers chaque étape (avant : purement informationnel)
5. **Vue Matrice partagée** (table + chart) pour la page Résultats, avec calcul de l'**écart absolu |je suis − je veux|** par paire et par source (auto, pairs, scientifique). Fallback paires consécutives quand `diff_pairs` non déclaré dans le catalog.
6. **Restructuration finale autour de `/campaigns/$campaignId/...`** : suppression de `/results`, `/my-coach`, `/journey`. Tout passe par le contexte « campagne ». Sidebar réduite à **Dashboard / Campagnes / Profil**.

**Bilan validation** : Frontend typecheck ✅, frontend tests **45/45** ✅, frontend lint **0 erreur** sur les fichiers touchés ✅, backend typecheck ✅, backend tests **18/18** ✅.

---

## 1. Confirmation de participation (livré matinée)

### Contexte

Bug UX repéré : le bouton « Commencer le parcours » sur `/campaigns` était cliquable même tant que `invitation_confirmed === false`. Le backend rejetait alors toute soumission avec :

```json
{ "error": "Vous devez confirmer votre participation à la campagne avant de répondre." }
```

Avant ce jour, la confirmation existait **uniquement** par jeton d'invitation (e-mail) — aucun endpoint participant authentifié ne permettait de confirmer depuis l'UI.

### Backend

- Nouveau use case [`ConfirmCampaignParticipationUseCase`](../applications/backend/src/application/participant-session/confirm-campaign-participation.usecase.ts).
  - Vérifie l'invitation via `getCampaignParticipantInviteState`. Si absent → `ParticipantQuestionnaireNotAllowedError` (HTTP 403, mappé par `ParticipantSessionExceptionFilter`).
  - Idempotent : si `joinedAt !== null`, no-op.
  - Sinon, appelle `confirmCampaignParticipantParticipation(campaignId, participantId)`.
- Endpoint `POST /participant/campaigns/:campaignId/confirm` ajouté dans [participant.controller.ts](../applications/backend/src/presentation/participant-session/participant.controller.ts), protégé par `ParticipantJwtAuthGuard` + `ParticipantSessionExceptionFilter`.
- DI câblé dans [participant.module.ts](../applications/backend/src/presentation/participant-session/participant.module.ts) avec le symbole `CONFIRM_CAMPAIGN_PARTICIPATION_USE_CASE_SYMBOL` ([participant.tokens.ts](../applications/backend/src/presentation/participant-session/participant.tokens.ts)).

### Frontend

- Hook `useConfirmCampaignParticipation` dans [hooks/participantSession.ts](../applications/frontend/src/hooks/participantSession.ts). Invalide la query `participant.session` au succès et déclenche un toast i18n.
- Clés i18n `toast.campaignParticipationConfirmed` / `campaignParticipationConfirmFailed` dans [fr.json](../applications/frontend/src/lib/i18n/locales/fr.json).
- Le `CampaignCard` affiche un Alert info + bouton **« Confirmer ma participation »** (icône `BadgeCheck`) quand `isActive && !invitationConfirmed`. Le bouton « Commencer le parcours » n'apparaît plus que si `isActive && invitationConfirmed`.

---

## 2. Étapes verrouillées une fois soumises

Demande utilisateur : « Une étape ne peut plus être modifiées une fois soumise. »

### Composant partagé

Nouveau composant [`StepCompletedBanner`](../applications/frontend/src/components/participant-dashboard/StepCompletedBanner.tsx) — Card avec icône Lock, titre, description, bouton de retour.

### Pages verrouillées

Les 3 pages d'étape vérifient désormais le statut et affichent le banner si `completed` :

- [self-rating.tsx](../applications/frontend/src/routes/_participant/self-rating.tsx) : `progression.self_rating_status === 'completed'`
- [peer-feedback.tsx](../applications/frontend/src/routes/_participant/peer-feedback.tsx) : `progression.peer_feedback_status === 'completed'`
- [test/$questionnaireCode.tsx](../applications/frontend/src/routes/_participant/test/$questionnaireCode.tsx) : `progression.element_humain_status === 'completed'`

Le formulaire n'est plus rendu — l'utilisateur voit le banner et un CTA de retour.

---

## 3. Dashboard résumé

Demande utilisateur : « Le dashboard doit etre plus résumé. Par exemple mon nombre de campagnes, leur progression. »

### Avant / Après

- **Avant** : `PageHeader` + 4 `MetricCard` + `JourneyItem` (« Parcours Révéla ») + `CampaignCard` + `CoachCard` — beaucoup d'écran pour des informations dupliquées avec `/campaigns`.
- **Après** : header compact (« Bonjour Prénom » + bouton « Voir mes campagnes ») + 4 `SummaryCard` (Campagnes rattachées, En cours, À confirmer, Progression moyenne) + liste compacte des campagnes avec barre de progression et bouton « Ouvrir » qui mène au workspace.

### Fichiers

- [routes/_participant/index.tsx](../applications/frontend/src/routes/_participant/index.tsx) : réécrit, plus de dépendance à `useSelectedAssignment`/`buildJourney`/`buildEffortEstimate`.
- Le bloc « Parcours Révéla » ainsi que `JourneyItem`, `MetricCard`, `PageHeader` ne sont plus appelés (dead code laissé en place pour l'instant — types `CampaignView`/`Metric` réutilisés ailleurs).

---

## 4. Vue Matrice partagée (Tableau + Graphique)

Demande utilisateur : « Avec la visu que l'on retrouve dans celle du coach. J'aime bien celle du coach mais il manque les écart entre les "je suis" et les "je veux". »

### Helper partagé

Nouveau fichier [pairBuilder.ts](../applications/frontend/src/components/matrix/pairBuilder.ts) qui :

1. Itère `matrix.result_dims`.
2. Si `dim.diff_pairs` est déclaré (cas Questionnaire B) → utilise les paires explicites.
3. **Fallback** : appaire les `scores` consécutifs `(scores[0], scores[1])`, `(scores[2], scores[3])`, … (convention métier e/w/e/w respectée par les Questionnaires F et S qui n'ont **pas** de `diff_pairs` dans le catalog).

Cette correction du fallback était indispensable : sans elle, aucun écart n'apparaissait pour F et S.

Helper `absDiff(a, b)` qui retourne `null` si l'une des valeurs est `null`, sinon `|a - b|`.

### MatrixTableMode

[components/matrix/MatrixTableMode.tsx](../applications/frontend/src/components/matrix/MatrixTableMode.tsx) :

- En-tête de section par dimension (chip primary discret, `colSpan` total).
- Pour chaque paire : ligne (e), ligne (w), ligne grisée **« Écart |je suis − je veux| »** avec valeur absolue par colonne (auto, chaque pair, scientifique). `null` → `—`.
- Lignes hors paires (`looseRows`) restent affichées normalement.

### MatrixChartMode

[components/matrix/MatrixChartMode.tsx](../applications/frontend/src/components/matrix/MatrixChartMode.tsx) :

- Chaque dimension reste un `Paper` avec son nom.
- À l'intérieur, chaque paire est un mini-bloc avec : barres « je suis », barres « je veux », puis un bandeau **GapPanel** discret avec un `Chip` par source montrant la valeur absolue de l'écart.

### Page /results participant

L'ancienne page [`_participant/results.tsx`](../applications/frontend/src/routes/_participant/) utilisait `DimensionCard` custom et n'avait pas la vue table. Elle a été refondue pour utiliser `<QuestionnaireMatrixDisplay matrix={matrix} />` (le même composant que côté coach), tout en conservant le header campagne + sélecteur multi-campagnes + export PDF.

---

## 5. /journey cliquable (étape transitoire)

Demande utilisateur : « Revoit aussi la page /journey car je ne peux cliquer sur aucune étape afin de les passer. »

Avant : la page `/journey` était purement informationnelle. Après : chaque étape est un `ButtonBase` qui navigue vers la page correspondante.

### Logique d'état

- `'completed'` → CTA bleu « Revoir cette étape »
- `'current'` → CTA bleu « Commencer cette étape »
- `'locked'` → carte grisée + cadenas + message « Étape disponible une fois la précédente terminée »
- Restitution coaching : informative uniquement (pas de route)

### Override Résultats

Demande utilisateur : « Les résultats, à partir du moment où il y en a, ils peuvent etre consultable. »

L'étape Résultats devient `'current'` (cliquable) dès qu'au moins une donnée est produite (`self_rating_status === 'completed' || peer_feedback_status === 'completed' || element_humain_status === 'completed'`), même si le backend renvoie `results_status === 'locked'`. La matrice supporte déjà l'affichage partiel : valeurs manquantes en `—`.

---

## 6. Restructuration finale autour de `/campaigns/$campaignId/...` (livré soir)

### Décisions utilisateur

Au fil des itérations le scope a évolué :

1. « Je ne veux plus `/results` mais comme les résultat sont consultable depuis journey, je veux `/journey/<xxx>/results` » → première restructuration : `/results` → `/journey/$campaignId/results`.
2. « Pareil la page `/my-coach` n'a pas d'intéret vu que le coach dépend de la campagne » → `/my-coach` → `/journey/$campaignId/coach`.
3. « La route `/journey` egalement n'a pas d'intéret car ca depend de la campagne et c'est un peu redondant par rapport à la page `/campaigns`. En gros, dans la sidebar, il devrait y avoir seulement dashboard, campagnes et profile. Tout le coeur se trouve dans campagne. »

→ État final : tout passe par `/campaigns/$campaignId/...`. Plus de `/journey`, plus de `/my-coach`, plus de `/results`.

### Arborescence finale `_participant/`

```
_participant/
├── index.tsx                                  → /
├── route.tsx                                  → layout (sidebar + topbar)
├── profile.tsx                                → /profile
├── self-rating.tsx                            → /self-rating
├── peer-feedback.tsx                          → /peer-feedback
├── test/
│   ├── index.tsx                              → /test
│   └── $questionnaireCode.tsx                 → /test/$questionnaireCode
└── campaigns/
    ├── index.tsx                              → /campaigns (liste)
    └── $campaignId/
        ├── index.tsx                          → /campaigns/$campaignId  (workspace = parcours + lien coach)
        ├── results.tsx                        → /campaigns/$campaignId/results
        └── coach.tsx                          → /campaigns/$campaignId/coach
```

### Workspace de campagne (`campaigns/$campaignId/index.tsx`)

Concentre tout le coeur d'une campagne :

- Header : nom de la campagne, entreprise, questionnaire, bouton retour
- Card cliquable « Mon coach » qui mène à `/campaigns/$campaignId/coach`
- Liste des 5 étapes du parcours (auto-éval, feedback pairs, test EH, résultats, restitution)
- Lecture de `campaignId` depuis `Route.useParams()` — l'URL est désormais la source de vérité (plus besoin du Zustand store sur cette page)

### Sidebar

[`route.tsx`](../applications/frontend/src/routes/_participant/route.tsx) — `participantNav` réduit à **3 items** :

- Dashboard
- Mes campagnes
- Mon profil

### Navigations mises à jour

- [campaigns/index.tsx](../applications/frontend/src/routes/_participant/campaigns/index.tsx) : bouton « Commencer/Continuer le parcours » → `/campaigns/$campaignId` (workspace), bouton « Voir les résultats » → `/campaigns/$campaignId/results`
- [campaigns/$campaignId/results.tsx](../applications/frontend/src/routes/_participant/campaigns/$campaignId/results.tsx) : bouton retour → `/campaigns/$campaignId`
- [campaigns/$campaignId/coach.tsx](../applications/frontend/src/routes/_participant/campaigns/$campaignId/coach.tsx) : idem
- [test/$questionnaireCode.tsx](../applications/frontend/src/routes/_participant/test/$questionnaireCode.tsx) : redirect post-submit → `/campaigns/$campaignId/results` (fallback `/campaigns` si pas de `campaignId`)
- [invite.$token.tsx](../applications/frontend/src/routes/invite.$token.tsx) : redirect post-submit → `/campaigns`
- [dashboardView.ts](../applications/frontend/src/lib/participant/dashboardView.ts) : `to:` strings utilisent maintenant `/campaigns/${campaignId}/results` et `/campaigns/${campaignId}/coach`
- [StepCompletedBanner.tsx](../applications/frontend/src/components/participant-dashboard/StepCompletedBanner.tsx) : `backTo` par défaut → `/campaigns`
- [routes/_participant/index.tsx](../applications/frontend/src/routes/_participant/index.tsx) : suppression du bouton « Mon parcours » du dashboard

### Fichiers supprimés

- `_participant/results.tsx` (déplacé puis supprimé)
- `_participant/my-coach.tsx` (déplacé puis supprimé)
- `_participant/journey.tsx` puis `_participant/journey/index.tsx` (contenu fusionné dans `campaigns/$campaignId/index.tsx`)
- Dossier `_participant/journey/` au complet

---

## 7. Validations

| Suite | Résultat |
|---|---|
| Frontend typecheck | ✅ |
| Frontend lint (fichiers touchés) | ✅ 0 erreur |
| Frontend tests Vitest | ✅ **45/45** |
| Backend typecheck | ✅ |
| Backend lint (fichiers touchés) | ✅ 0 erreur |
| Backend tests Vitest | ✅ **18/18** |

Walkthrough manuel restant : tester le parcours complet `/campaigns` → workspace → étape → retour → résultats avec écarts.

---

## 8. Limites connues / dette

### Code mort à nettoyer

Dans [lib/participant/dashboardView.ts](../applications/frontend/src/lib/participant/dashboardView.ts) :

- `buildJourney()` n'est plus appelé (le bloc « Parcours Révéla » du dashboard a été retiré).
- `buildEffortEstimate()` n'est plus appelé non plus.
- Les types `CampaignView`, `Metric`, `JourneyStep`, `EffortEstimate` restent exportés et utilisés par les composants `participant-dashboard/*` qui sont eux-mêmes morts (sauf `StepCompletedBanner`).

À supprimer dans une passe de cleanup ultérieure (pas critique, n'impacte pas le runtime).

### Convention `diff_pairs`

Le catalog [packages/aor-questionnaires/src/catalog.json](../packages/aor-questionnaires/src/catalog.json) ne déclare `diff_pairs` que pour le Questionnaire B. F et S reposent sur le **fallback** « paires consécutives » du `pairBuilder`. Si l'ordre des `scores` change un jour, le fallback peut produire des paires incorrectes. Idéalement, déclarer explicitement `diff_pairs` pour F et S.

### Mémoire des routes coach

[routes/coach/participants/$participantId.matrix.tsx](../applications/frontend/src/routes/coach/participants/$participantId.matrix.tsx) bénéficie automatiquement de la nouvelle vue matrice avec écarts (le composant est partagé). Pas de changement nécessaire.

---

**Conclusion** : le « hub » de l'expérience participant est désormais **/campaigns**. La sidebar tient en 3 items. Tout ce qui dépend d'une campagne (parcours, coach, résultats) est nesté sous `/campaigns/$campaignId/`, ce qui rend l'URL informative et permet le bookmark/partage. La vue matrice avec écart absolu |je suis − je veux| est partagée entre coach et participant.
