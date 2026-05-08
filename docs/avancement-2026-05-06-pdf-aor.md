# Avancement Révéla — État au 2026-05-06

> Source : « Projet Revela – To-do développement » (Cabinet AOR, MAJ 2026-05-03, Nora Mansouri).
>
> Échéance cible : avant la 1ʳᵉ session de formation (mi-mai 2026), prochain RDV vendredi 8 mai 2026.
>
> Méthode : audit du code (branche `main`, dernier commit `9c82197`) confronté point par point au PDF.

## Légende

- ✅ **Fait** — implémenté et vérifié dans le code.
- 🟡 **Partiel** — démarré mais incomplet ou avec résidus à nettoyer.
- ❌ **Pas fait** — aucune trace dans le code.
- ⏭️ **V2** — différé volontairement (hors scope court terme).

## Récap exécutif

| Section | ✅ | 🟡 | ❌ | ⏭️ V2 |
|---|---|---|---|---|
| 2. Renommage sémantique global | 6 | 0 | 0 | — |
| 3. Configuration & Administration | 8 | 0 | 0 | — |
| 4. Invitation & RGPD | 5 | 0 | 0 | 1 |
| 5. Regard sur soi | 1 | 0 | 0 | 1 |
| 6. Feedback des pairs | 5 | 0 | 0 | — |
| 7. Questionnaire Élément B | 3 | 0 | 0 | — |
| 8. Résultats Participant | 5 | 0 | 2 | 1 |
| 9. Vue de synthèse Admin/Coach | 1 | 0 | 2 | 1 |
| 10. IA & retour formateur/coach | 0 | 0 | 4 | — |
| 11. Hébergement & domaine | 0 | 0 | 1 | 1 |
| **Total court terme** | **34** | **0** | **9** | **5** |

Le gros de la **gouvernance et du parcours participant** est en place. Les chantiers restants sont concentrés sur :
1. La **vue résultats participant** : restent les **libellés d'interprétation des écarts** (texte attendu de Nora). Filtres « pairs me voient », retrait colonnes « je vois les autres » et **tooltips commentaires pairs** : faits (2026-05-06).
2. La **vue de synthèse Admin/Coach** (matrice globale + mise en lumière manuelle). Dates parcours : faites.
3. L'**IA & retour coach** (chantier complet, en attente du choix modèle / prompt côté Laurent).
4. ~~L'**autosave Élément B** (54×2 réponses — questionnaire long).~~ ✅ Fait (2026-05-08, brouillon serveur dédié + hydratation au reload). Pas d'autosave sur le regard sur soi (décision 2026-05-06 : trop court pour le justifier).
5. La **notification cloche** côté entreprise (la recherche participant est livrée — cf. section 3).
6. L'**hébergement** sous `revela.cabinet-aor.fr`.

---

## Section 2 — Renommage sémantique global

| Statut | Item PDF | État | Preuve / reste à faire |
|---|---|---|---|
| ✅ | « Auto-évaluation » → « Regard sur soi » (parcours participant) | Fait | `applications/frontend/src/routes/_participant/self-rating.tsx:69, 149` ; `_participant/campaigns/$campaignId/results.tsx:146, 150` (commits `1b10e9b`, `f96132a`) |
| ✅ | « Auto-évaluation » → « Regard sur soi » (résidus nettoyés) | Fait | `_participant/campaigns/index.tsx:82` (« Completer le regard sur soi ») ; `_participant/campaigns/$campaignId/results.tsx:223` (« Regard sur soi · … ») ; `components/admin/campaign-detail/CampaignParticipantsTable.tsx:81` (en-tête colonne « Regard sur soi ») ; messages d'erreur backend `submit-participant-questionnaire.usecase.ts:112, 236` mis à jour |
| ✅ | « Test scientifique » → « Test Élément B » | Fait | `_participant/campaigns/$campaignId/results.tsx:150`, `routes/privacy.tsx:76` |
| ✅ | « Évaluation des pairs » → « Feedback des pairs » | Fait | `_participant/peer-feedback.tsx:257-259, 315-317` |
| ✅ | « Score de transparence » → « Repère de transparence » | Fait | `_participant/campaigns/$campaignId/transparency.tsx:104, 174` ; carte `CampaignTransparencyCard` |
| ✅ | « Campagne d'évaluation » → « Parcours Élément Humain » (écran d'accueil & comms externes) | Fait | Côté admin « Campagne » conservé. Écran d'invitation aligné : checkbox `routes/invite.$token.tsx:247` (« …à ce parcours »), bandeau de bienvenue `:562` (« votre Parcours Élément Humain »), bouton de lancement `:590` (« Commencer le parcours »). Aucun template e-mail/PDF présent dans le code (envoi auto reste V2) |

**Vigilance résiduelle** : à reprendre dès que les premiers templates e-mails / notifications / exports PDF arriveront — aucun n'existe aujourd'hui dans le code. Les seules occurrences restantes de `évaluation` sont (i) du contenu RGPD juridique dans `routes/confidentiality.tsx` (à relire au prochain audit RGPD), (ii) le filtre admin « Évaluation analysée » de `ParticipantQuestionnaireMatrix.tsx` (scope admin, conservé), (iii) des commentaires de code internes (non visibles utilisateur).

---

## Section 3 — Étape 0 : Configuration & Administration

| Statut | Profil | Item PDF | État | Preuve / reste à faire |
|---|---|---|---|---|
| ✅ | Admin | Retirer/griser « archivée » et « clôturée » à la création | Fait | Backend `create-admin-campaign` rejette `closed`/`archived` ; UI ne propose plus que `draft`/`active` (cf. P02) |
| ✅ | Admin | Suppression d'un coach → réaffectation auto à l'admin | Fait | Ligne sentinelle « Admin » bootstrappée (`EnsureAdminCoachService`) + `reassignAllByCoach` (cf. P05) |
| ✅ | Coach | Retirer « créer / supprimer un parcours » côté coach | Fait | `POST /admin/campaigns` rejette `scope === 'coach'` (401) ; UI cachée dans `CampaignsListPage` (cf. P06) |
| ✅ | Coach | Retirer « créer une entreprise » côté coach | Fait | `POST /admin/companies` + `DELETE` rejettent coach ; UI cachée dans `CompaniesListPage` / `CompanyDetailPage` (cf. P07) |
| ✅ | Coach | Coach ne peut pas supprimer un participant (sauf ceux qu'il a ajoutés unitairement) | Fait | Colonne `participants.created_by_coach_id` ajoutée (migration `0016_strong_lucky_pierre.sql`, FK `coaches.id`, `ON DELETE SET NULL`) ; renseignée à la création par `AddParticipantToCompanyUseCase` et `AddParticipantToCampaignUseCase` (= `coachId` de l'acteur, `null` côté admin). `EraseParticipantRgpdUseCase` exige désormais `participant.createdByCoachId === coachId` en scope coach (404 sinon). Tentative de ré-ajout d'un participant existant non possédé → erreur métier « Ce participant existe déjà et ne peut pas être modifié. » (mutation silencieuse supprimée). UI : bouton « Supprimer » de `CompanyParticipantsTable` masqué via prop `currentCoachId` quand `created_by_coach_id` ne matche pas. Admin reste illimité |
| ✅ | Admin / Coach | Ajout d'un utilisateur unitairement (en plus du CSV) | Fait | 2 endpoints : `POST /admin/campaigns/:id/participants` (avec auto-invitation) et `POST /admin/companies/:id/participants` ; drawer `AddParticipantToCampaignDrawerForm` (cf. P08) |
| ✅ | Admin | Barre de recherche participant dans la vue entreprise | Fait | Backend : query `q` ajoutée à `GET /admin/participants` (ILIKE prénom/nom/email, scope coach/admin préservé via cumul `and(...)`). UI : `TextField` debouncé 300 ms dans `CompanyParticipantsTable` (`search`/`onSearchChange`), reset page via `usePageResetEffect`, message vide adapté. Règle métier rappelée par PDF : statut « Actif » dès que l'invitation est acceptée (`joined_at` non nul) |
| ✅ | Admin | Conserver l'écran « questionnaires » pour extensions futures | Fait | `routes/admin/questionnaires.tsx` toujours présent et fonctionnel |
| ❌ | Admin / Coach | Notification cloche en fin d'étape / fin de parcours | Pas fait | Aucun composant `Bell`/notification dans le frontend ; chantier complet (UI + persistance + déclencheurs backend) |

---

## Section 4 — Étape 1 : Invitation & RGPD

| Statut | Profil | Item PDF | État | Preuve / reste à faire |
|---|---|---|---|---|
| ✅ | Participant | Texte de consentement RGPD sur l'écran d'accueil (Annexe A) | Fait | `routes/invite.$token.tsx:140-145, 220-251` : Alert RGPD + checkbox + bouton désactivé tant que non coché |
| ✅ | Participant | Page dédiée `/confidentiality` accessible depuis le bandeau | Fait (2026-05-06) | Route renommée `/privacy` → `/confidentiality` (file-based routing TanStack : `applications/frontend/src/routes/confidentiality.tsx`, `routeTree.gen.ts` régénéré). Liens mis à jour dans `routes/invite.$token.tsx:229`, `routes/_participant/profile.tsx:268`, `components/layout/FooterLayout.tsx:21`. Choix `/confidentiality` (anglais sans accent) plutôt que `/confidentialité` pour éviter les pièges d'encodage URL ; libellé visible reste « Politique de confidentialité » |
| ✅ | Participant | Renommer « campagne d'évaluation » → « Parcours Élément Humain » sur l'écran d'accueil | Partiel→Fait sur la page principale | Texte introductif conforme. **Reste** : libellé checkbox `invite.$token.tsx:247` mentionne encore « cette évaluation » |
| ✅ | Participant | Après création du compte → redirection directe vers le dashboard | Fait | Branche conditionnelle vers `/self-rating` supprimée — atterrissage systématique sur `/` (cf. P09) |
| ⏭️ | Admin | Envoi automatique des liens d'invitation | V2 | Traitement manuel acceptable car parcours ≤ 10 personnes |

---

## Section 5 — Étape 2 : Regard sur soi

| Statut | Profil | Item PDF | État | Preuve / reste à faire |
|---|---|---|---|---|
| ✅ | Participant | Après validation d'une étape → retour au détail du parcours (et non au dashboard) | Fait | Auto-évaluation : redirection `/` → `/campaigns/$campaignId` (cf. P10). Test Élément B : redirection `/campaigns/$campaignId/results` → `/campaigns/$campaignId` |
| ⏭️ | Participant | Enregistrement automatique des réponses à chaque clic « Suivant » | Hors scope court terme (2026-05-06) | Décision : **pas d'autosave sur le regard sur soi** (court — 9 questions, soumission manuelle suffisante). L'autosave reste retenu uniquement pour l'Élément B (54×2 réponses, cf. section 7). Aucun `autosave`/`debounce` dans `self-rating.tsx` — comportement conservé tel quel |

---

## Section 6 — Étape 3 : Feedback des pairs

| Statut | Profil | Item PDF | État | Preuve / reste à faire |
|---|---|---|---|---|
| ✅ | Participant | Commentaire optionnel **par note** (par item du questionnaire), max 150 caractères | Fait (2026-05-06) | Décision design (Nora) : commentaire **par note** plutôt que global, pour justifier chaque réponse. Migration `0017_amusing_bedlam.sql` (colonne `scores.comment varchar(150)` nullable). Backend : `submitParticipantPeerRatingBodySchema.comments` optionnel + use case `submit-participant-questionnaire.usecase.ts:197-217` (trim, rejet des commentaires orphelins, garde-fou serveur 150 chars, vide → `null`). UI : bouton `+` discret par item dans `RatingDimensionCard` → ouvre un `TextField` multiline (compteur `n/150`, bouton `−` pour replier+effacer). `peer-feedback.tsx` n'envoie que les commentaires non vides, validés côté serveur. Asymétrie : non disponible pour le regard sur soi (décision Nora — section 6 PDF, peer-only) |
| ✅ | Participant | Confirmation explicite « j'ai terminé mes feedbacks » avant Élément B (suppression du déverrouillage automatique au 1ᵉʳ pair) | Fait | Use case `ConfirmPeerFeedbackUseCase` + endpoint `POST /participant/campaigns/:id/peer-feedback/confirm` ; bouton « J'ai terminé mes feedbacks » dans peer-feedback page et `CampaignStepCard` (cf. P12, P13) |
| ✅ | Participant | Anonymisation des pairs côté participant : `Pair 1`, `Pair 2`, … | Fait | Libellés `Pair #1`, `Pair #2`… côté participant ; pas d'IDs dans le JSON (cf. P16) |
| ✅ | Admin / Coach | Pas d'anonymat côté admin/coach : noms complets affichés | Fait (vérifié 2026-05-06) | Asymétrie pilotée par le flag `anonymizeReceivedPeerLabels` du use case `get-participant-questionnaire-matrix.usecase.ts:119, 149-153` : `admin-participants.controller.ts:205` passe `false` (admin/coach voient `firstName lastName`), `get-participant-session-questionnaire-matrix.usecase.ts:58` passe `true` côté participant (libellés `Pair #N` + `rater_participant_id` masqué). Aucun leak constaté |

---

## Section 7 — Étape 4 : Questionnaire Élément B

| Statut | Profil | Item PDF | État | Preuve / reste à faire |
|---|---|---|---|---|
| ✅ | Participant | Simplifier la page : retirer bloc « résumé / dimensions » et éléments parasites | Fait (2026-05-08) | Décision : la page d'accueil intermédiaire `/test/` (ancien `routes/_participant/test/index.tsx`) est **supprimée**. Le clic sur la card « Test Élément Humain » depuis `/campaigns/:id` route directement vers `/test/$questionnaireCode` (première question). Navigation corrigée dans `routes/_participant/campaigns/$campaignId/index.tsx:55-74` (branche `routeKind === 'test'` qui résout `assignment.questionnaire_id`). `routeTree.gen.ts` régénéré par le plugin Vite TanStack — plus aucune référence à `ParticipantTestIndex`. Simplification ultime : on saute la page de présentation puisque le contexte (chip « Test Élément Humain », titre, description, StatCards Séries/Questions, card Dimensions) est déjà rendu sur la page de test elle-même |
| ✅ | Participant | Paragraphe descriptif du questionnaire à insérer | Fait (2026-05-08) | Résolu par la suppression de la page intermédiaire (item ci-dessus). L'en-tête de `routes/_participant/test/$questionnaireCode.tsx:399-405` affiche déjà `detail.description` (description venant de la donnée questionnaire côté API). Si Nora veut affiner ce texte, il se met à jour côté contenu (seed/BDD du questionnaire) sans toucher au code |
| ✅ | Participant | Enregistrement automatique des réponses entre les deux séries (54×2) | Fait (2026-05-08) | Brouillon serveur dédié : table `element_b_drafts` (migration `0018_early_mimic.sql`, jsonb `series0`/`series1` + `last_saved_at`, clé unique `participant × campaign × questionnaire`). Backend : 2 endpoints `GET/PUT /participant/campaigns/:campaignId/questionnaires/:qid/draft` (zod `upsertElementBDraftBodySchema`, garde-fous : campagne active, participation jointe, pas déjà soumis). Use case `SubmitParticipantQuestionnaireUseCase` supprime le brouillon après création de la réponse `element_humain` (cleanup transactionnel logique). Frontend : hooks `useElementBDraft` + `useUpsertElementBDraft` (questionnaires.ts) avec invalidation queryKey sur submit final ; page `routes/_participant/test/$questionnaireCode.tsx` lift `seriesIndex`/`questionIndex` au parent + hydratation guardée `hydratedFromKeyRef` (évite le reset à chaque re-render). Autosave fire-and-forget à chaque transition `series N → N+1` (cf. décision Nora « à chaque fin de série »). Indicateur visuel `Save` chip pendant `upsertDraft.isPending` + 2 snackbars (« Brouillon enregistré » au save, « Brouillon repris » à l'hydratation). Échec réseau autosave silencieux : le participant continue en mémoire locale plutôt qu'être bloqué |

---

## Section 8 — Étape 5 : Résultats Participant

> Structure attendue : **Niveau 1** (saisies) → **Niveau 2** (Repère de transparence) → **Niveau 3** (Retour coach IA).

### Niveau 1 — Résultats des saisies

| Statut | Item PDF | État | Preuve / reste à faire |
|---|---|---|---|
| ✅ | Affichage des scores (regard sur soi, feedbacks pairs anonymisés, Élément B) | Fait | `_participant/campaigns/$campaignId/results.tsx` ; matrice via `QuestionnaireMatrixDisplay` (cf. P22) |
| ✅ | Filtres dans la vue résultats : « comment mes pairs me voient » | Fait (2026-05-06) | Perspective `'received'` codée en dur dans `routes/_participant/campaigns/$campaignId/results.tsx:36` (paramètre `peers=received` envoyé à l'API). Pas de toggle UI nécessaire : seul le point de vue « mes pairs me voient » est rendu sur cette page (le point de vue inverse vit côté `peer-feedback.tsx` pour la saisie). Item 3.7 du plan satisfait par construction |
| ✅ | Affichage des commentaires pairs au survol (tooltip) | Fait (2026-05-06) | Débloqué par la livraison section 6. Matrix DTO étendu : nouveau champ `peer_comments: (string \| null)[]` aligné par index sur `peers` (`packages/aor-common/types/src/matrix.ts`). Use case `get-participant-questionnaire-matrix.usecase.ts` peuple les commentaires (trim, vide → `null`) — identique côté participant et admin/coach (ce dernier hérite via délégation). UI : `MatrixTableMode.tsx` affiche une icône `MessageSquareText` + `Tooltip` MUI sur chaque cellule pair commentée ; `MatrixChartMode.tsx` fait pareil dans `MiniBar`. Couvre la vue résultats participant ET la vue détail admin/coach |
| ❌ | Libellés d'interprétation des écarts (phrases préprogrammées, sauf écart 0) | Pas fait | Texte fourni par Nora (cf. photo des tests papiers) — table d'interprétation à intégrer |
| ✅ | Retirer les colonnes « comment je vois les autres » (allègement) | Fait (2026-05-06) | Conséquence directe du filtre `'received'` ci-dessus : `QuestionnaireMatrixDisplay` ne reçoit que les colonnes pairs « reçues ». Aucune colonne « comment je vois les autres » n'est rendue sur la page résultats participant. Item 3.8 du plan satisfait |
| ❌ | Conserver les colonnes intermédiaires (écarts / équivalences) | À vérifier | Comportement actuel à confirmer après l'allègement ci-dessus |

### Niveau 2 — Repère de transparence

| Statut | Item PDF | État | Preuve / reste à faire |
|---|---|---|---|
| ✅ | Activation manuelle par le coach (bouton « lancer le calcul ») | Fait | `POST /admin/campaigns/:id/participants/:pid/transparency/activate` ; pas d'affichage automatique — préserve le timing pédagogique (cf. P23) |
| ✅ | Affichage en gros (ex. « 60 % suite à 3 feedbacks ») une fois activé | Fait | Carte `CampaignTransparencyCard` ; page détail `/campaigns/$id/transparency` ; calcul `@aor/scoring/computeTransparencyScore` (formule `clamp(100 − ⌊100 × Σécart / (Σ P × peerCount)⌋, 0, 100)`) (cf. P23) |

### Export PDF

| Statut | Item PDF | État | Preuve / reste à faire |
|---|---|---|---|
| ⏭️ | Export PDF participant : Élément B + écarts uniquement (sans regard sur soi ni feedbacks pairs) | V2 (priorité basse) | À reprendre quand le scope court terme sera bouclé |

---

## Section 9 — Étape 6 : Vue de synthèse Admin / Coach

| Statut | Profil | Item PDF | État | Preuve / reste à faire |
|---|---|---|---|---|
| ❌ | Admin / Coach | Vue globale parcours : tableau de synthèse « Élément B uniquement » (colonnes = participants, lignes = questions/dimensions, écarts) | Pas fait | Aucun composant `CampaignMatrix`/`SynthesisMatrix` détecté côté admin. Chantier complet (cf. P20) |
| ⏭️ | Admin / Coach | Code couleur des écarts dans la vue de synthèse | V2 | Nora doit redéfinir les seuils — différé |
| ❌ | Coach | Mise en lumière manuelle de certaines cases du tableau de synthèse | Pas fait | Dépend de la vue globale ci-dessus |
| ✅ | Admin / Coach | Dates du parcours dans la vue détail participant | Fait (2026-05-06) | Colonne « Rejoint le » dans `ParticipantDetailView.tsx:345, 382` (commit `9c82197`). Décision 2026-05-06 : la date de jonction du participant suffit pour le besoin admin/coach — pas d'ajout des dates start/end/updated du parcours lui-même (info déjà accessible via le détail de la campagne) |

---

## Section 10 — IA & retour du formateur/coach (Niveau 3 résultats)

| Statut | Profil | Item PDF | État | Preuve / reste à faire |
|---|---|---|---|---|
| ❌ | Coach | Bouton « lancer l'analyse » → module IA | Pas fait | Aucun endpoint IA, aucune intégration LLM dans le backend |
| ❌ | Coach | Coach peut modifier le texte généré par l'IA avant validation | Pas fait | Dépend du précédent |
| ❌ | Participant | Diffusion uniquement après approbation explicite du coach | Pas fait | Dépend des précédents (cf. P24) |
| ❌ | Admin | Choix modèle IA + rédaction prompt | Pas fait | À spécifier avec Laurent — décision attendue avant développement (cf. P25) |

---

## Section 11 — Hébergement & domaine

| Statut | Profil | Item PDF | État | Preuve / reste à faire |
|---|---|---|---|---|
| ❌ | Admin | Sous-domaine `revela.cabinet-aor.fr` sur O2Switch | Pas fait | Accès O2Switch fournis par Nora — DNS + déploiement à faire |
| ⏭️ | Admin | E-mails personnalisés sur sous-domaine | V2 | Différé |

---

## Section 12 — V2 (hors scope court terme, pour mémoire)

- ⏭️ Envoi automatique des invitations par e-mail (étape 1).
- ⏭️ Autosave du regard sur soi (étape 2) — décision 2026-05-06, jugé non nécessaire (questionnaire court).
- ⏭️ Export PDF participant — Élément B + écarts (étape 5).
- ⏭️ Code couleur des écarts dans la vue de synthèse Admin/Coach (étape 6).
- ⏭️ E-mails personnalisés sur sous-domaine (section 11).
- ⏭️ Suivi de progression historique entre périodes (comparaison 2026 vs 2027).

---

## Plan d'attaque proposé pour le sprint d'ici le 8 mai

**Bloc 1 — Quick wins renommage / RGPD (1 j)**
1. ~~Nettoyage des 3 résidus « Auto-éval » (section 2).~~ ✅ Fait (2026-05-06)
2. ~~Libellé checkbox invite : « cette évaluation » → « ce parcours ».~~ ✅ Fait (2026-05-06, + écran d'accueil de l'invite)
3. ~~Décision et application : route `/privacy` ↔ `/confidentialité` (alias ou rename).~~ ✅ Fait (2026-05-06) — rename `/privacy` → `/confidentiality` (anglais sans accent pour éviter les pièges d'encodage URL ; libellé visible reste « Politique de confidentialité »). Liens mis à jour dans invite, profile et footer ; `routeTree.gen.ts` régénéré.

**Bloc 2 — Parcours participant manquants (2-3 j)**
4. ~~Autosave Élément B uniquement (section 7).~~ ✅ Fait (2026-05-08) — décision 2026-05-06 : **pas d'autosave sur le regard sur soi** (questionnaire court, soumission manuelle suffit). Implémentation : table `element_b_drafts` (jsonb série 0 / série 1, migration `0018_early_mimic.sql`), endpoints `GET/PUT .../draft` côté backend, hooks `useElementBDraft`/`useUpsertElementBDraft` côté frontend, autosave fire-and-forget à chaque transition de série, hydratation au mount avec reprise position. Brouillon supprimé automatiquement à la soumission finale.
5. ~~Commentaire optionnel pair, max 150 caractères (section 6) — schéma DB + UI + validation.~~ ✅ Fait (2026-05-06) — décision design : commentaire **par note** (pas global). Migration `0017_amusing_bedlam.sql` + Zod + use case + UI bouton `+` dans `RatingDimensionCard`. Garde-fou serveur 150 chars + rejet commentaires orphelins.
6. ~~Paragraphe descriptif Élément B.~~ ✅ Fait (2026-05-08) — résolu par la suppression de la page d'accueil intermédiaire `/test/`. Le participant arrive directement sur la première question, dont l'en-tête affiche déjà `detail.description` venant de la donnée questionnaire (API). Mise à jour du texte = mise à jour côté contenu, pas côté code.

**Bloc 3 — Vue résultats participant (2 j)**
7. ~~Filtres « comment mes pairs me voient ».~~ ✅ Fait (2026-05-06) — perspective `'received'` codée en dur dans `results.tsx:36`, pas de toggle UI nécessaire.
8. ~~Retrait colonnes « comment je vois les autres ».~~ ✅ Fait (2026-05-06) — conséquence directe du filtre `'received'`.
9. Libellés d'interprétation des écarts (table fournie par Nora).
10. ~~Tooltips commentaires pairs (dépend du bloc 2).~~ ✅ Fait (2026-05-06) — `peer_comments` ajouté au DTO matrix, icône `MessageSquareText` + `Tooltip` MUI dans `MatrixTableMode` et `MatrixChartMode` (couvre participant ET admin/coach).

**Bloc 4 — Vue synthèse coach/admin (2 j)**
11. Matrice globale Élément B par parcours.
12. Mise en lumière manuelle de cases.
13. ~~Dates parcours dans détail participant.~~ ✅ Fait (2026-05-06) — décision : la colonne « Rejoint le » de `ParticipantDetailView.tsx` suffit pour le besoin admin/coach (dates start/end/updated accessibles via le détail de la campagne).

**Bloc 5 — Périphérie (parallélisable)**
14. Notification cloche fin d'étape / fin de parcours.
15. ~~Barre de recherche participant vue entreprise.~~ ✅ Fait (2026-05-06) — query `q` côté API + `TextField` debouncé 300 ms dans `CompanyParticipantsTable`.
16. ~~Vérification garde « coach ne peut pas supprimer un participant ».~~ ✅ Fait (2026-05-06) — règle implémentée : coach ne supprime que les participants qu'il a ajoutés lui-même (cf. ligne section 3).
17. Configuration sous-domaine `revela.cabinet-aor.fr`.

**Bloc 6 — IA (à cadrer)**
18. RDV Laurent pour choix modèle + prompt → puis chantier complet (bouton lancer / édition / validation / diffusion).

---

## Notes de recette à mener (carry-over de l'avancement précédent)

8. **Autosave brouillon Élément B** (2026-05-08) :
   - Migration `0018_early_mimic.sql` appliquée (`pnpm --filter @aor/drizzle db:migrate`).
   - Remplir 54 réponses série 0 puis cliquer **Suivant** sur Q54 → DevTools réseau : 1 requête `PUT /participant/campaigns/:id/questionnaires/B/draft` avec body `{ "series0": [54 ints] }`. Snackbar « Brouillon enregistré ». Chip `Save` visible pendant `isPending`.
   - Recharger la page (F5) ou se reconnecter sur un autre navigateur → la page de test charge le brouillon (`GET .../draft`), hydrate les 54 réponses série 0 et atterrit directement sur **série 2 question 1**. Snackbar « Brouillon repris ».
   - Soumission finale (clic « Terminer et envoyer ») → vérifier que `GET .../draft` répond `{ draft: null }` après. La query React Query est invalidée automatiquement (cf. `useSubmitParticipantQuestionnaire.onSuccess`).
   - Cas erreur réseau autosave (couper le wifi, cliquer Suivant) : la mutation échoue silencieusement (pas de toast bloquant), le participant peut continuer en mémoire locale sans interruption. La saisie n'est sauvée qu'à la prochaine transition réseau-OK ou à la soumission finale.
   - Garde-fous backend : tentative `PUT` après soumission finale → 400 « Test scientifique deja soumis ». Tentative `PUT` sans `joined_at` → 400 « confirmer votre participation ». Tentative `PUT` sur campagne `closed`/`archived` → 400. Body invalide (longueur ≠ 54, valeur > 5) → 400 zod.
   - Asymétrie attendue : pas de brouillon serveur côté regard sur soi (décision Nora — section 5 PDF, questionnaire trop court).

1. **P14 / P16 — Anonymisation pairs côté participant** : avec ≥ 1 pair ayant feedbacké le participant connecté, vérifier sur `/campaigns/:id/results` que les colonnes affichent `Pair #1`, `Pair #2`… (pas de prénoms) et que les valeurs correspondent aux notes **reçues** (pas données).
2. **Vue admin/coach matrice** : colonnes pairs montrent les **noms** (pas d'anonymat) et **feedbacks reçus** par le participant consulté.
3. **Régression peer-feedback** : saisie / reprise des notations vers les pairs (`peers=given` par défaut) inchangée ; limite à 5 pairs basée sur les feedbacks **émis**.
4. **Export PDF résultats** : libellés colonnes pairs cohérents avec l'affichage anonyme à l'écran.
5. **P23 — Score de transparence** :
   - Migration `0015_clear_celestials.sql` appliquée (`pnpm --filter @aor/drizzle db:migrate`).
   - Participant avec ≥ 1 feedback pair reçu **et** une réponse Élément Humain peut faire calculer son score (sinon erreur 400 attendue).
   - Coach scope=coach ne voit/n'active que les participants de ses propres campagnes (filtrage `ensureCampaignAccess`).
   - Re-clic du bouton coach écrase bien le snapshot précédent.
   - Audit log `admin.transparency.activate` présent dans `audit_events` (payload contient `campaign_id`, `value`, `peer_count`).
6. **Périmètre coach sur fiche entreprise** (2026-05-06) :
   - Migration `0016_strong_lucky_pierre.sql` appliquée (`pnpm --filter @aor/drizzle db:migrate`).
   - En scope coach, la fiche entreprise affiche **tous** les participants de l'entreprise (alignement avec le compteur global), plus uniquement ceux inscrits à une de ses campagnes — évite les imports en double. Le dashboard `/coach` (« mes participants ») reste filtré sur les participations de campagne.
   - Tentative d'ajout unitaire (drawer entreprise/campagne) d'un email existant déjà rattaché à un autre coach ou à l'admin → erreur 400 « Ce participant existe déjà et ne peut pas être modifié. » (au lieu d'une réassociation silencieuse).
   - Bouton « Supprimer » caché sur les lignes dont `created_by_coach_id` ne matche pas le coach connecté. Admin voit toujours le bouton.
   - `DELETE /admin/participants/:id` côté coach → 404 si le coach n'est pas propriétaire (4 cas : participant créé par admin, par autre coach, ou n'appartenant pas à une de ses entreprises).
7. **Recherche participant fiche entreprise** (2026-05-06) :
   - Saisir un fragment de prénom, nom **ou** e-mail (ex. « lar ») dans la barre → après ~300 ms, seuls les participants matchant apparaissent ; total et pagination s'ajustent (page revient à 1).
   - Vider le champ → liste complète revient sans flicker (cache React Query séparé via queryKey enrichie).
   - En scope coach (`/coach/companies/:id`) : la recherche reste cantonnée aux participants déjà visibles sans la barre — aucune fuite de participants hors périmètre coach (filtre `coachId` cumulé via `and(...)` dans `listWithCompany`).
   - DevTools réseau : une seule requête `GET /admin/participants?...&q=...` par saisie stabilisée (debounce OK) ; paramètre `q` absent quand le champ est vide.
8. **Commentaires pairs (saisie + tooltip)** (2026-05-06) :
   - Migration `0017_amusing_bedlam.sql` appliquée (`pnpm --filter @aor/drizzle db:migrate`).
   - Saisie : sur `/peer-feedback`, sélectionner un pair, noter un item, cliquer le bouton `+` discret → un `TextField` multiline s'ouvre, compteur `n/150`. Saisie > 150 chars bloquée par le `slotProps.htmlInput.maxLength`. Bouton `−` referme et efface. Soumission : seuls les commentaires non vides partent.
   - Backend rejette (400) un commentaire dont la clé n'est pas dans `scores` (commentaire orphelin) — sécurité contre les payloads forgés.
   - Backend rejette (400) un commentaire > 150 chars (Zod en première barrière, garde-fou use case en deuxième).
   - Persistance : commentaire trimé en base. Vide ou whitespace seul → stocké en `null`, pas en chaîne vide.
   - Tooltip : sur `/campaigns/:id/results`, survoler la cellule pair commentée → icône `MessageSquareText` + tooltip avec le texte. En mode chart (`MiniBar`) idem. Cellules sans commentaire : aucune icône (pas de bruit visuel).
   - Asymétrie attendue : pas de bouton commentaire dans `/self-rating` (le `RatingDimensionCard` ne reçoit pas les props `comments`/`onCommentChange` côté regard sur soi).
   - Vue admin/coach `/admin/participants/:id/matrix` et `/coach/participants/:id/matrix` : tooltips visibles aussi (DTO matrix unifié).
