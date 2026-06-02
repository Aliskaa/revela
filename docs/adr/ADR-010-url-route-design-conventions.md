# ADR-010: Conventions de design des URLs / nommage des routes

## Status

Accepted — complète [ADR-009](./ADR-009-presentation-controller-conventions.md) §5
(qui ne couvrait que les verbes HTTP, la sémantique `DELETE` et le nommage des
handlers). ADR-010 fixe la **structure des chemins** eux-mêmes.

## Date

2026-06-02

## Context

L'audit du 2026-06-02 ([docs/avancement-2026-06-02-presentation-routes.md](../avancement-2026-06-02-presentation-routes.md))
a montré que la **structure des URLs** n'est pas homogène. Exemples relevés :

```
GET   /admin/participants/80                                  # personne (entité)
GET   /admin/campaigns/2/participants/80/restitution         # participation (composition)
GET   /admin/participants/80/matrix?qid=S                     # qid en query
POST  /participant/campaigns/2/questionnaires/S1/submit       # qid en segment
GET   /participant/avatars/me                                 # "me" en suffixe
GET   /participant/me/export                                  # "me" en préfixe
GET   /admin/auth/me                                          # "me" sous auth
GET   /admin/export/responses?qid=                            # action en préfixe
GET   /participant/me/export                                  # action en suffixe
POST  /admin/campaigns/2/status                              # transition d'état en POST
PATCH /admin/campaigns/2/coach                               # transition d'état en PATCH
```

Constats clés :

- **Une partie de ces écarts est légitime** et reflète une vraie différence de
  domaine : `/admin/participants/80` (la *personne*) vs
  `/admin/campaigns/2/participants/80/restitution` (sa *participation* à une
  campagne, qui n'existe pas hors campagne). Ces imbrications **doivent rester**,
  mais être rendues lisibles par une règle explicite.
- **Le reste est arbitraire** : `qid` tantôt segment tantôt query, `me` à trois
  positions, `export` inversé selon l'acteur, transitions d'état tantôt `POST`
  tantôt `PATCH`.
- **Certaines parties sont déjà cohérentes** et ne doivent pas être cassées : le
  préfixe par acteur (`/admin`, `/participant`, `/invite`) aligné sur ADR-008, et
  le namespace `auth/` symétrique (`/{acteur}/auth/{login|refresh|logout|me}`).

Sans règle écrite, chaque nouvelle route réinvente sa structure.

## Decision

On adopte **six règles** de design d'URL, applicables à tout `presentation/`.

### R1 — Racines : acteur vs partagé

- Surface propre à un acteur → préfixe acteur : `/admin/…`, `/participant/…`,
  `/invite/…` (aligné ADR-008, segmentation par acteur).
- Catalogue partagé cross-acteur → ressource nue, sans préfixe : `/questionnaires`,
  `/scoring`.

### R2 — Segment vs query

- Un identifiant qui **sélectionne** une ressource adressable → **segment de chemin**
  (`/questionnaires/:qid/submit`, `/campaigns/:cid`).
- Un identifiant ou critère qui **filtre une collection ou paramètre une vue/rapport**
  → **query** (`?qid=`, `?page=`, `?company_id=`, `?q=`).
- **Troisième catégorie — dérivable du parent → ni segment, ni query, omis.** Une
  valeur entièrement déterminée par un segment parent n'apparaît pas dans l'URL ;
  elle est résolue côté serveur. `POST /…/questionnaires/:qid/submit` *sélectionne*
  le questionnaire (segment) ; mais sous une campagne, `qid` est **dérivable** :
  une campagne porte **un seul** `questionnaireId` ([campaign.entity.ts:32](../applications/backend/src/domain/campaigns/campaign.entity.ts#L32)),
  donc `/campaigns/:cid/…/matrix` détermine déjà le questionnaire → **on n'écrit pas
  `?qid=`**.
- **Attention — segment-vs-query ≠ profondeur.** Le placement d'un identifiant et le
  rattachement de la ressource sont deux dimensions distinctes. Le matrix illustre
  les deux : scope campagne en **segment** (R3, parce qu'un même couple
  `(participant, questionnaire)` existe dans plusieurs campagnes) **et** `qid`
  **omis** (dérivé de la campagne). Cible :
  `GET /admin/campaigns/:cid/participants/:pid/matrix` (sans `qid`), **pas**
  `/admin/participants/:pid/matrix?qid=S` (ambigu — voir bug latent §migration).
  La self-route dérive déjà le `qid` de l'assignation
  ([get-participant-session-questionnaire-matrix.usecase.ts:55](../applications/backend/src/application/participant-session/get-participant-session-questionnaire-matrix.usecase.ts#L55)).

### R3 — Imbrication : composition stricte, 2 ids max

- N'imbriquer (`/parent/:id/enfant/:id`) que si l'enfant **n'existe pas sans** le
  parent. Plafond : **2 identifiants** dans le chemin.
- **Deux axes coexistent légitimement** et sont documentés comme tels :
  - *axe personne* : `/admin/participants/:pid` (l'entité personne et ses
    attributs globaux **indépendants de toute campagne** : profil, avatar,
    invitations) ;
  - *axe participation* : `/admin/campaigns/:cid/participants/:pid/*` (ce qui
    n'existe que dans le contexte d'une campagne : transparency, restitution,
    **et le matrix de résultats**).
- **Critère de rattachement = la donnée existe-t-elle hors campagne ?** Les
  réponses (`self_rating`, `peer_rating`, `element_humain`) sont stockées **par
  campagne** ; un participant peut remplir le même questionnaire dans plusieurs
  campagnes. Donc tout ce qui dérive des réponses (matrix, transparency,
  restitution) appartient à l'*axe participation*. Seuls les attributs vraiment
  globaux (identité, profil RH, avatar) restent sur l'*axe personne*.
- Au-delà de 2 ids, repasser par le chemin canonique + query.

### R4 — Soi-même : pas de `/me` redondant sous un namespace déjà self

- `/participant` (et `/invite`) **est déjà** l'acteur authentifié (résolu par JWT) :
  les données « moi » n'ajoutent **pas** de segment `/me`.
  → `/participant/profile`, `/participant/export`, `/participant/session`,
  `/participant/profile/avatar`.
- `/me` n'a de sens que là où il faut distinguer l'acteur **de ce qu'il gère**,
  c'est-à-dire sous `/admin` : `/admin/auth/me`.
- Exception conservée pour la **symétrie du namespace `auth/`** :
  `/participant/auth/me` reste (claims du JWT), en miroir de `/admin/auth/me`.

### R5 — Actions vs transitions d'état (précise ADR-009 §5)

- Transition d'état d'une ressource existante → **`PATCH`**, sans verbe dans l'URL
  au-delà du sous-attribut : `PATCH /campaigns/:cid/status`, `PATCH /campaigns/:cid/coach`.
- Une transition n'est **pas** un nouvel endpoint dédié : `archive` est
  `PATCH /campaigns/:cid/status` body `{ status: 'archived' }`, pas `POST /…/archive`.
- Opération métier réelle non réductible à une MAJ de champ → `POST /{ressource}/{verbe}`
  (`/restitution/generate`, `/restitution/approve`, `/restitution/reject`,
  `/transparency/activate`).
- Créer une sous-ressource → `POST` sur la **sous-collection**, pas un verbe :
  les invitations sont `POST /campaigns/:cid/invitations` et
  `POST /participants/:pid/invitations` (pas `/invite-company-participants` ni `/invite`).

### R6 — Représentations en suffixe

- Une représentation/export d'une ressource est un **suffixe** de cette ressource,
  jamais un préfixe : `GET /admin/responses/export`, `GET /admin/responses/export/anonymized`,
  `GET /participant/export`. Plus de `/export/<ressource>`.

### Stratégie d'application : migration complète

Décision (2026-06-02) : on **migre l'existant non conforme en une passe**, en
coordonnant la rupture de contrat côté frontend dans la foulée (pas d'approche
additive ni d'alias). La liste exhaustive avant→après et le suivi vivent dans
[docs/avancement-2026-06-02-presentation-routes.md](../avancement-2026-06-02-presentation-routes.md),
section « Conventions de design des URLs ». Les imbrications de l'*axe participation*
(R3) et le namespace `auth/` ne changent pas.

## Consequences

### Positives

- **Une ressource = un chemin canonique** ; les deux axes (personne / participation)
  sont intentionnels et documentés, plus subis.
- **Prévisibilité** : `qid` segment vs query, `export` en suffixe, transitions en
  `PATCH`, pas de `/me` redondant — un dev devine le chemin sans le chercher.
- **Symétrie acteur** : `/admin` et `/participant` lisibles en miroir, `auth/`
  identique des deux côtés.

### Coûts assumés

- **Rupture de contrat frontend** : ~11 routes changent de chemin et/ou de verbe
  (cf. table de migration). Le frontend doit être mis à jour dans la même PR/vague.
- **Fenêtre de migration** : pendant le déploiement, anciens et nouveaux chemins ne
  coexistent pas (choix « migration complète » sans alias) → backend et frontend
  doivent partir ensemble.

## Guardrails (règles de revue)

- Rejeter tout `export`/représentation en préfixe (`/export/<x>`).
- Rejeter tout `POST /<ressource>/<transition-d-état>` réductible à un `PATCH`.
- Rejeter tout segment `/me` ajouté sous `/participant` ou `/invite`.
- Rejeter toute imbrication > 2 ids ou non justifiée par une composition stricte.
- Rejeter un `qid` (ou autre sélecteur de collection/vue) promu en segment quand il
  filtre, et inversement.
- **Backend ↔ frontend indissociables.** Toute modification d'une route (chemin,
  verbe HTTP, query/segment, forme du body ou de la réponse) **oblige** à revoir et
  mettre à jour le frontend dans la **même PR/vague** — stratégie « migration complète
  sans alias », les anciens chemins ne survivent pas au déploiement. Rejeter toute PR
  qui change une route backend sans inclure son consommateur frontend
  (`applications/frontend/src/hooks/*` — notamment `admin.ts`, `participantSession.ts` —,
  routes/loaders appelant l'API, tests de contrat/e2e). Une route changée sans son
  consommateur = régression en production.

## Alternatives Considered

- **Application additive (nouveau conforme, ancien laissé tel quel)** : envisagée,
  écartée par décision produit du 2026-06-02 au profit d'une migration complète
  pour ne pas laisser de dette résiduelle.
- **Additif + alias temporaires** (double exposition puis bascule) : écarté pour la
  même raison — surcoût de maintien des deux surfaces jugé non nécessaire ici.
- **Généraliser `/me` partout** (`/participant/me/*`) plutôt que le supprimer :
  écarté — `/participant` est déjà self-scopé par le JWT ; ajouter `/me` est
  redondant et n'apporte de l'information que sous `/admin`.
- **Promouvoir `qid` en segment partout** (`/participants/:pid/questionnaires/:qid/matrix`) :
  écarté — le matrix est un rapport paramétré, pas une sous-ressource adressable
  (R2). Garder `qid` en query reste cohérent avec `/responses?qid=`.

## References

- [ADR-009](./ADR-009-presentation-controller-conventions.md) §5 — verbes, `DELETE`,
  nommage des handlers ; ADR-010 en est le prolongement sur la structure des chemins.
- [ADR-008](./ADR-008-backend-layer-first-with-actor-segmentation.md) — segmentation
  par acteur, à l'origine du préfixe `/admin` `/participant` (R1).
- [docs/avancement-2026-06-02-presentation-routes.md](../avancement-2026-06-02-presentation-routes.md)
  — table de migration exhaustive et suivi d'exécution.
