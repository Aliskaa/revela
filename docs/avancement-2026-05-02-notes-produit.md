# Avancement produit — Notes du 2026-05-02

> Objectif: transformer les notes en backlog actionnable avec suivi simple.
>
> Convention de statut:
> - `Pas encore fait`
> - `En cours`
> - `Fait`

## Checklist rapide

- [ ] L'admin peut etre un coach
- [ ] Bloquer la saisie des statuts `cloturee` / `archivee` sans creation prealable
- [ ] Ajouter une barre de recherche participant (liste participants)
- [ ] Definir `Actif` si invitation acceptee
- [ ] Reaffecter automatiquement les campagnes d'un coach supprime vers l'admin
- [ ] Retirer la creation de campagne autonome cote coach
- [ ] Retirer la creation/suppression d'entreprise cote coach
- [ ] Ajouter un bouton d'ajout manuel d'un participant a une campagne
- [ ] Rediriger vers le dashboard apres creation du compte participant
- [ ] Revenir au detail de campagne apres validation d'une etape du parcours
- [ ] Ajouter un commentaire optionnel pour les pairs lors des feedbacks
- [ ] Autoriser la poursuite du parcours feedback tant que moins de 5 pairs enregistres
- [ ] Exiger une confirmation explicite de fin de feedback pairs avant suite parcours/test
- [ ] Vue participant: afficher uniquement les scores de pairs anonymes
- [ ] Tests 54x2: activer l'enregistrement automatique des reponses
- [ ] "Comment mes pairs me voient": afficher `pair #1`, `pair #2`, etc.
- [ ] Limiter les commentaires feedback a 150 caracteres
- [ ] Tableau de synthese: afficher commentaires au survol + label d'ecart (sauf ecart 0)
- [ ] Vue coach/admin: pas d'anonymat
- [ ] Vue coach/admin: ajouter une matrice globale campagne (test + ecarts)
- [ ] Vue coach/admin: ajouter les dates de campagne dans le detail participants
- [ ] Resultats niveau 1: scores
- [ ] Resultats niveau 2: score de transparence active par bouton coach
- [ ] Resultats niveau 3: retours coach via analyse IA supervisee et validable
- [ ] Tracer le choix IA (modele + prompt) pour la transmission

## Tableau de suivi (fait / pas encore fait)

| ID | Sujet | Statut | Notes |
|---|---|---|---|
| P01 | Admin peut etre coach | Pas encore fait | Verifier role model + permissions + ecrans admin |
| P02 | Interdire `cloturee/archivee` sans creation prealable | Pas encore fait | Regle metier + validation backend + UI disable |
| P03 | Recherche participant dans liste | Pas encore fait | Champ recherche + filtrage nom/email |
| P04 | Statut participant "Actif" si invitation acceptee | Pas encore fait | Clarifier mapping exact des statuts |
| P05 | Suppression coach => campagnes reassignees admin | Pas encore fait | Trigger service de reassignment avant delete |
| P06 | Retirer creation campagne cote coach | Pas encore fait | Cacher UI + bloquer endpoint |
| P07 | Retirer creation/suppression entreprise cote coach | Pas encore fait | Cacher UI + bloquer endpoint |
| P08 | Ajout manuel d'un participant a une campagne | Pas encore fait | Bouton + modal + API association |
| P09 | Post-creation compte participant => dashboard | Pas encore fait | Verifier redirection login/activation |
| P10 | Fin etape parcours => retour detail campagne | Pas encore fait | Uniformiser navigation post-submit |
| P11 | Commentaire optionnel sur feedback pair | Pas encore fait | Ajouter champ optionnel |
| P12 | Feedback pairs: continuer tant que < 5 enregistres | Pas encore fait | Regle de progression a confirmer |
| P13 | Confirmation "j'ai termine les feedbacks" obligatoire | Pas encore fait | Etape de confirmation explicite |
| P14 | Vue participant resultats: seulement scores pairs anonymes | Pas encore fait | Cacher les autres vues non necessaires |
| P15 | Tests 54x2: autosave des reponses | Pas encore fait | Persistance intervallee + reprise session |
| P16 | Affichage anonyme des pairs (`pair #1`, `pair #2`) | Pas encore fait | Pseudonymisation stable par campagne |
| P17 | Limite commentaires feedback a 150 caracteres | Pas encore fait | Validation UI + backend |
| P18 | Tableau synthese: survol commentaires + label ecart sauf 0 | Pas encore fait | Definir table d'interpretation des ecarts |
| P19 | Coach/admin: pas d'anonymat | Pas encore fait | Visibilite nominative selon role |
| P20 | Coach/admin: vue globale campagne (matrice test + ecarts) | Pas encore fait | Vue double entree participants x resultats |
| P21 | Coach/admin: dates campagnes dans detail participants | Pas encore fait | Colonnes date debut/fin/maj |
| P22 | Niveau 1 resultats: scores | Pas encore fait | Base existante a verifier |
| P23 | Niveau 2: score transparence avec bouton activation coach | Pas encore fait | Workflow d'activation + audit |
| P24 | Niveau 3: analyse IA supervisee par coach | Pas encore fait | Bouton lancement + edition + validation |
| P25 | Journaliser IA utilisee (modele + prompt) | Pas encore fait | Trace indispensable pour audit/explicabilite |

## Priorisation proposee

### Sprint 1 - Gouvernance et droits

- P01, P05, P06, P07, P19

### Sprint 2 - Parcours participant et feedback

- P08, P09, P10, P11, P12, P13, P17

### Sprint 3 - Resultats, synthese et IA

- P14, P15, P16, P18, P20, P21, P22, P23, P24, P25

