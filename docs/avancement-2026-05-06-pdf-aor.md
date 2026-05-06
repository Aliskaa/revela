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
| 4. Invitation & RGPD | 4 | 1 | 0 | 1 |
| 5. Regard sur soi | 1 | 0 | 1 | — |
| 6. Feedback des pairs | 3 | 0 | 2 | — |
| 7. Questionnaire Élément B | 1 | 1 | 1 | — |
| 8. Résultats Participant | 2 | 0 | 5 | 1 |
| 9. Vue de synthèse Admin/Coach | 0 | 1 | 2 | 1 |
| 10. IA & retour formateur/coach | 0 | 0 | 4 | — |
| 11. Hébergement & domaine | 0 | 0 | 1 | 1 |
| **Total court terme** | **25** | **3** | **16** | **4** |

Le gros de la **gouvernance et du parcours participant** est en place. Les chantiers restants sont concentrés sur :
1. La **vue résultats participant** (filtres, tooltips, libellés d'écarts, allègement du tableau).
2. La **vue de synthèse Admin/Coach** (matrice globale + mise en lumière manuelle).
3. L'**IA & retour coach** (chantier complet, en attente du choix modèle / prompt côté Laurent).
4. Les **autosaves** (regard sur soi + Élément B).
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

**Vigilance résiduelle** : à reprendre dès que les premiers templates e-mails / notifications / exports PDF arriveront — aucun n'existe aujourd'hui dans le code. Les seules occurrences restantes de `évaluation` sont (i) du contenu RGPD juridique dans `routes/privacy.tsx` (à arbitrer avec le rename `/privacy` → `/confidentialité` du Bloc 1), (ii) le filtre admin « Évaluation analysée » de `ParticipantQuestionnaireMatrix.tsx` (scope admin, conservé), (iii) des commentaires de code internes (non visibles utilisateur).

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
| 🟡 | Participant | Page dédiée `/confidentialité` accessible depuis le bandeau | Partiel | Page existante : `routes/privacy.tsx` (299 lignes, contenu Annexe B). **Choix à valider** : route actuelle `/privacy` — le PDF demande `/confidentialité`. Soit on renomme, soit on ajoute un alias route FR |
| ✅ | Participant | Renommer « campagne d'évaluation » → « Parcours Élément Humain » sur l'écran d'accueil | Partiel→Fait sur la page principale | Texte introductif conforme. **Reste** : libellé checkbox `invite.$token.tsx:247` mentionne encore « cette évaluation » |
| ✅ | Participant | Après création du compte → redirection directe vers le dashboard | Fait | Branche conditionnelle vers `/self-rating` supprimée — atterrissage systématique sur `/` (cf. P09) |
| ⏭️ | Admin | Envoi automatique des liens d'invitation | V2 | Traitement manuel acceptable car parcours ≤ 10 personnes |

---

## Section 5 — Étape 2 : Regard sur soi

| Statut | Profil | Item PDF | État | Preuve / reste à faire |
|---|---|---|---|---|
| ✅ | Participant | Après validation d'une étape → retour au détail du parcours (et non au dashboard) | Fait | Auto-évaluation : redirection `/` → `/campaigns/$campaignId` (cf. P10). Test Élément B : redirection `/campaigns/$campaignId/results` → `/campaigns/$campaignId` |
| ❌ | Participant | Enregistrement automatique des réponses à chaque clic « Suivant » | Pas fait | Aucun `autosave`/`debounce` dans `self-rating.tsx`. La soumission reste manuelle via `handleSubmit`. Chantier sécurité anti-déconnexion (cf. P15) |

---

## Section 6 — Étape 3 : Feedback des pairs

| Statut | Profil | Item PDF | État | Preuve / reste à faire |
|---|---|---|---|---|
| ❌ | Participant | Commentaire optionnel par pair, max 150 caractères | Pas fait | Aucun champ commentaire dans `routes/_participant/peer-feedback.tsx`. Aucune table/colonne `peer_comment` côté backend. Chantier : schéma DB + UI + validation `maxLength=150` (cf. P11, P17) |
| ✅ | Participant | Confirmation explicite « j'ai terminé mes feedbacks » avant Élément B (suppression du déverrouillage automatique au 1ᵉʳ pair) | Fait | Use case `ConfirmPeerFeedbackUseCase` + endpoint `POST /participant/campaigns/:id/peer-feedback/confirm` ; bouton « J'ai terminé mes feedbacks » dans peer-feedback page et `CampaignStepCard` (cf. P12, P13) |
| ✅ | Participant | Anonymisation des pairs côté participant : `Pair 1`, `Pair 2`, … | Fait | Libellés `Pair #1`, `Pair #2`… côté participant ; pas d'IDs dans le JSON (cf. P16) |
| ❌ | Admin / Coach | Pas d'anonymat côté admin/coach : noms complets affichés | À vérifier | Vue admin/coach matrice doit afficher noms — recette à mener pour confirmer que l'anonymisation côté participant n'a pas leaké côté admin |

---

## Section 7 — Étape 4 : Questionnaire Élément B

| Statut | Profil | Item PDF | État | Preuve / reste à faire |
|---|---|---|---|---|
| 🟡 | Participant | Simplifier la page : retirer bloc « résumé / dimensions » et éléments parasites | Partiel | `SidebarSummary` retiré de `ParticipantTestSessionRoute` (commit `700db00`). **Reste** : ajouter le paragraphe descriptif du questionnaire (texte à fournir par Nora) |
| ❌ | Participant | Paragraphe descriptif du questionnaire à insérer | Pas fait | Texte à fournir par Nora |
| ❌ | Participant | Enregistrement automatique des réponses entre les deux séries (54×2) | Pas fait | Idem section 5 — pas d'autosave. Chantier sécurité anti-déconnexion |

---

## Section 8 — Étape 5 : Résultats Participant

> Structure attendue : **Niveau 1** (saisies) → **Niveau 2** (Repère de transparence) → **Niveau 3** (Retour coach IA).

### Niveau 1 — Résultats des saisies

| Statut | Item PDF | État | Preuve / reste à faire |
|---|---|---|---|
| ✅ | Affichage des scores (regard sur soi, feedbacks pairs anonymisés, Élément B) | Fait | `_participant/campaigns/$campaignId/results.tsx` ; matrice via `QuestionnaireMatrixDisplay` (cf. P22) |
| ❌ | Filtres dans la vue résultats : « comment mes pairs me voient » | Pas fait | Pas de toggle filtre dans `results.tsx` |
| ❌ | Affichage des commentaires pairs au survol (tooltip) | Pas fait | Bloqué par section 6 (commentaires pas en base) |
| ❌ | Libellés d'interprétation des écarts (phrases préprogrammées, sauf écart 0) | Pas fait | Texte fourni par Nora (cf. photo des tests papiers) — table d'interprétation à intégrer |
| ❌ | Retirer les colonnes « comment je vois les autres » (allègement) | Pas fait | À retirer du tableau résultats participant |
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
| 🟡 | Admin / Coach | Dates du parcours dans la vue détail participant | Partiel | Colonne « Rejoint le » ajoutée dans `ParticipantDetailView.tsx` (commit `9c82197`). **Reste** : dates de début/fin/MAJ du parcours lui-même (cf. P21) |

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
- ⏭️ Export PDF participant — Élément B + écarts (étape 5).
- ⏭️ Code couleur des écarts dans la vue de synthèse Admin/Coach (étape 6).
- ⏭️ E-mails personnalisés sur sous-domaine (section 11).
- ⏭️ Suivi de progression historique entre périodes (comparaison 2026 vs 2027).

---

## Plan d'attaque proposé pour le sprint d'ici le 8 mai

**Bloc 1 — Quick wins renommage / RGPD (1 j)**
1. ~~Nettoyage des 3 résidus « Auto-éval » (section 2).~~ ✅ Fait (2026-05-06)
2. ~~Libellé checkbox invite : « cette évaluation » → « ce parcours ».~~ ✅ Fait (2026-05-06, + écran d'accueil de l'invite)
3. Décision et application : route `/privacy` ↔ `/confidentialité` (alias ou rename).

**Bloc 2 — Parcours participant manquants (2-3 j)**
4. Autosave regard sur soi + Élément B (sections 5 & 7).
5. Commentaire optionnel pair, max 150 caractères (section 6) — schéma DB + UI + validation.
6. Paragraphe descriptif Élément B (texte Nora attendu).

**Bloc 3 — Vue résultats participant (2 j)**
7. Filtres « comment mes pairs me voient ».
8. Retrait colonnes « comment je vois les autres ».
9. Libellés d'interprétation des écarts (table fournie par Nora).
10. Tooltips commentaires pairs (dépend du bloc 2).

**Bloc 4 — Vue synthèse coach/admin (2 j)**
11. Matrice globale Élément B par parcours.
12. Mise en lumière manuelle de cases.
13. Dates parcours dans détail participant.

**Bloc 5 — Périphérie (parallélisable)**
14. Notification cloche fin d'étape / fin de parcours.
15. ~~Barre de recherche participant vue entreprise.~~ ✅ Fait (2026-05-06) — query `q` côté API + `TextField` debouncé 300 ms dans `CompanyParticipantsTable`.
16. ~~Vérification garde « coach ne peut pas supprimer un participant ».~~ ✅ Fait (2026-05-06) — règle implémentée : coach ne supprime que les participants qu'il a ajoutés lui-même (cf. ligne section 3).
17. Configuration sous-domaine `revela.cabinet-aor.fr`.

**Bloc 6 — IA (à cadrer)**
18. RDV Laurent pour choix modèle + prompt → puis chantier complet (bouton lancer / édition / validation / diffusion).

---

## Notes de recette à mener (carry-over de l'avancement précédent)

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
