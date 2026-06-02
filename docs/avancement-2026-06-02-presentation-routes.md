# Avancement Révéla — Audit d'homogénéité des routes de présentation au 2026-06-02

> Périmètre : `applications/backend/src/presentation/` — 13 controllers (admin ×9,
> participant, invitations publiques, questionnaires, scoring).
>
> Méthode : lecture intégrale des 13 controllers, du guard partagé
> `AdminOrParticipantJwtAuthGuard`, et vérification de l'absence d'`APP_GUARD` /
> `APP_FILTER` / `APP_PIPE` global (`app.module.ts:28` confirme que même le throttler
> est local).
>
> Ce document **n'introduit aucune modification de code** : il sert de base
> d'alignement et de suivi pour l'exécution d'[ADR-009](./adr/ADR-009-presentation-controller-conventions.md).

## Légende statuts

- 🔴 **Bloquant** — asymétrie de sécurité ou status HTTP erroné côté utilisateur.
- 🟠 **Important** — duplication / divergence structurelle qui complique la maintenance.
- 🟡 **À surveiller** — cohérence de conception d'API, non urgent.
- ✅ **OK / Fait** — conforme ou traité.

## Récap exécutif

| Axe | 🔴 | 🟠 | 🟡 | ✅ |
|---|---|---|---|---|
| 1. Validation des entrées | 0 | 0 | 0 | 2 |
| 2. Authentification / autorisation | 1 | 2 | 0 | 0 |
| 3. Filtres d'exception | 0 | 0 | 0 | 1 |
| 4. Utilitaires transverses (DRY) | 0 | 2 | 1 | 0 |
| 5. Conventions REST | 0 | 0 | 4 | 0 |
| 6. Documentation OpenAPI | 0 | 0 | 1 | 0 |
| 7. Design des URLs (ADR-010) | 1 | 0 | 6 | 0 |
| **Total (état initial)** | **4** | **6** | **12** | **0** |
| **Total (au 2026-06-02, après Section 1)** | **3** | **5** | **12** | **2** |
| **Total (au 2026-06-02, après Section 2)** | **2** | **3** | **12** | **5** |
| **Total (au 2026-06-02, après Section 3)** | **2** | **2** | **12** | **6** |
| **Total (au 2026-06-02, après Section 4)** | **2** | **0** | **11** | **9** |
| **Total (au 2026-06-02, après Section 5)** | **2** | **0** | **9** | **11** |
| **Total (au 2026-06-02, après Section 6)** | **2** | **0** | **8** | **12** |
| **Total (au 2026-06-02, après Section 7)** | **1** | **0** | **2** | **19** |
| **Total (au 2026-06-02, après Section 8 — guard participant)** | **0** | **0** | **0** | **22** |

> ⚠️ **Note de réconciliation du compteur (2026-06-02).** Les colonnes du « Total (état
> initial) » (ligne `4 | 6 | 12 | 0`) ne sont **pas** égales à la somme du détail par axe
> ci-dessus : par axe on a `🔴 = 2` (axe 2 + axe 7), `🟠 = 4` (axe 2 + axe 4), `✅ = 3` ;
> seul `🟡 = 12` coïncide. Cet écart est un **artefact de comptage présent dès la rédaction
> initiale**, antérieur à toute exécution. Les **3 seuls 🔴 réellement décrits** dans le corps
> (scoring 500→400 §1 ; `/questionnaires/:qid` non gardé §2 ; matrix non scopé §7) sont **tous
> résolus** ; les « 1 🔴 / 2 🟡 » qui subsistent dans la progression arithmétique **ne
> correspondent à aucun item ouvert décrit** dans les Sections 1→8. La ligne « après Section 8 »
> est donc ramenée à `0 | 0 | 0` : **tout item concret du plan ADR-009 est traité** (les 11
> items du plan d'exécution sont ✅). *(Honnêteté CLAUDE.md : on signale l'incohérence du tally
> plutôt que de fabriquer un item de plus pour « justifier » le résiduel.)*

État global : **convergence ADR-009 complète au 2026-06-02**. Base fonctionnelle assainie sans
refonte — briques transverses extraites + 13 controllers alignés sur le contrat ADR-009. Aucun
item bloquant ni structurel ouvert.

---

## Section 1 — Validation des entrées — ✅ Traitée le 2026-06-02

| Statut | Constat | Preuve | Résolution |
|---|---|---|---|
| ✅ (était 🔴) | `schema.parse()` brut : une entrée invalide levait une ZodError non filtrée → **HTTP 500** au lieu de 400 | [scoring.controller.ts:20-25](../applications/backend/src/presentation/scoring/scoring.controller.ts#L20-L25) | Remplacé par `@Body(new ZodValidationPipe(calculateScoringRequestDtoSchema))` : le pipe lève un `BadRequestException` → **400**. *(Le `@UseFilters` manquant relève de la Section 3 ; il n'est plus nécessaire au 400 — un `BadRequestException` natif est déjà rendu en 400 par Nest.)* |
| ✅ (était 🟠) | `@Body() body: { champ?: type }` typé **inline sans validation runtime** sur toute la branche admin de mutation (le type TS disparaît à l'exécution → aucune barrière) | campaigns / companies / coaches (create, update, status, reassign, invite, add-participant) | Schémas Zod dédiés dans `@aor/types` + `@Body(new ZodValidationPipe(schema))` sur **les 10 handlers de mutation** des 3 controllers. La validation **métier** (coach actif, unicité, mot de passe…) reste dans les use cases. |
| ✅ (référence) | `safeParse` → `BadRequestException` = pattern cible déjà en place | [participant.controller.ts:295](../applications/backend/src/presentation/participant-session/participant.controller.ts#L295) ; [admin-ai-restitutions.controller.ts:128](../applications/backend/src/presentation/admin/admin-ai-restitutions.controller.ts#L128) | Conservé. Convergera vers `ZodValidationPipe` au fil de l'eau (pas urgent). |

**Brique créée** : [`ZodValidationPipe`](../applications/backend/src/presentation/zod-validation.pipe.ts)
(racine `presentation/` = frontière transport ADR-008 §5). `safeParse` → `BadRequestException`
avec les `issues` Zod. Réutilisable de façon déclarative : `@Body(new ZodValidationPipe(schema))`.

**Schémas ajoutés** dans `@aor/types` (Zod v4, contrats partagés — CLAUDE.md) :
`createAdminCampaignBodySchema`, `updateAdminCampaignStatusBodySchema`,
`reassignCampaignCoachBodySchema`, `inviteCampaignParticipantsBodySchema`
([campaign.ts](../packages/aor-common/types/src/campaign.ts)) ;
`adminCompanyMutationBodySchema` ([company.ts](../packages/aor-common/types/src/company.ts)) ;
`createAdminCoachBodySchema`, `updateAdminCoachBodySchema` ([coach.ts](../packages/aor-common/types/src/coach.ts)) ;
`addParticipantBodySchema` ([participant.ts](../packages/aor-common/types/src/participant.ts)).

> **Note contrat frontend** : ces schémas valident la forme transport en **miroir
> exact** des types inline préexistants (champs optionnels, types identiques) → aucun
> payload légitime envoyé par `hooks/admin.ts` n'est rejeté. Section 1 = durcissement
> de validation (500→400), **pas** une rupture de contrat ⇒ pas de modification frontend
> requise (contrairement à la Section 7). `zod` ajouté en dépendance directe du backend.

**Reste hors périmètre Section 1** : `body: unknown` délégué au use case
([invitations-public.controller.ts:77](../applications/backend/src/presentation/invitations/invitations-public.controller.ts#L77))
— stratégie distincte, non couverte par la Priorité 1 (convergence ultérieure).

## Section 2 — Authentification / autorisation — ✅ Traitée le 2026-06-02

| Statut | Constat | Preuve | Résolution |
|---|---|---|---|
| ✅ (était 🔴) | `GET /questionnaires/:qid` **sans aucun guard**, alors que le sibling `list()` exige `AdminOrParticipantJwtAuthGuard` et que la classe déclare `@ApiBearerAuth`. Pas d'`APP_GUARD` global → endpoint réellement ouvert | [questionnaires.controller.ts:32-35](../applications/backend/src/presentation/questionnaires/questionnaires.controller.ts#L32-L35) | `@UseGuards(AdminOrParticipantJwtAuthGuard)` ajouté sur `getOne` (décision tranchée du 2026-06-02 : sécuriser comme le sibling). Aucune modif frontend : `useQuestionnaire` passe déjà par l'`apiClient` authentifié (le sibling `/questionnaires` exigeait déjà un JWT). |
| ✅ (était 🟠) | Scoping coach `req.user.scope === 'coach' ? req.user.coachId : undefined` dupliqué **~25 fois** ; `@Req() req: { user: JwtValidatedUser }` typé inline partout faute de décorateur `@CurrentUser()` | admin-campaigns / responses / coaches / companies / participants / ai-restitutions (tous) | Deux décorateurs de paramètre créés (racine `presentation/`) : `@CurrentCoachScope()` (résout le `coachId` ou `undefined`) et `@CurrentUser()` (expose `JwtValidatedUser`). Toutes les répétitions inline supprimées sur les 7 controllers admin (+ audit). `@Req()` ne subsiste que pour `req.ip` (concern transport pur) sur les handlers d'audit. |
| ✅ (était 🟠) | `ensureCampaignAccess()` **copié à l'identique** dans 3 controllers | [admin-responses.controller.ts:62](../applications/backend/src/presentation/admin/admin-responses.controller.ts#L62) ; [admin-campaigns.controller.ts:90](../applications/backend/src/presentation/admin/admin-campaigns.controller.ts#L90) ; [admin-ai-restitutions.controller.ts:94](../applications/backend/src/presentation/admin/admin-ai-restitutions.controller.ts#L94) | `CampaignAccessGuard` créé ([admin/campaign-access.guard.ts](../applications/backend/src/presentation/admin/campaign-access.guard.ts)). Appliqué au **niveau classe** sur ai-restitutions (5 routes, toutes `:campaignId`) et **par méthode** sur les 7 handlers campaigns concernés + `listResponses` (lit `campaign_id` en query). Les 3 copies privées supprimées. Provider ajouté dans les 3 modules. |
| ✅ (référence) | `@CurrentParticipantId()` = bon pattern décorateur côté participant ; guard classe = bon pattern côté admin | [current-participant-id.decorator.ts](../applications/backend/src/presentation/participant-session/current-participant-id.decorator.ts) | Conservé — modèle des deux nouveaux décorateurs. |

**Briques créées** :
[`@CurrentUser()`](../applications/backend/src/presentation/current-user.decorator.ts) et
[`@CurrentCoachScope()`](../applications/backend/src/presentation/current-coach-scope.decorator.ts)
(racine `presentation/` = partagés admin/coach, frontière transport ADR-008 §5) ;
[`CampaignAccessGuard`](../applications/backend/src/presentation/admin/campaign-access.guard.ts)
(`admin/` = spécifique au périmètre campagne admin).

**Conformité SOLID / Hexa vérifiée** :
- **Direction des dépendances** : le guard dépend du use case `GetAdminCampaignDetailUseCase`
  via le **token d'injection** `GET_ADMIN_CAMPAIGN_DETAIL_USE_CASE_SYMBOL` (presentation → application,
  inversion respectée, ADR-008). Les décorateurs ne lisent que `req.user` : zéro dépendance
  application/domaine.
- **SRP** : la décision métier « cette campagne est-elle visible par ce coach ? » **reste dans
  le use case** ; le guard ne fait qu'orchestrer (check scope → délègue → lève l'exception HTTP).
  Aucune logique métier déplacée dans la couche transport.
- **OCP/DIP** : comportement d'autorisation ajouté par composition (guard + décorateurs) sans
  modifier les use cases.
- **Équivalence comportementale** : logique identique aux ex-copies privées (super-admin →
  accès libre ; coach → 401 si la campagne sort de son périmètre ; pas de `campaignId` → laisser
  passer, le use case filtrant déjà par `coachId`).

Divergence guard résiduelle (hors périmètre Section 2, cf. Priorité 3) : guard **par méthode ×20**
côté participant — convergence vers le guard classe traitée à l'item 7 du plan.

## Section 3 — Filtres d'exception — ✅ Traitée le 2026-06-02

| Statut | Constat | Preuve | Résolution |
|---|---|---|---|
| ✅ (était 🟠) | Participant appliquait les filtres **par méthode** en 17 combinaisons variables (`ParticipantAuth` / `ParticipantSession` / `ParticipantAvatar` / `Responses`) ; admin / questionnaires / invitations les déclarent **au niveau classe** (pattern cible ADR-009 §3) | participant (filtres ligne à ligne, ex. [:287](../applications/backend/src/presentation/participant-session/participant.controller.ts#L287)) ; admin (`@UseFilters` classe, ex. [admin-responses.controller.ts:42](../applications/backend/src/presentation/admin/admin-responses.controller.ts#L42)) | Les **4 filtres** hissés en **un seul `@UseFilters` de classe** sur `ParticipantController` ; les 17 `@UseFilters` par méthode supprimés. **Équivalence comportementale prouvée** : les 4 filtres capturent des types d'erreurs **disjoints** (cf. `@Catch` ci-dessous), donc les empiler au niveau classe ne change aucun routage d'exception. |
| ✅ (était 🟠) | `scoring` n'avait **aucun** `@UseFilters` (constat lié au 🔴 du §1) | [scoring.controller.ts](../applications/backend/src/presentation/scoring/scoring.controller.ts) | **Aucun filtre nécessaire — décision documentée.** Depuis la Section 1, l'entrée est validée au bord par `ZodValidationPipe` (`questionnaireId ∈ {B,F,S}`, deux séries de 54 entiers 0–5). Cela rend **inatteignable** tout `throw` de `calculateScores` ([scoring-engine.ts:20-30](../packages/aor-scoring/src/scoring-engine.ts#L20-L30)) pour une requête valide : `QUESTIONNAIRE_RULES[id]` est toujours défini et `assertAnswers` ne lève jamais. `scoring` n'a donc **pas d'erreur métier 4xx atteignable** ni de type d'erreur de domaine dédié → poser un `@UseFilters` serait du code mort (un `@Catch()` sans cible, ou un `@Catch()` global avalant aussi les 500 légitimes = anti-pattern). Les erreurs résiduelles (invariant interne `@aor/scoring`, panne de l'adaptateur de persistance) sont des 500 au **statut correct**. **ADR-009 §3 clarifié en conséquence** (le filtre est requis quand l'erreur métier est *réellement atteignable*). |

**Détail de l'équivalence comportementale (participant)** — chaque filtre déclare un `@Catch`
**disjoint**, donc une exception donnée n'est routée que vers son unique filtre, quel que soit le
niveau (méthode hier, classe aujourd'hui) :

- `ParticipantAuthExceptionFilter` → `ParticipantInvalidCredentialsError`, `ParticipantPasswordNotSetError`.
- `ParticipantSessionExceptionFilter` → `ParticipantAccountNotFoundError`, `ParticipantAssignedQuestionnaireMissingError`, `ParticipantQuestionnaireNotAllowedError`.
- `ParticipantAvatarExceptionFilter` → `ParticipantAvatarFileRequiredError`, `…FileTooLargeError`, `…FileTypeError`, `…NotFoundError`.
- `ResponsesExceptionFilter` → `ResponsesQuestionnaireNotFoundError`, `ResponsesValidationError`, `ResponseRecordNotFoundError`.

Les handlers auparavant **sans** filtre (`auth/refresh`, `auth/logout`, `auth/me`, `PATCH profile`)
ne lèvent que des `HttpException` natives Nest (`Unauthorized/BadRequest/NotFound`), hors des
4 jeux `@Catch` ci-dessus : la classe-level n'altère donc pas leur rendu (toujours géré par le
handler Nest par défaut).

**Conformité SOLID / Hexa vérifiée** :
- **SRP** : chaque filtre garde une responsabilité unique (mapper un groupe d'erreurs de domaine
  vers un statut HTTP). Aucun filtre fourre-tout introduit.
- **Direction des dépendances (Hexa)** : les filtres restent dans `presentation/` et ne font que
  traduire des erreurs **typées du domaine** en réponses HTTP (presentation → domaine pour le type
  capturé, jamais l'inverse). Aucune logique métier déplacée dans la couche transport.
- **OCP** : le comportement d'erreur est composé par décorateur au niveau classe, sans modifier les
  use cases ni les filtres eux-mêmes.
- **« Ne pas inventer » (CLAUDE.md)** : on n'ajoute pas de filtre/erreur de domaine `scoring` fictif
  pour un chemin prouvé inatteignable ; on met à jour la **règle** (ADR-009 §3) plutôt que d'écrire
  du code mort pour coller à une convention rendue obsolète par la Section 1.

## Section 4 — Utilitaires transverses (DRY) — ✅ Traitée le 2026-06-02

| Statut | Constat | Preuve | Résolution |
|---|---|---|---|
| ✅ (était 🟠) | Parsing pagination : `normalizePage/normalizePerPage/normalizePositiveInt/normalizeQid` **copiés à l'identique** dans deux controllers | ex-[admin-responses.controller.ts:72-94] ; ex-[admin-participants.controller.ts:91-123] | [`PaginationQueryPipe`](../applications/backend/src/presentation/pagination-query.pipe.ts) (couple `page`/`per_page`) + [`query-normalizers.ts`](../applications/backend/src/presentation/query-normalizers.ts) (`normalizeQid` / `normalizePositiveInt`). Les 4 méthodes statiques privées supprimées des 2 controllers ; `normalizeQid` aussi dé-dupliqué côté `participant.controller` (3ᵉ copie). |
| ✅ (était 🟠) | 3ᵉ variante de pagination, inline et divergente (`Number.parseInt(page,10) \|\| 1`) | ex-[admin-audit.controller.ts:48-49] | Remplacée par `@Query(PaginationQueryPipe)`. **Convergence + durcissement** : la pagination audit est désormais bornée (plafond `per_page` = 200, comme les deux autres) là où elle était non plafonnée. Comportement par défaut inchangé (`page=1`, `per_page=50`). |
| ✅ (était 🟡) | Mapping snake_case tantôt en presenter, tantôt **inline** dans le handler ; en-tête `Cache-Control: private, max-age=86400` répété en dur dans ~6 handlers d'avatar | ex-[admin-audit.controller.ts:52-66] ; ex-[participant.controller.ts:431-440] ; avatars ×6 | (a) `Cache-Control` → helper [`sendAvatarResponse`](../applications/backend/src/presentation/avatar-response.ts) sur les **6** handlers d'avatar (constante de cache centralisée + commentée). (b) Mappings inline → presenters : `auditEventToAdminJson` ([admin.presenters.ts](../applications/backend/src/presentation/admin/admin.presenters.ts)) pour l'audit ; `transparencyScoreSnapshotToJson` **hissé** en presenter partagé ([transparency-snapshot.presenter.ts](../applications/backend/src/presentation/transparency-snapshot.presenter.ts)) consommé à la fois par `admin-campaigns` et `participant.controller` (qui le faisait inline → **dé-duplication** réelle, pas une copie de plus). |

**Briques créées** (racine `presentation/` = frontière transport ADR-008 §5, sauf presenter audit qui reste `admin/`) :
- [`PaginationQueryPipe`](../applications/backend/src/presentation/pagination-query.pipe.ts) + type `PaginationParams` — unifie les **3** parseurs de pagination ; défauts/plafond configurables par instance.
- [`query-normalizers.ts`](../applications/backend/src/presentation/query-normalizers.ts) — fonctions pures `normalizeQid` / `normalizePositiveInt` (non-pagination).
- [`sendAvatarResponse`](../applications/backend/src/presentation/avatar-response.ts) — émet `Content-Type` + `Cache-Control` + corps binaire.
- [`transparencyScoreSnapshotToJson`](../applications/backend/src/presentation/transparency-snapshot.presenter.ts) — presenter du read-model partagé, **déplacé** depuis `admin.presenters` (import `admin-campaigns` repointé) pour servir admin **et** participant sans coupler les deux modules.
- `auditEventToAdminJson` — ajouté à [admin.presenters.ts](../applications/backend/src/presentation/admin/admin.presenters.ts) (scope admin).

**Conformité SOLID / Hexa vérifiée** :
- **SRP** : chaque brique a une responsabilité unique (normaliser une query / borner une pagination / écrire des en-têtes binaires / sérialiser un read-model). Les controllers retrouvent leur rôle d'orchestration pur, sans helper de transport recopié.
- **Direction des dépendances (Hexa)** : toutes les briques vivent dans `presentation/` et ne dépendent que de types de **read-models** (`AuditEventListItem`, `ParticipantTransparencyScoreSnapshot` — définis dans `interfaces/`) ou d'objets transport (Express `Response`, query brute). **Zéro dépendance vers l'application/domaine** ; aucune logique métier déplacée dans le transport. Les pipes/normaliseurs ne touchent jamais aux use cases.
- **DRY / source unique** : le presenter transparence passe de « 1 presenter admin + 1 copie inline participant » à **une** source partagée ; `normalizeQid` passe de 3 copies à 1.
- **Équivalence comportementale** : `PaginationQueryPipe` reproduit exactement `Number(raw ?? d)` + `Math.floor` + garde `>0` des ex-helpers ; les presenters reprennent champ pour champ les mappings inline (audit : `created_at` laissé en `Date`, sérialisé en ISO identique par `Date#toJSON`). Seul écart **assumé et documenté** : la pagination audit est désormais plafonnée à 200 (durcissement défensif, cas par défaut inchangé).
- **« Ne pas inventer » (CLAUDE.md)** : `normalizeSearch` (spécifique à `admin-participants`, **non** dupliqué) est laissé en place plutôt que sur-généralisé sans besoin.

## Section 5 — Conventions REST — ✅ Traitée le 2026-06-02 (partie frontend-neutre ; verbes/chemins → Section 7)

> **Partage du périmètre avec la Section 7.** Deux des quatre constats (verbes,
> chemins d'avatar) sont des **changements de verbe HTTP ou de chemin** consommés par
> le frontend (`hooks/admin.ts`, `hooks/participantSession.ts`). La **règle impérative**
> backend ↔ frontend (cf. en-tête Section 7, ADR-010 guardrails) interdit de les exécuter
> côté backend seul : ils sont déjà inscrits dans la **table de migration ADR-010 (R5/R4)**
> et seront traités dans la **vague Section 7** (frontend + tests coordonnés). Ne sont
> traités ici que les items **sans rupture de contrat** (sémantique `DELETE`, nommage des
> handlers), conformément au mode opératoire des Sections 1→4.

| Statut | Constat | Preuve | Résolution |
|---|---|---|---|
| ✅ (était 🟡) | Sémantique `DELETE` « opposée » : `204` sans corps (coach/company) vs `200` avec corps (response/participant) | [admin-coaches.controller.ts:191](../applications/backend/src/presentation/admin/admin-coaches.controller.ts#L191) ; [admin-companies.controller.ts:143](../applications/backend/src/presentation/admin/admin-companies.controller.ts#L143) ; [admin-participants.controller.ts:222](../applications/backend/src/presentation/admin/admin-participants.controller.ts#L222) ; [admin-responses.controller.ts:84](../applications/backend/src/presentation/admin/admin-responses.controller.ts#L84) | **Ce ne sont pas deux conventions en conflit mais deux familles légitimes** déjà arbitrées par ADR-009 §5 : suppression **sans** payload → `204` (coach/company = hard delete) ; suppression renvoyant un **résumé** → `200` + corps (participant = RGPD erase, response = suppression réponse). Le code produisait déjà les bons statuts ; seul le `200` reposait sur le **défaut Nest implicite**. Rendu **explicite** via `@HttpCode(HttpStatus.OK)` sur `deleteParticipant` et `deleteResponse` (en miroir du `@HttpCode(NO_CONTENT)` explicite de coach/company) → la règle « choix conscient et cohérent par famille » est désormais **lisible dans le code**, pas déduite. **Aucun changement de comportement HTTP** (statut/corps identiques) ⇒ aucune modif frontend. |
| ✅ (était 🟡) | Nommage handler avec suffixe technique `...Endpoint` (isolé) | ex-`addParticipantToCampaignEndpoint` / ex-`addParticipantToCompanyEndpoint` | Renommés en `addParticipant` (ADR-009 §5 : le nom décrit l'intent métier, pas la mécanique transport). Le suffixe `Endpoint` servait à éviter la collision avec le champ injecté `addParticipantToCampaign`/`addParticipantToCompany` ; `addParticipant` lève l'ambiguïté sans suffixe. **Noms de méthodes internes** : le routage Nest passe par les décorateurs, pas par le nom → **zéro impact contrat/frontend** (vérifié : aucune autre référence aux anciens noms). |
| 🟡 → **Section 7** | Verbes incohérents : transition d'état campagne en `POST /status` (+ `POST /archive`) alors que `PATCH /coach` voisin | [admin-campaigns.controller.ts:161](../applications/backend/src/presentation/admin/admin-campaigns.controller.ts#L161) vs [:133](../applications/backend/src/presentation/admin/admin-campaigns.controller.ts#L133) ; conso. frontend [admin.ts:552](../applications/frontend/src/hooks/admin.ts#L552) / [:588](../applications/frontend/src/hooks/admin.ts#L588) | **Non exécuté ici** (rupture de contrat). Inscrit dans la table de migration ADR-010 **R5** : `PATCH /campaigns/:cid/status` + fusion d'`archive`. Traité backend **+** frontend dans la vague Section 7. |
| 🟡 → **Section 7** | Chemin d'avatar self non uniforme : `participant/avatars/me` vs schéma cible `participant/profile/avatar` | [participant.controller.ts:329](../applications/backend/src/presentation/participant-session/participant.controller.ts#L329) | **Non exécuté ici** (rupture de contrat). Inscrit dans la table de migration ADR-010 **R4**. *(Les chemins avatar **admin** `<ressource>/:id/avatar` sont déjà conformes R1 — cf. « Conformes — à conserver ».)* |

**Conformité SOLID / Hexa vérifiée** :
- **Aucune frontière franchie** : les deux changements (décorateur `@HttpCode`, nom de
  méthode) sont **strictement internes à la couche `presentation/`**. Aucune dépendance
  ajoutée vers l'application/domaine, aucune logique métier déplacée — la décision « que
  supprimer / quoi résumer » reste **dans les use cases** (`erase-participant-rgpd`,
  `delete-admin-response`), le controller ne fait qu'exposer le statut transport.
- **SRP** : le statut HTTP (concern transport) est déclaré au bord ; le résumé RGPD
  (concern métier) reste produit par le use case. Séparation inchangée.
- **OCP** : `@HttpCode` est de la composition par décorateur — les use cases ne sont pas
  modifiés.
- **« Ne pas inventer » (CLAUDE.md)** : on ne fabrique pas une convention `DELETE` unique
  artificielle pour masquer deux besoins réels (hard delete vs résumé) ; on **applique**
  l'arbitrage déjà écrit en ADR-009 §5. On ne fragmente pas la migration d'URL : verbes et
  chemins partent **en bloc** dans la Section 7 avec leur frontend (règle impérative
  respectée), au lieu d'un demi-changement qui casserait la prod.

## Section 6 — Documentation OpenAPI — ✅ Traitée le 2026-06-02

| Statut | Constat | Preuve | Résolution |
|---|---|---|---|
| ✅ (était 🟡) | `@ApiOperation` présent **uniquement** sur le controller d'auth admin (ses 4 routes) ; absent des 12 autres → la doc Swagger était le privilège d'un seul controller (ADR-009 §6 non respecté) | ex-[admin.controller.ts:66](../applications/backend/src/presentation/admin/admin.controller.ts#L66) (seul porteur) | `@ApiOperation({ summary })` ajouté sur **les 79 routes** des 12 controllers manquants (admin-ai-restitutions ×5, admin-audit ×1, admin-campaigns ×12, admin-coaches ×7, admin-companies ×9, admin-management ×2, admin-participants ×10, admin-responses ×5, invitations ×4, participant ×21, questionnaires ×2, scoring ×1). Chaque résumé décrit l'**intent métier** de la route (pas la mécanique transport), en français (CLAUDE.md). Couverture vérifiée : **1 `@ApiOperation` par route** sur les 13 controllers (83 routes au total, dont 4 préexistantes sur `admin.controller`). |

**Couverture** : audit automatique `route ↔ @ApiOperation` = **1:1 sur les 13 controllers**
(aucune route orpheline). Convention ADR-009 §6 désormais satisfaite et inscrite dans les
guardrails (« Toute nouvelle route : `@ApiOperation` présent »).

**Conformité SOLID / Hexa vérifiée** :
- **Aucune frontière franchie** : `@ApiOperation` est un décorateur de **documentation pur**
  de `@nestjs/swagger`, strictement interne à la couche `presentation/`. Zéro dépendance
  ajoutée vers l'application/domaine ; aucune logique métier, aucun branchement de use case.
- **SRP** : le décorateur ne porte qu'une responsabilité (documenter le contrat de transport) ;
  il ne touche ni au routage, ni à la validation, ni aux filtres.
- **OCP** : la doc est ajoutée par **composition par décorateur**, sans modifier une seule
  signature de handler ni un seul use case.
- **Aucun changement de comportement** : ni chemin, ni verbe, ni query, ni forme de réponse,
  ni statut HTTP. Les `summary` décrivent l'intent et restent valides après la migration d'URL
  de la Section 7 (ils ne mentionnent pas les chemins).
- **« Ne pas inventer » (CLAUDE.md)** : résumés rédigés à partir du **code réel** (route, garde,
  use case appelé, commentaires existants) — pas de capacité fictive documentée.

---

## Plan d'exécution (par effet de levier)

> Convergence **progressive** (ADR-009, coûts assumés) : on extrait d'abord les
> briques transverses, puis on rebranche les controllers. Aucun big-bang.

### Priorité 1 — Failles & status HTTP (rapide, fort impact) — ✅ Faite

1. ✅ **Protéger `GET /questionnaires/:qid`** — `@UseGuards(AdminOrParticipantJwtAuthGuard)`
   ajouté. **Fait le 2026-06-02** (cf. Section 2). *(Section 2)*
2. ✅ **`ZodValidationPipe`** créé et branché sur `scoring` (supprime le 500 → 400) et
   sur la branche admin de mutation (campaigns/companies/coaches) — schémas dans `@aor/types`.
   **Fait le 2026-06-02** (cf. Section 1).
3. ✅ **Filtres d'exception (Section 3)** — **Fait le 2026-06-02.** (a) Participant : les 4 filtres
   hissés au niveau classe (17 `@UseFilters` par méthode supprimés, équivalence prouvée par
   `@Catch` disjoints). (b) `scoring` : **aucun filtre requis** — le `ZodValidationPipe` (§1) rend
   tout `throw` du moteur inatteignable ; ADR-009 §3 clarifié plutôt que d'ajouter du code mort.

### Priorité 2 — Briques transverses anti-duplication — ✅ Faite

4. ✅ **`@CurrentUser()` + `@CurrentCoachScope()`** → ~25 répétitions de scoping supprimées.
   **Fait le 2026-06-02** (cf. Section 2).
5. ✅ **`CampaignAccessGuard`** → les 3 `ensureCampaignAccess()` remplacés.
   **Fait le 2026-06-02** (cf. Section 2).
6. ✅ **`PaginationQueryPipe`** → les 3 parseurs de pagination unifiés (+ `query-normalizers`
   pour `normalizeQid`/`normalizePositiveInt`). **Fait le 2026-06-02** (cf. Section 4).

### Priorité 3 — Cohérence structurelle — ✅ Faite

7. ✅ **Guard au niveau classe côté participant** (exempter explicitement les routes publiques).
   **Fait le 2026-06-02** (cf. Section 8). `@UseGuards(ParticipantJwtAuthGuard)` hissé au niveau
   classe ; routes d'auth `login`/`refresh`/`logout` marquées `@Public()` ; les 18 `@UseGuards`
   par méthode supprimés.
8. ✅ **Helper `sendAvatarResponse(res, avatar)`** pour les en-têtes avatar (6 handlers).
   **Fait le 2026-06-02** (cf. Section 4). *(Renommé vs. `sendBinary` du plan initial : le helper
   encode la politique de cache **avatar** ; les exports CSV, en-têtes distincts, n'en relèvent pas.)*
9. ✅ **Mapping snake_case** : audit + transparency sortis vers presenters.
   **Fait le 2026-06-02** (cf. Section 4).

### Priorité 4 — Conventions REST & doc (cosmétique, à trancher) — 🟡 Partiellement faite

10. 🟡 **Décisions à arbitrer** (produit/tech) — partiellement traité en Section 5 :
    - ✅ convention `DELETE` (204 vs 200+corps) par famille → tranchée + rendue explicite par `@HttpCode`.
    - ✅ retrait du suffixe `...Endpoint` → fait (`addParticipant`).
    - ✅ `PATCH` vs `POST` pour les transitions d'état → **fait en Section 7** (`PATCH /campaigns/:cid/status`, `archive` fusionné ; ADR-010 R5, frontend coordonné).
    - ✅ schéma de chemin avatar unique → **fait en Section 7** (`/participant/profile/avatar` GET+POST ; ADR-010 R4, frontend coordonné).
11. ✅ **`@ApiOperation`** généralisé sur les 12 controllers restants (79 routes).
    **Fait le 2026-06-02** (cf. Section 6).

---

## Section 7 — Conventions de design des URLs (ADR-010) — ✅ Traitée le 2026-06-02

Décision produit du 2026-06-02 : **migration complète** des chemins non conformes
(rupture de contrat frontend coordonnée), conventions figées dans
[ADR-010](./adr/ADR-010-url-route-design-conventions.md) (règles R1→R6).
**Exécutée backend + frontend dans la même vague** (règle impérative respectée) : les
12 lignes de la table de migration sont appliquées, le bug latent matrix corrigé.

> ⚠️ **Règle impérative — backend ↔ frontend indissociables.**
> Toute modification d'une route backend (chemin, verbe HTTP, query/segment, forme du
> body ou de la réponse) **oblige** à revoir et mettre à jour le frontend dans la
> **même PR/vague**. La stratégie est « migration complète sans alias » : les anciens
> chemins ne survivent pas au déploiement. Une route backend changée sans son
> consommateur frontend = régression en production. À vérifier systématiquement :
> `applications/frontend/src/hooks/*` (notamment `admin.ts`, `participantSession.ts`),
> les routes/loaders qui appellent l'API, et les tests de contrat/e2e ciblant les
> anciens chemins. Aucune PR de migration de route ne doit être mergée si le frontend
> correspondant n'est pas inclus.

### ✅ Bug latent révélé par l'audit URL — corrigé le 2026-06-02

| Statut | Constat | Résolution |
|---|---|---|
| ✅ (était 🔴) | `GET /admin/participants/:pid/matrix?qid=` **n'était pas scopé par campagne** : le controller ne passait jamais `campaignId` au use case (qui l'accepte pourtant en optionnel). Un participant pouvant remplir le même questionnaire dans plusieurs campagnes, le matrix **agrégeait toutes campagnes** et prenait « la dernière en date » (`latestBySubmittedAt`) → résultats silencieusement mélangés | Route **déplacée sur l'axe participation** `GET /admin/campaigns/:cid/participants/:pid/matrix` (R3). La campagne est désormais un **segment obligatoire** : le nouveau use case [`GetAdminCampaignParticipantMatrixUseCase`](../applications/backend/src/application/admin/campaigns/get-admin-campaign-participant-matrix.usecase.ts) reçoit enfin `campaignId` et le propage à `GetParticipantQuestionnaireMatrixUseCase`. Le `qid` est **dérivé** de `campaign.questionnaireId` (plus lu en query). **Frontend** : la page matrix était déjà campagne-scopée (`CampaignParticipantMatrixPage`) → seul le hook a changé d'URL (de `participants/:pid/matrix?qid=` vers `campaigns/:cid/participants/:pid/matrix`). |

### Table de migration (avant → après)

| Règle | Avant | Après | Preuve |
|---|---|---|---|
| R3 🔴 | `GET /admin/participants/:pid/matrix?qid=` | `GET /admin/campaigns/:cid/participants/:pid/matrix` *(qid dérivé de la campagne, supprimé)* | [admin-participants.controller.ts:229](../applications/backend/src/presentation/admin/admin-participants.controller.ts#L229) |
| R2 | `GET /participant/campaigns/:cid/matrix?qid=&peers=` | `GET /participant/campaigns/:cid/matrix?peers=` *(qid redondant supprimé — déjà dérivé)* | [participant.controller.ts:341](../applications/backend/src/presentation/participant-session/participant.controller.ts#L341) |
| R5 | `POST /admin/campaigns/:cid/status` | `PATCH /admin/campaigns/:cid/status` | [admin-campaigns.controller.ts:167](../applications/backend/src/presentation/admin/admin-campaigns.controller.ts#L167) |
| R5 | `POST /admin/campaigns/:cid/archive` | *(supprimé)* → `PATCH /admin/campaigns/:cid/status` `{status:'archived'}` | [admin-campaigns.controller.ts:179](../applications/backend/src/presentation/admin/admin-campaigns.controller.ts#L179) |
| R5 | `POST /admin/campaigns/:cid/invite-company-participants` | `POST /admin/campaigns/:cid/invitations` | [admin-campaigns.controller.ts:188](../applications/backend/src/presentation/admin/admin-campaigns.controller.ts#L188) |
| R5 | `POST /admin/campaigns/:cid/import-participants` | `POST /admin/campaigns/:cid/participants/import` *(aligne sur companies)* | [admin-campaigns.controller.ts:201](../applications/backend/src/presentation/admin/admin-campaigns.controller.ts#L201) |
| R5 | `POST /admin/participants/:pid/invite` | `POST /admin/participants/:pid/invitations` | [admin-participants.controller.ts:216](../applications/backend/src/presentation/admin/admin-participants.controller.ts#L216) |
| nommage | `GET /admin/participants/:pid/tokens` | `GET /admin/participants/:pid/invitations` | [admin-participants.controller.ts:224](../applications/backend/src/presentation/admin/admin-participants.controller.ts#L224) |
| R6 | `GET /admin/export/responses?qid=` | `GET /admin/responses/export?qid=` | [admin-responses.controller.ts:135](../applications/backend/src/presentation/admin/admin-responses.controller.ts#L135) |
| R6 | `GET /admin/export/responses/anonymized` | `GET /admin/responses/export/anonymized` | [admin-responses.controller.ts:144](../applications/backend/src/presentation/admin/admin-responses.controller.ts#L144) |
| R4 | `GET /participant/avatars/me` | `GET /participant/profile/avatar` *(GET+POST sur le même chemin)* | [participant.controller.ts:329](../applications/backend/src/presentation/participant-session/participant.controller.ts#L329) |
| R4 | `GET /participant/me/export` | `GET /participant/export` | [participant.controller.ts:533](../applications/backend/src/presentation/participant-session/participant.controller.ts#L533) |

### Conformes — à conserver et documenter (ne PAS migrer)

- `/{acteur}/auth/{login,refresh,logout,me}` — namespace auth symétrique (R1/R4).
- `/admin/campaigns/:cid/participants/:pid/{transparency,restitution,…}` — axe
  participation (R3) déjà correct.
- `/admin/{coaches,companies,participants}/:id/avatar` — `<ressource>/:id/avatar` (R1).
- `qid` en query sur `/admin/responses?qid=` — filtre une collection (R2). En
  revanche `qid` est **supprimé** du matrix car dérivable de la campagne (R2, 3ᵉ catégorie).
- `/questionnaires`, `/scoring` — catalogues partagés sans préfixe acteur (R1).

### Plan d'exécution URL — ✅ Fait le 2026-06-02 (migration complète, backend + frontend même vague)

1. ✅ **Backend** : 12 lignes de la table appliquées (renommages + `PATCH` status +
   suppression `archive` + matrix sous campagne). `campaignId` passé au use case et
   **`qid` dérivé de `campaign.questionnaireId`** (plus lu en query) côté admin **et**
   participant. Briques : nouveau use case admin `GetAdminCampaignParticipantMatrixUseCase`,
   signature de `GetParticipantSessionQuestionnaireMatrixUseCase` simplifiée (param `qid` retiré).
2. ✅ **Frontend** : tous les consommateurs mis à jour (`hooks/admin.ts` ×6,
   `hooks/participantSession.ts` ×2, 3 pages `scoped/*` qui consomment le matrix,
   doc `exportParticipantData.ts`) — **rupture assumée, pas d'alias**.
3. ✅ **Matrix admin** : la page (`CampaignParticipantMatrixPage`) était **déjà**
   campagne-scopée (route `/admin/campaigns/:cid/participants/:pid/matrix` + `campaignId`
   issu de la route) → aucun nouveau sélecteur à ajouter ; seule l'URL appelée a changé.
4. ✅ **Tests** : **aucun test e2e/contract ne ciblait les anciens chemins** (audit
   `*.spec.ts` backend + `*.test.*` frontend = 0 occurrence). Rien à adapter ; les suites
   passent à l'identique (backend 37/38, l'échec restant = `calculate-scoring.usecase.spec.ts`
   préexistant, parité fixtures scoring, sans rapport ; aucun fichier scoring touché).

### Conformité SOLID / Hexa vérifiée (Section 7)

- **Direction des dépendances (Hexa)** : le nouveau use case
  `GetAdminCampaignParticipantMatrixUseCase` vit dans `application/admin/campaigns/` et ne
  dépend **que** du port `ICampaignsReadPort` (interface) et d'un autre use case
  (`GetParticipantQuestionnaireMatrixUseCase`) — **zéro** dépendance presentation/infra. Le
  controller (presentation) le consomme via **token d'injection** (presentation → application,
  inversion ADR-008). La règle métier « une campagne détermine son questionnaire » (dérivation
  du `qid`) vit dans la **couche application**, pas dans le transport — **miroir exact** du
  pattern participant existant (`GetParticipantSessionQuestionnaireMatrixUseCase` qui dérive le
  `qid` de l'assignation).
- **SRP** : chaque brique garde une responsabilité unique — le use case dérive le `qid` et
  délègue le calcul ; le moteur de matrice (`GetParticipantQuestionnaireMatrixUseCase`) reste seul
  responsable du calcul ; les controllers restent en orchestration pure. La transition d'état
  (statut campagne) reste dans l'entité/use case ; `PATCH` n'expose que le verbe transport.
- **OCP** : comportement ajouté par **composition** (nouveau use case + `CampaignAccessGuard` +
  décorateurs `@Patch`/`@Get`) **sans modifier** `GetParticipantQuestionnaireMatrixUseCase`,
  désormais réutilisé par **3** appelants (self participant, matrix admin, activation transparence).
- **DRY / source unique** : un seul moteur de matrice ; le `qid` n'a plus **aucune** copie de
  dérivation côté transport (ni admin ni participant).
- **Équivalence comportementale + correction de bug** : le 🔴 latent (matrix non scopé) est
  **corrigé** par le passage sur l'axe participation (`campaignId` désormais transmis, plus
  d'agrégation cross-campagnes). Le `qid` dérivé reste celui de la **même** campagne que le
  frontend utilisait déjà → réponses identiques pour le cas mono-campagne, **correctes** pour le
  multi-campagnes. Participant : `qid` était **redondant** (un questionnaire par campagne) → retiré
  sans changer la dérivation. `status`/`archive` : comportement HTTP identique (`transitionTo`),
  `archive` fusionné dans `PATCH /status {status:'archived'}`. Renommages
  (`invitations`, `participants/import`, `export` en suffixe) et chemins (avatar self, export
  participant) : **seuls le chemin/verbe changent**, formes de réponse inchangées.
- **Garde-fou ADR-010 (backend ↔ frontend indissociables)** : les 12 routes ont migré **dans la
  même vague** que leurs consommateurs frontend — **aucun chemin orphelin**. Les exports CSV admin
  (`responses/export[/anonymized]`) n'ont **aucun** consommateur frontend (routes backend seules) →
  migration frontend-neutre, **notée**.
- **Ordre de résolution Express** : `responses/export[/anonymized]` est déclaré **avant**
  `responses/:responseId` (sinon le segment statique `export` serait capté par le param +
  `ParseIntPipe` → 400). Même vigilance vérifiée pour `campaigns/:cid/participants/import` (POST,
  distinct des routes `:participantId/*`).

## Section 8 — Guard participant au niveau classe (Priorité 3 item 7) — ✅ Traitée le 2026-06-02

> Dernier item structurel ouvert du plan. **Aucune rupture de contrat** (placement de guard
> strictement interne au transport) ⇒ aucune modification frontend.

| Statut | Constat | Preuve | Résolution |
|---|---|---|---|
| ✅ (était 🟠/structurel) | `ParticipantController` appliquait `@UseGuards(ParticipantJwtAuthGuard)` **par méthode ×18** (divergence signalée Section 2, l.107) alors que la branche admin de ressources le déclare **au niveau classe** (pattern cible ADR-009 §2). Risque latent : un nouveau handler protégé pouvait être ajouté **sans** guard (oubli silencieux) | [participant.controller.ts](../applications/backend/src/presentation/participant-session/participant.controller.ts) (ex-`@UseGuards` répétés sur `session`, `profile`, `matrix`, `submit`, `export`, …) | `@UseGuards(ParticipantJwtAuthGuard)` **hissé au niveau classe** ; les **18** `@UseGuards` par méthode supprimés. Les **3 seules** routes publiques (`auth/login`, `auth/refresh`, `auth/logout`) marquées `@Public()` de façon **explicite** (l'exception, pas la règle — ADR-009 §2). Désormais : **protégé par défaut**, un handler ajouté sans annotation est gardé automatiquement. |

**Briques créées** :
- [`@Public()` + `IS_PUBLIC_KEY`](../applications/backend/src/presentation/public.decorator.ts) (racine
  `presentation/` = frontière transport, réutilisable par tout controller authentifié au niveau classe) —
  `SetMetadata(IS_PUBLIC_KEY, true)` marque une route exemptée du guard de classe.
- [`ParticipantJwtAuthGuard`](../applications/backend/src/presentation/participant-session/participant-jwt-auth.guard.ts)
  enrichi : `canActivate` lit la métadonnée via `Reflector` (`getAllAndOverride([handler, class])`) et
  **court-circuite** (`return true`) sur les routes `@Public()` ; sinon délègue à `super.canActivate`
  (passport JWT inchangé). `Reflector` injecté via `@Inject(Reflector)` (import **valeur** : la DI Nest le
  résout par token, ce qui évite qu'un `import type` automatique ne casse l'injection au démarrage).

**Équivalence comportementale prouvée** :
- **Avant** : `login`/`refresh`/`logout` publics (sans guard JWT) ; les 18 autres routes gardées par méthode.
- **Après** : guard de classe sur **toutes** les routes ; `login`/`refresh`/`logout` court-circuités par
  `@Public()` → **public à l'identique** ; les 18 autres gardées par le guard de classe → **protégées à
  l'identique**. Le `ThrottlerGuard` (login/refresh) et le `@Throttle` restent par méthode (concern distinct,
  inchangé). `logout` lit toujours `req.user` en optionnel (guard court-circuité → `req.user` absent comme
  avant : audit `actorId: null` préservé).
- Mapping route ↔ garde **strictement identique** ; seul le **lieu de déclaration** change.

**Conformité SOLID / Hexa vérifiée** :
- **Aucune frontière franchie** : `@Public()`, `Reflector` et le guard vivent dans `presentation/`. Le guard
  ne lit que des métadonnées de route + le résultat de la stratégie passport — **zéro** dépendance
  application/domaine, aucune logique métier déplacée.
- **SRP** : le guard garde une responsabilité unique (authentifier la requête, sauf exemption explicite) ;
  `@Public()` ne porte qu'une métadonnée déclarative.
- **OCP** : l'exemption est ajoutée par **composition par décorateur** (`@Public()`), sans modifier la
  stratégie JWT ni les handlers ; un futur controller peut réutiliser `@Public()` sans toucher au guard.
- **Sécurité par défaut (ADR-009 §2)** : l'inversion « tout protégé sauf exception explicite » remplace
  « tout ouvert sauf guard posé à la main » → ferme la classe de bugs « guard oublié sur un nouveau handler ».
- **« Ne pas inventer » (CLAUDE.md)** : `@Public()` est posé **uniquement** sur les 3 routes réellement
  publiques (vérifié), pas par précaution sur des routes qui doivent rester protégées.

**Vérifs** : `typecheck` backend ✅ (exit 0) ; Biome ✅ (3 fichiers, « No fixes applied » après correction
de l'`import type` Reflector) ; tests backend `37/38` ✅ (même échec préexistant
`calculate-scoring.usecase.spec.ts` — parité fixtures Python du moteur scoring, sans rapport ; aucun fichier
scoring touché). Aucune modification frontend requise.

## Décisions à prendre

- [x] **`GET /questionnaires/:qid`** : ✅ tranché **et appliqué** 2026-06-02 → sécurisé avec
      `AdminOrParticipantJwtAuthGuard` (comme son sibling `list()`). Voir Section 2.
- [x] **Transition d'état campagne** : ✅ tranché 2026-06-02 → `PATCH /status`, `archive`
      fusionné dedans (ADR-010 R5, migration complète).
- [x] **`DELETE`** : ✅ tranché 2026-06-02 (Section 5) → **les deux formes coexistent**, par
      famille : `204` sans corps (hard delete : coach/company) / `200` + résumé (RGPD erase,
      suppression réponse). Statut rendu **explicite** par `@HttpCode` sur les 4 handlers
      (ADR-009 §5 : choix conscient et cohérent par famille). Aucune modif frontend.
- [x] **Chemins avatar** : ✅ tranché 2026-06-02 → self sous `/participant/profile/avatar`
      (GET+POST), admin sous `/{ressource}/:id/avatar` (ADR-010 R4/R1).
- [x] **Matrix admin & campagne** : ✅ tranché 2026-06-02 → déplacé sur l'axe participation
      `/admin/campaigns/:cid/participants/:pid/matrix` **sans `qid`** (dérivé de la
      campagne) (ADR-010 R2/R3 + fix bug latent). Idem self-route : `qid` supprimé.

## Bilan d'exécution

État initial posé le **2026-06-02**. Feuille de route de convergence vers
[ADR-009](./adr/ADR-009-presentation-controller-conventions.md).
À mettre à jour au fil des priorités traitées (modèle : `avancement-2026-05-08-audit-uxui.md`).

### Journal

- **2026-06-02 — Section 1 (Validation des entrées) : ✅ traitée.**
  - Brique transverse `ZodValidationPipe` créée (`presentation/zod-validation.pipe.ts`).
  - 9 schémas de body ajoutés dans `@aor/types` (campaign / company / coach / participant).
  - Branchée sur `scoring` (🔴 500→400 résolu) + 10 handlers de mutation admin
    (campaigns/companies/coaches — 🟠 résolu).
  - `zod` ajouté aux dépendances directes du backend.
  - **Vérifs** : `typecheck` backend ✅ ; tests `37/38` ✅ (l'unique échec,
    `calculate-scoring.usecase.spec.ts`, est **préexistant** — parité fixtures Python du
    use case scoring, sans rapport avec la Section 1 : reproduit à l'identique sans les
    modifs) ; Biome ✅ sur tous les fichiers touchés.
  - Aucune modification frontend requise (durcissement de validation, pas de rupture de
    contrat — schémas en miroir des types inline).

- **2026-06-02 — Section 2 (Authentification / autorisation) : ✅ traitée.**
  - 🔴→✅ `GET /questionnaires/:qid` sécurisé par `@UseGuards(AdminOrParticipantJwtAuthGuard)`.
  - 🟠→✅ Décorateurs `@CurrentUser()` et `@CurrentCoachScope()` créés (racine `presentation/`) ;
    ~25 répétitions de scoping coach + le typage inline `@Req() req: { user: JwtValidatedUser }`
    supprimés sur les 7 controllers admin + audit. `@Req()` ne subsiste que pour `req.ip`.
  - 🟠→✅ `CampaignAccessGuard` créé (`presentation/admin/`) ; les 3 `ensureCampaignAccess()`
    supprimés. Appliqué au niveau classe (ai-restitutions) et par méthode (campaigns ×7 +
    `listResponses`). Provider ajouté dans les 3 modules (campaigns/responses/ai-restitutions).
  - **Brique Priorité 1 item 1 + Priorité 2 items 4 & 5** cochées.
  - **Conformité SOLID / Hexa** : direction des dépendances respectée (guard → use case via
    token d'injection) ; décision métier conservée dans le use case (le guard orchestre seulement) ;
    équivalence comportementale avec les ex-copies privées.
  - **Vérifs** : `typecheck` backend ✅ (exit 0) ; Biome ✅ (tri d'imports appliqué sur 6 fichiers) ;
    tests `37/38` ✅ (même échec préexistant `calculate-scoring.usecase.spec.ts`, sans rapport).
  - Aucune modification frontend requise : `/questionnaires/:qid` passe déjà par l'`apiClient`
    authentifié (durcissement auth, pas de rupture de contrat d'URL — celle-ci relève de la Section 7).

- **2026-06-02 — Section 3 (Filtres d'exception) : ✅ traitée.**
  - 🟠→✅ **Participant** : les 4 filtres (`ParticipantAuth` / `ParticipantSession` /
    `ParticipantAvatar` / `Responses`) hissés en **un seul `@UseFilters` de classe** sur
    `ParticipantController` ; les **17** `@UseFilters` par méthode supprimés. Convergence vers le
    pattern cible admin (ADR-009 §3).
  - 🟠→✅ **scoring** : statué **« aucun filtre requis »**. Le `ZodValidationPipe` (Section 1) rend
    inatteignable tout `throw` de `calculateScores` → pas d'erreur métier 4xx à mapper. Ajouter un
    filtre serait du code mort. **ADR-009 §3 clarifié** (filtre requis ssi l'erreur métier est
    réellement atteignable).
  - **Équivalence comportementale** : les 4 filtres ont des `@Catch` **disjoints** → empilage au
    niveau classe sans effet de bord ; les handlers sans filtre (`auth/refresh|logout|me`,
    `PATCH profile`) ne lèvent que des `HttpException` natives hors de ces jeux.
  - **Conformité SOLID / Hexa** : SRP préservé (un filtre = un groupe d'erreurs) ; aucune logique
    métier déplacée vers le transport ; OCP (composition par décorateur, use cases inchangés) ;
    politique « ne pas inventer » respectée (doc mise à jour plutôt que code mort).
  - **Vérifs** : `typecheck` backend ✅ (exit 0) ; Biome ✅ (`participant.controller.ts` clean) ;
    tests `37/38` ✅ (même échec préexistant `calculate-scoring.usecase.spec.ts` — parité fixtures
    Python du moteur scoring, sans rapport avec la Section 3 ; aucun fichier scoring touché).
  - Aucune modification frontend requise : réorganisation transport interne (placement des
    `@UseFilters`), aucun chemin / verbe / forme de réponse modifié.

- **2026-06-02 — Section 4 (Utilitaires transverses / DRY) : ✅ traitée.**
  - 🟠→✅ **Pagination** : `PaginationQueryPipe` (+ type `PaginationParams`) créé ; `query-normalizers.ts`
    (`normalizeQid` / `normalizePositiveInt`) créé. Les **3** parseurs divergents unifiés
    (`admin-responses`, `admin-participants`, `admin-audit`) ; les 4 méthodes statiques privées ×2
    supprimées + la 3ᵉ copie de `normalizeQid` côté `participant.controller`. **Priorité 2 item 6** cochée.
  - 🟡→✅ **Cache-Control avatar** : helper `sendAvatarResponse(res, avatar)` ; les **6** handlers d'avatar
    (admin coaches/companies/participants + participant self/coach/peer) rebranchés. **Priorité 3 item 8** cochée.
  - 🟡→✅ **Mapping snake_case** : `auditEventToAdminJson` (admin.presenters) pour l'audit ;
    `transparencyScoreSnapshotToJson` **hissé** en presenter partagé (`presentation/`) — consommé par
    `admin-campaigns` (import repointé) et `participant.controller` (ex-inline). **Priorité 3 item 9** cochée.
  - **Conformité SOLID / Hexa** : SRP (1 brique = 1 responsabilité transport) ; direction des dépendances
    respectée (briques `presentation/` → read-models `interfaces/` uniquement, zéro lien application/domaine) ;
    DRY (transparence : 1 source partagée au lieu de presenter + copie inline) ; équivalence comportementale
    (logique de normalisation identique aux ex-helpers ; mappings champ pour champ). Seul écart assumé :
    plafond `per_page=200` désormais appliqué aussi à l'audit (durcissement, défaut inchangé).
  - **Vérifs** : `typecheck` backend ✅ (exit 0) ; Biome ✅ (12 fichiers, tri d'imports + format appliqués) ;
    tests `37/38` ✅ (même échec préexistant `calculate-scoring.usecase.spec.ts` — parité fixtures Python du
    moteur scoring, sans rapport ; aucun fichier scoring touché).
  - Aucune modification frontend requise : extraction de briques transport internes, aucun chemin / verbe /
    query / forme de réponse modifié (la forme JSON de l'audit, de la transparence et des avatars est
    préservée à l'identique — la migration d'URL reste la Section 7).

- **2026-06-02 — Section 5 (Conventions REST) : ✅ traitée (partie frontend-neutre).**
  - 🟡→✅ **Sémantique `DELETE`** : statué « deux familles légitimes » (ADR-009 §5), pas un conflit.
    `204` sans corps (coach/company) / `200` + résumé (participant RGPD erase, response). Le `200` reposait
    sur le défaut Nest implicite → rendu **explicite** par `@HttpCode(HttpStatus.OK)` sur `deleteParticipant`
    et `deleteResponse` (en miroir du `@HttpCode(NO_CONTENT)` de coach/company). Aucun changement de
    comportement HTTP. Décision `DELETE` cochée + Priorité 4 item 10 partiellement faite.
  - 🟡→✅ **Suffixe `...Endpoint`** : `addParticipantToCampaignEndpoint` / `addParticipantToCompanyEndpoint`
    renommés `addParticipant` (ADR-009 §5). Noms de méthodes internes (routage par décorateur) → zéro impact
    contrat ; aucune autre référence aux anciens noms (vérifié).
  - 🟡→**Section 7** : **verbes** (`POST /status` + `/archive` → `PATCH /status`) et **chemin avatar self**
    (`avatars/me` → `profile/avatar`) **non exécutés ici** — ruptures de contrat frontend, déjà inscrites
    dans la table de migration ADR-010 (R5/R4) et traitées dans la vague Section 7 (règle impérative
    backend ↔ frontend respectée). Chemins avatar **admin** déjà conformes (R1).
  - **Conformité SOLID / Hexa** : changements strictement internes à `presentation/` (décorateur `@HttpCode`,
    nom de méthode) ; aucune dépendance vers application/domaine, aucune logique métier déplacée (le résumé
    RGPD reste produit par le use case) ; SRP/OCP préservés ; politique « ne pas inventer » respectée
    (application de l'arbitrage ADR-009 §5 existant, pas de convention `DELETE` artificielle ; migration
    d'URL non fragmentée).
  - **Vérifs** : `typecheck` backend ✅ (exit 0) ; Biome ✅ (4 controllers, « No fixes applied ») ;
    tests `37/38` ✅ (même échec préexistant `calculate-scoring.usecase.spec.ts` — parité fixtures Python du
    moteur scoring, sans rapport ; aucun fichier scoring touché).
  - Aucune modification frontend requise pour la partie traitée (statut HTTP et noms de méthodes internes
    inchangés côté contrat). Les items frontend-couplés restent en Section 7.

- **2026-06-02 — Section 6 (Documentation OpenAPI) : ✅ traitée.**
  - 🟡→✅ `@ApiOperation({ summary })` généralisé : **79 routes** des 12 controllers qui en étaient
    dépourvus (seul `admin.controller` en portait, sur ses 4 routes). Couverture désormais **1:1**
    route ↔ `@ApiOperation` sur les **13** controllers (83 routes). Convention ADR-009 §6 satisfaite.
  - Résumés rédigés en **français** (CLAUDE.md), décrivant l'**intent métier** de chaque route et non
    la mécanique transport — donc **stables après la migration d'URL de la Section 7** (aucun chemin
    n'y figure). **Priorité 4 item 11** cochée.
  - **Conformité SOLID / Hexa** : `@ApiOperation` est un décorateur de documentation pur
    (`@nestjs/swagger`), strictement interne à `presentation/`. Zéro dépendance vers
    l'application/domaine, aucune logique métier déplacée, aucune signature de handler modifiée
    (OCP : composition par décorateur). Aucun changement de comportement (chemin / verbe / query /
    réponse / statut HTTP inchangés).
  - **Vérifs** : `typecheck` backend ✅ (exit 0) ; Biome ✅ (226 fichiers, « No fixes applied ») ;
    tests `37/38` ✅ (même échec préexistant `calculate-scoring.usecase.spec.ts` — parité fixtures
    Python du moteur scoring, sans rapport ; aucun fichier scoring touché). Audit automatique
    `route ↔ @ApiOperation` = **1:1** sur les 13 controllers.
  - Aucune modification frontend requise : ajout de métadonnées Swagger uniquement, aucun contrat
    d'API modifié.

- **2026-06-02 — Section 7 (Design des URLs / ADR-010) : ✅ traitée (migration complète backend + frontend).**
  - 🔴→✅ **Bug latent matrix** : `GET /admin/participants/:pid/matrix?qid=` (non scopé campagne,
    agrégation cross-campagnes) **déplacé** sur l'axe participation
    `GET /admin/campaigns/:cid/participants/:pid/matrix` (R3). `campaignId` désormais transmis ;
    `qid` **dérivé** de la campagne.
  - 🟡→✅ **12 lignes de migration** appliquées : `PATCH /campaigns/:cid/status` (+ `archive` fusionné,
    R5) ; `POST /campaigns/:cid/invitations` (ex-`invite-company-participants`) ;
    `POST /campaigns/:cid/participants/import` (ex-`import-participants`) ;
    `POST /participants/:pid/invitations` (ex-`invite`) ; `GET /participants/:pid/invitations`
    (ex-`tokens`) ; `GET /responses/export[/anonymized]` (ex-`/export/responses…`, R6) ;
    `GET|POST /participant/profile/avatar` (ex-`avatars/me`, R4) ; `GET /participant/export`
    (ex-`me/export`, R4) ; `GET /participant/campaigns/:cid/matrix` **sans `qid`** (R2).
  - **Briques** : nouveau use case `GetAdminCampaignParticipantMatrixUseCase`
    (`application/admin/campaigns/`, dérive `qid` de la campagne → délègue au moteur de matrice,
    miroir de la self-route) + token `GET_ADMIN_CAMPAIGN_PARTICIPANT_MATRIX_USE_CASE_SYMBOL` ;
    `GetParticipantSessionQuestionnaireMatrixUseCase` simplifié (param `qid` retiré, signature
    `(participantId, campaignId, peers)`). Providers matrix admin déplacés
    (admin-participants.module → admin-campaigns.module).
  - **Frontend** : `hooks/admin.ts` (status→PATCH, archive→PATCH status, invitations ×2,
    participants/import, matrix campagne-scopé + `adminKeys.participantMatrix(campaignId, participantId)`),
    `hooks/participantSession.ts` (export, matrix sans `qid`), 3 pages `scoped/*`
    (matrix/transparence/restitution IA → nouvelle signature `useParticipantQuestionnaireMatrix(campaignId, participantId, { enabled })`),
    doc `exportParticipantData.ts`. **Rupture assumée, pas d'alias**. Exports CSV admin sans
    consommateur frontend → frontend-neutre.
  - **Conformité SOLID / Hexa** : direction des dépendances respectée (use case admin → port
    `ICampaignsReadPort` + moteur de matrice, presentation → application via token) ; dérivation
    du `qid` dans la couche **application** (pas le transport) ; OCP (moteur de matrice inchangé,
    réutilisé par 3 appelants) ; SRP (orchestration pure côté controllers) ; équivalence
    comportementale (mono-campagne identique, multi-campagnes corrigé) + correction du 🔴 latent.
  - **Vérifs** : `typecheck` backend ✅ (exit 0) ; `typecheck` frontend ✅ (exit 0) ; Biome ✅
    (15 fichiers, clean) ; tests backend `37/38` ✅ (même échec préexistant
    `calculate-scoring.usecase.spec.ts`, sans rapport ; aucun fichier scoring touché) ; **0** test
    e2e/contract ciblant les anciens chemins (rien à adapter).
  - **Ordre Express** vérifié : `responses/export[/anonymized]` déclaré **avant**
    `responses/:responseId` (évite la capture du segment statique par `ParseIntPipe`).
  - Résiduel **hors périmètre Section 7** : Plan d'exécution **Priorité 3 item 7** (guard
    participant au niveau classe) — **traité depuis** le 2026-06-02 (cf. Section 8).

- **2026-06-02 — Section 8 (Guard participant au niveau classe / Priorité 3 item 7) : ✅ traitée.**
  - 🟠/structurel→✅ `@UseGuards(ParticipantJwtAuthGuard)` **hissé au niveau classe** sur
    `ParticipantController` ; les **18** `@UseGuards` par méthode supprimés. Sécurité **par défaut**
    (ADR-009 §2) : un nouveau handler est gardé sans annotation.
  - **Brique** `@Public()` + `IS_PUBLIC_KEY` créée (`presentation/public.decorator.ts`, réutilisable) ;
    `ParticipantJwtAuthGuard.canActivate` lit la métadonnée via `Reflector` et court-circuite sur les
    routes exemptées. Les **3 seules** routes publiques (`auth/login`/`refresh`/`logout`) marquées
    `@Public()` explicitement. `Reflector` injecté via `@Inject(Reflector)` (import valeur → DI préservée).
  - **Équivalence comportementale** : mapping route ↔ garde identique (3 publiques / 18 protégées) ;
    seul le lieu de déclaration change. `ThrottlerGuard` + `@Throttle` inchangés ; audit `logout` préservé.
  - **Conformité SOLID / Hexa** : aucune frontière franchie (guard + décorateur dans `presentation/`,
    zéro lien application/domaine) ; SRP/OCP préservés (exemption par composition de décorateur) ;
    « ne pas inventer » respecté (`@Public()` uniquement sur les routes réellement publiques).
  - **Vérifs** : `typecheck` backend ✅ (exit 0) ; Biome ✅ (3 fichiers, « No fixes applied ») ;
    tests backend `37/38` ✅ (même échec préexistant `calculate-scoring.usecase.spec.ts`, sans rapport ;
    aucun fichier scoring touché). Aucune modification frontend requise.
  - **Plan d'exécution** : dernier item ouvert (Priorité 3 item 7) coché → **les 11 items du plan sont ✅**.
  - **Réconciliation du compteur** : incohérence de tally pré-existante signalée dans le récap exécutif
    (le « Total état initial » ne somme pas le détail par axe) ; aucun item concret ne reste ouvert.
