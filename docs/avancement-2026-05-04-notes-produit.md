# Avancement produit — Notes du 2026-05-04

> Objectif: transformer les notes en backlog actionnable avec suivi simple.
>
> Sources: consolidation du fichier `avancement-2026-05-02-notes-produit.md` et du document Cabinet AOR « Projet Revela – To-do développement » (MAJ 2026-05-03).
>
> Convention de statut:
> - `Pas encore fait`
> - `En cours`
> - `Fait`

## Checklist rapide

- [x] L'admin peut etre un coach
- [x] Bloquer la saisie des statuts `cloturee` / `archivee` sans creation prealable
- [ ] Ajouter une barre de recherche participant (liste participants) — un participant est `Actif` une fois l'invitation acceptee
- [x] Reaffecter automatiquement les campagnes d'un coach supprime vers l'admin
- [x] Retirer la creation de campagne autonome cote coach
- [x] Retirer la creation/suppression d'entreprise cote coach
- [x] Ajouter un bouton d'ajout manuel d'un participant a une campagne
- [x] Rediriger vers le dashboard apres creation du compte participant
- [x] Revenir au detail de campagne apres validation d'une etape du parcours
- [ ] Ajouter un commentaire optionnel pour les pairs lors des feedbacks
- [x] Autoriser la poursuite du parcours feedback tant que moins de 5 pairs enregistres
- [x] Exiger une confirmation explicite de fin de feedback pairs avant suite parcours/test
- [ ] Vue participant: afficher uniquement les scores de pairs anonymes (impl. — **à valider** : section *Notes à tester*)
- [ ] Tests 54x2: activer l'enregistrement automatique des reponses
- [ ] "Comment mes pairs me voient": afficher `pair #1`, `pair #2`, etc. (impl. — **à valider** : section *Notes à tester*)
- [ ] Limiter les commentaires feedback a 150 caracteres
- [ ] Tableau de synthese: afficher commentaires au survol + label d'ecart (sauf ecart 0)
- [ ] Vue coach/admin: pas d'anonymat
- [ ] Vue coach/admin: ajouter une matrice globale campagne (test + ecarts)
- [ ] Vue coach/admin: ajouter les dates de campagne dans le detail participants
- [x] Resultats niveau 1: scores
- [x] Resultats niveau 2: score de transparence active par bouton coach
- [ ] Resultats niveau 3: retours coach via analyse IA supervisee et validable
- [ ] Tracer le choix IA (modele + prompt) pour la transmission

## Checklist complementaire (PDF Cabinet AOR, hors numerotation Pxx historique)

- [ ] Renommage semantique global (interface, e-mails, exports PDF, erreurs) — vocabulaire « parcours de conscience » / libelles definis dans le PDF
- [ ] Invitation / RGPD: texte de consentement (Annexe A) sur l'ecran d'accueil participant
- [ ] Page dediee `/confidentialite` + lien depuis le bandeau (Annexe B)
- [ ] Conserver l'ecran « questionnaires » pour extensions futures (au-dela de l'Element B)
- [ ] Notification (cloche) lorsqu'un participant termine une etape ou le parcours complet
- [ ] Verifier / verrouiller: le coach ne peut pas supprimer un participant (PDF etape 0; distinct de la suppression d'entreprise P07)
- [ ] Questionnaire Element B: simplifier la page (retirer bloc resume/dimensions parasites), ajouter paragraphe descriptif
- [ ] Resultats niveau 1 participant: filtres « comment mes pairs me voient »; retirer colonnes « comment je vois les autres »; conserver colonnes intermediaires (ecarts / equivalences) pour lecteurs avances
- [ ] Vue synthese admin/coach: code couleur des ecarts (seuils a definir — **V2** dans le PDF)
- [ ] Vue synthese: permettre au coach de mettre en lumiere manuellement certaines cases du tableau
- [ ] Hebergement: sous-domaine `revela.cabinet-aor.fr` (O2Switch)
- [ ] Export PDF participant Element B + ecarts seuls (**V2** / priorite basse dans le PDF)
- [ ] Envoi automatique des invitations e-mail (**V2** — manuel acceptable court terme)
- [ ] E-mails personnalises sur sous-domaine (**V2**)

## Tableau de suivi (fait / pas encore fait)

| ID | Sujet | Statut | Notes |
|---|---|---|---|
| P01 | Admin peut etre coach | Fait | Frontend : suppression redirect bloquant `/coach`, libelles adaptatifs, entree « Vue coach » dans sidebar admin, bandeau ambre + bouton retour dans sidebar coach quand vu par super-admin. Backend : ligne sentinelle « Admin » dans coachesTable (cf. P05) — apparait dans la liste/picker, peut etre assignee comme coach d'une campagne |
| P02 | Interdire `cloturee/archivee` sans creation prealable | Fait | Backend : `create-admin-campaign` rejette `closed` / `archived` avec message explicatif. Frontend : le select de statut au form de creation ne propose plus que `draft` / `active`, helper text indiquant que cloture/archivage se font sur la campagne existante |
| P03 | Recherche participant dans liste | Pas encore fait | Champ recherche + filtrage nom/email. Regle d'affichage du statut : un participant est `Actif` une fois l'invitation acceptee (= `joined_at` non nul sur `campaign_participants`) |
| P05 | Suppression coach => campagnes reassignees admin | Fait | Ligne sentinelle « Admin » bootstrappee au demarrage (`EnsureAdminCoachService`) ; suppression d'un coach bascule automatiquement ses campagnes vers cette ligne via `reassignAllByCoach` ; refus de supprimer / editer / cloner la ligne admin ; flag `isAdmin` expose cote API + UI (badge, edition verrouillee, picker campagne) |
| P06 | Retirer creation campagne cote coach | Fait | Backend : `POST /admin/campaigns` rejette `scope === 'coach'` (401). Frontend : bouton « Nouvelle campagne » et drawer cachés en scope coach dans `CampaignsListPage` |
| P07 | Retirer creation/suppression entreprise cote coach | Fait | Backend : `POST /admin/companies` et `DELETE /admin/companies/:id` rejettent `scope === 'coach'` (401). Frontend : bouton « Ajouter une entreprise » + drawer cachés en scope coach dans `CompaniesListPage` ; `CompanyDangerZone` + `DeleteCompanyDialog` cachés en scope coach dans `CompanyDetailPage` |
| P08 | Ajout manuel d'un participant a une campagne | Fait | **Facette A (bulk)** : `POST /admin/companies/:id/participants/import` rejette `scope === 'coach'` (401). Bouton CSV + texte d'aide caches en scope coach via prop `showCsvImport` sur `CompanyParticipantsTable`. **Facette B (unitaire)** : 2 endpoints (`POST /admin/campaigns/:id/participants` avec auto-invitation + `POST /admin/companies/:id/participants` sans invitation) ouverts admin + coach. Use cases dedies (`AddParticipantToCampaignUseCase`, `AddParticipantToCompanyUseCase`). Drawer `AddParticipantToCampaignDrawerForm` reutilisable via props `subtitle` / `submitLabel`. Hooks `useAddParticipantToCampaign`, `useAddParticipantToCompany`. Boutons « Ajouter un participant » dans `CampaignManageParticipants` (fiche campagne) **et** `CompanyParticipantsTable` (fiche entreprise) |
| P09 | Post-creation compte participant => dashboard | Fait | Suppression de la branche conditionnelle qui redirigeait vers `/self-rating` quand la campagne etait ouverte. Le participant atterrit systematiquement sur `/` (dashboard) apres activation, conformement a la regle produit |
| P10 | Fin etape parcours => retour detail campagne | Fait | Auto-evaluation : redirection `/` -> `/campaigns/$campaignId` (avec fallback `/` si campaignId absent). Test : redirection `/campaigns/$campaignId/results` -> `/campaigns/$campaignId` (l'utilisateur clique ensuite pour les resultats). Peer-feedback non touche : la logique multi-pairs + confirmation finale est partie de P12/P13 |
| P11 | Commentaire optionnel sur feedback pair | Pas encore fait | Ajouter champ optionnel |
| P12 | Feedback pairs: continuer tant que < 5 enregistres | Fait | Repository : `peer_feedback_status` ne passe plus auto a `completed` au 1er feedback ; auto-complete uniquement au 5e (max). Element_humain debloque en consequence (cf. notes 2026-05-02). Suppression du deverrouillage automatique au premier pair saisi conforme PDF |
| P13 | Confirmation "j'ai termine les feedbacks" obligatoire | Fait | Backend : nouveau use case `ConfirmPeerFeedbackUseCase` + endpoint `POST /participant/campaigns/:id/peer-feedback/confirm` (refus si 0 feedback ; idempotent). Repo : nouvelle methode `markPeerFeedbackCompletedForCampaignSubject` qui passe a `completed` + debloque element_humain. Session payload enrichi avec `peer_ratings_count`. Frontend : hook `useConfirmPeerFeedback`, bouton « J'ai terminé mes feedbacks » dans la page peer-feedback (sidebar pairs, visible >= 1 feedback) ET dans `CampaignStepCard` sur la fiche campagne (étape peer-feedback en `pending` avec count >= 1, double bouton « Continuer » + « J'ai terminé »). Type `ConfirmPeerFeedbackResponse` dans `@aor/types` |
| P14 | Vue participant resultats: seulement scores pairs anonymes | Fait | Implémentation: colonnes « pairs » = feedbacks **reçus** (`peers=received`), pas les scores donnés aux pairs. **À tester** — section **Notes à tester** ci-dessous. |
| P15 | Tests 54x2: autosave des reponses | Pas encore fait | Persistance intervallee + reprise session ; aligne avec enregistrement auto « regard sur soi » et Element B (PDF) |
| P16 | Affichage anonyme des pairs (`pair #1`, `pair #2`) | Fait | Libellés `Pair #1`… côté participant sur la vue résultats ; pas d’IDs pairs dans le JSON. **À tester** — section **Notes à tester** ci-dessous. |
| P17 | Limite commentaires feedback a 150 caracteres | Pas encore fait | Validation UI + backend |
| P18 | Tableau synthese: survol commentaires + label ecart sauf 0 | Pas encore fait | Definir table d'interpretation des ecarts |
| P19 | Coach/admin: pas d'anonymat | Pas encore fait | Visibilite nominative selon role |
| P20 | Coach/admin: vue globale campagne (matrice test + ecarts) | Pas encore fait | Vue double entree participants x resultats |
| P21 | Coach/admin: dates campagnes dans detail participants | Pas encore fait | Colonnes date debut/fin/maj |
| P22 | Niveau 1 resultats: scores | Fait | Base existante a verifier |
| P23 | Niveau 2: score transparence avec bouton activation coach | Fait | **Calcul** : `@aor/scoring/computeTransparencyScore` ; table F→P partagée dans `@aor/types` (`TRANSPARENCY_F_TO_P_TABLE` = max(F, 9−F)) ; formule `clamp(100 − ⌊100 × Σécart / (Σ P × peerCount)⌋, 0, 100)` ; 9 tests `tsx --test` dont golden case du livret (Σécart=87, ΣP=71, 3 pairs → 60). **DB** : migration `0015_clear_celestials.sql` ajoute 4 colonnes à `participant_progress` (value, peer_count, activated_at, activated_by_coach_id) + FK coaches + CHECK 0..100 ; snapshot figé à l'activation. **Backend** : 3 use cases (`Activate`, `Get` admin, `GetOwn` participant) ; endpoints `POST /admin/campaigns/:id/participants/:pid/transparency/activate`, `GET /admin/...transparency`, `GET /participant/campaigns/:id/transparency` ; super-admin résolu vers ligne sentinelle Admin (P05) ; audit log `admin.transparency.activate`. **Frontend** : carte `CampaignTransparencyCard` insérée entre Résultats et Retours du coach (verrouillée tant que non activé, score affiché en gros à droite + CTA « Voir les résultats »), page détail `/campaigns/$id/transparency` avec tableau dynamique (F, Pair #1..N, Écart #1..N, P) + table de conversion F→P + paragraphe « Étape III. Transparence » du livret + encadré Q/R/Score, bouton coach/admin par participant dans `CampaignParticipantsTable` (« Lancer le calcul » / « Repère X% — recalculer ») |
| P24 | Niveau 3: analyse IA supervisee par coach | Pas encore fait | Bouton lancement + edition + validation ; diffusion participant apres approbation |
| P25 | Journaliser IA utilisee (modele + prompt) | Pas encore fait | Trace indispensable pour audit/explicabilite |

## Priorisation proposee (reference initiale)

### Sprint 1 - Gouvernance et droits

- P01, P05, P06, P07, P19

### Sprint 2 - Parcours participant et feedback

- P08, P09, P10, P11, P12, P13, P17

### Sprint 3 - Resultats, synthese et IA

- P14, P15, P16, P18, P20, P21, P22, P23, P24, P25

### Etat au 2026-05-04

- Les items **P01, P02, P05, P06, P07, P08, P09, P10, P12, P13** sont **faits** (P12/P13 reportés du 2026-05-02 — la regression dans cette note a été corrigée).
- **P14 / P16** : implémentés dans le code ; statut **à valider en recette** (tests manuels ci-dessous).
- Le reste des **P03** et **P11, P14–P25** (hors P14/P16) est **pas encore fait** ; la checklist complementaire ci-dessus prolonge le PDF sans modifier les ID historiques.

### Etat au 2026-05-06

- **P23** (score de transparence) : **fait**. Activation manuelle par coach/admin, snapshot figé en base, page détail participant avec tableau dynamique + table de conversion + paragraphe livret. Voir détails dans la ligne P23 du tableau ci-dessus.
- Recette à mener avant clôture P23 :
  1. Appliquer la migration `pnpm --filter @aor/drizzle db:migrate` (ajoute 4 colonnes à `participant_progress` + FK + CHECK).
  2. Vérifier qu'un participant avec ≥1 feedback pair reçu **et** une réponse Élément Humain peut bien faire calculer son score (sinon erreur 400 attendue).
  3. Vérifier qu'un coach scope=coach ne voit/n'active que les participants de ses propres campagnes (filtrage via `ensureCampaignAccess`).
  4. Vérifier que le re-calcul (re-clic du bouton coach) écrase bien le snapshot précédent.
  5. Vérifier l'audit log `admin.transparency.activate` dans `audit_events` (champ `payload` doit contenir `campaign_id`, `value`, `peer_count`).

## Notes à tester

Recette manuelle suite aux changements matrice **feedbacks reçus** vs **donnés** (API `GET /participant/campaigns/:campaignId/matrix?peers=given|received`).

1. **Résultats participant** (`/campaigns/:id/results`) : avec au moins un pair ayant soumis un feedback **sur** le participant connecté, le tableau affiche des colonnes **`Pair #1`, `Pair #2`, …** (pas les prénoms) ; les valeurs correspondent aux notes **reçues**, pas aux notes que le participant a données à ses pairs.
2. **Vue admin/coach** (fiche participant → matrice, même questionnaire) : les colonnes pairs montrent les **noms des évaluateurs** (pas d’anonymat) et les **feedbacks reçus** par le participant consulté.
3. **Étape « Feedback des pairs »** (régression) : saisie et reprise des notations **vers** les pairs (`peers=given` par défaut) inchangée ; doublon / limite à 5 pairs toujours basés sur les feedbacks **émis** par le participant connecté.
4. **Export PDF** depuis la page résultats : vérifier que les libellés de colonnes pairs restent cohérents avec l’affichage anonyme à l’écran.
