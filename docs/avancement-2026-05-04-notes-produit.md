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
- [ ] Autoriser la poursuite du parcours feedback tant que moins de 5 pairs enregistres
- [ ] Exiger une confirmation explicite de fin de feedback pairs avant suite parcours/test
- [ ] Vue participant: afficher uniquement les scores de pairs anonymes (impl. — **à valider** : section *Notes à tester*)
- [ ] Tests 54x2: activer l'enregistrement automatique des reponses
- [ ] "Comment mes pairs me voient": afficher `pair #1`, `pair #2`, etc. (impl. — **à valider** : section *Notes à tester*)
- [ ] Limiter les commentaires feedback a 150 caracteres
- [ ] Tableau de synthese: afficher commentaires au survol + label d'ecart (sauf ecart 0)
- [ ] Vue coach/admin: pas d'anonymat
- [ ] Vue coach/admin: ajouter une matrice globale campagne (test + ecarts)
- [ ] Vue coach/admin: ajouter les dates de campagne dans le detail participants
- [ ] Resultats niveau 1: scores
- [ ] Resultats niveau 2: score de transparence active par bouton coach
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
| P12 | Feedback pairs: continuer tant que < 5 enregistres | Pas encore fait | Regle de progression a confirmer — a rapprocher du PDF (suppression du deverrouillage automatique au premier pair saisi) |
| P13 | Confirmation "j'ai termine les feedbacks" obligatoire | Pas encore fait | Etape de confirmation explicite avant questionnaire Element B |
| P14 | Vue participant resultats: seulement scores pairs anonymes | Fait | Implémentation: colonnes « pairs » = feedbacks **reçus** (`peers=received`), pas les scores donnés aux pairs. **À tester** — section **Notes à tester** ci-dessous. |
| P15 | Tests 54x2: autosave des reponses | Pas encore fait | Persistance intervallee + reprise session ; aligne avec enregistrement auto « regard sur soi » et Element B (PDF) |
| P16 | Affichage anonyme des pairs (`pair #1`, `pair #2`) | Fait | Libellés `Pair #1`… côté participant sur la vue résultats ; pas d’IDs pairs dans le JSON. **À tester** — section **Notes à tester** ci-dessous. |
| P17 | Limite commentaires feedback a 150 caracteres | Pas encore fait | Validation UI + backend |
| P18 | Tableau synthese: survol commentaires + label ecart sauf 0 | Pas encore fait | Definir table d'interpretation des ecarts |
| P19 | Coach/admin: pas d'anonymat | Pas encore fait | Visibilite nominative selon role |
| P20 | Coach/admin: vue globale campagne (matrice test + ecarts) | Pas encore fait | Vue double entree participants x resultats |
| P21 | Coach/admin: dates campagnes dans detail participants | Pas encore fait | Colonnes date debut/fin/maj |
| P22 | Niveau 1 resultats: scores | Fait | Base existante a verifier |
| P23 | Niveau 2: score transparence avec bouton activation coach | Pas encore fait | Workflow d'activation + audit |
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

- Les items **P01, P02, P05, P06, P07, P08, P09, P10** sont **faits**.
- **P14 / P16** : implémentés dans le code ; statut **à valider en recette** (tests manuels ci-dessous).
- Le reste des **P03** et **P11–P25** (hors P14/P16) est **pas encore fait** ; la checklist complementaire ci-dessus prolonge le PDF sans modifier les ID historiques.

## Notes à tester

Recette manuelle suite aux changements matrice **feedbacks reçus** vs **donnés** (API `GET /participant/campaigns/:campaignId/matrix?peers=given|received`).

1. **Résultats participant** (`/campaigns/:id/results`) : avec au moins un pair ayant soumis un feedback **sur** le participant connecté, le tableau affiche des colonnes **`Pair #1`, `Pair #2`, …** (pas les prénoms) ; les valeurs correspondent aux notes **reçues**, pas aux notes que le participant a données à ses pairs.
2. **Vue admin/coach** (fiche participant → matrice, même questionnaire) : les colonnes pairs montrent les **noms des évaluateurs** (pas d’anonymat) et les **feedbacks reçus** par le participant consulté.
3. **Étape « Feedback des pairs »** (régression) : saisie et reprise des notations **vers** les pairs (`peers=given` par défaut) inchangée ; doublon / limite à 5 pairs toujours basés sur les feedbacks **émis** par le participant connecté.
4. **Export PDF** depuis la page résultats : vérifier que les libellés de colonnes pairs restent cohérents avec l’affichage anonyme à l’écran.
