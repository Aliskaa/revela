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

État global : **base fonctionnelle, conventions implicites divergentes**. Pas de
refonte nécessaire — extraction de briques transverses + convergence progressive
des 13 controllers vers le contrat ADR-009.

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

## Section 5 — Conventions REST

| Statut | Constat | Preuve |
|---|---|---|
| 🟡 | Verbes incohérents : transition d'état campagne en `POST /status` alors que la réassignation coach voisine est en `PATCH /coach` | [admin-campaigns.controller.ts:167](../applications/backend/src/presentation/admin/admin-campaigns.controller.ts#L167) vs [:129](../applications/backend/src/presentation/admin/admin-campaigns.controller.ts#L129) |
| 🟡 | Sémantique `DELETE` opposée dans le même module : `204` sans corps (coach/company) vs `200` avec corps (response/participant) | [admin-coaches.controller.ts:186](../applications/backend/src/presentation/admin/admin-coaches.controller.ts#L186) vs [admin-participants.controller.ts:246](../applications/backend/src/presentation/admin/admin-participants.controller.ts#L246) |
| 🟡 | Chemins d'avatar non uniformes : `participant/avatars/me` (pluriel) vs `participant/profile/avatar` vs `admin/coaches/:id/avatar` | [participant.controller.ts:329](../applications/backend/src/presentation/participant-session/participant.controller.ts#L329) ; [:314](../applications/backend/src/presentation/participant-session/participant.controller.ts#L314) ; [admin-coaches.controller.ts:144](../applications/backend/src/presentation/admin/admin-coaches.controller.ts#L144) |
| 🟡 | Nommage handler avec suffixe technique `...Endpoint` (isolé) | [admin-campaigns.controller.ts:214](../applications/backend/src/presentation/admin/admin-campaigns.controller.ts#L214) ; [admin-companies.controller.ts:171](../applications/backend/src/presentation/admin/admin-companies.controller.ts#L171) |

## Section 6 — Documentation OpenAPI

| Statut | Constat | Preuve |
|---|---|---|
| 🟡 | `@ApiOperation` présent **uniquement** sur le controller d'auth admin ; absent des 12 autres | [admin.controller.ts:66](../applications/backend/src/presentation/admin/admin.controller.ts#L66) (seul porteur) |

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

### Priorité 3 — Cohérence structurelle — 🟡 Partiellement faite

7. ⬜ **Guard au niveau classe côté participant** (exempter explicitement les routes publiques).
8. ✅ **Helper `sendAvatarResponse(res, avatar)`** pour les en-têtes avatar (6 handlers).
   **Fait le 2026-06-02** (cf. Section 4). *(Renommé vs. `sendBinary` du plan initial : le helper
   encode la politique de cache **avatar** ; les exports CSV, en-têtes distincts, n'en relèvent pas.)*
9. ✅ **Mapping snake_case** : audit + transparency sortis vers presenters.
   **Fait le 2026-06-02** (cf. Section 4).

### Priorité 4 — Conventions REST & doc (cosmétique, à trancher) — ⬜ À décider

10. ⬜ **Décisions à arbitrer** (produit/tech) : `PATCH` vs `POST` pour les transitions d'état ;
    convention `DELETE` (204 vs 200+corps) par famille ; schéma de chemin avatar unique ;
    retrait du suffixe `...Endpoint`.
11. ⬜ **`@ApiOperation`** généralisé sur les 12 controllers restants.

---

## Section 7 — Conventions de design des URLs (ADR-010)

Décision produit du 2026-06-02 : **migration complète** des chemins non conformes
(rupture de contrat frontend coordonnée), conventions figées dans
[ADR-010](./adr/ADR-010-url-route-design-conventions.md) (règles R1→R6).

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

### 🔴 Bug latent révélé par l'audit URL

| Statut | Constat | Preuve |
|---|---|---|
| 🔴 | `GET /admin/participants/:pid/matrix?qid=` **n'est pas scopé par campagne** : le controller n'passe jamais `campaignId` au use case (qui l'accepte pourtant en optionnel). Un participant pouvant remplir le même questionnaire dans plusieurs campagnes, le matrix **agrège toutes campagnes** et prend « la dernière en date » (`latestBySubmittedAt`) → résultats silencieusement mélangés | Controller [admin-participants.controller.ts:229-243](../applications/backend/src/presentation/admin/admin-participants.controller.ts#L229-L243) (pas de `campaignId`) ; use case accepte `campaignId?` [get-participant-questionnaire-matrix.usecase.ts:84](../applications/backend/src/application/participant-session/get-participant-questionnaire-matrix.usecase.ts#L84) et le propage [:115-119](../applications/backend/src/application/participant-session/get-participant-questionnaire-matrix.usecase.ts#L115-L119) ; agrégation « latest » [:50-59](../applications/backend/src/application/participant-session/get-participant-questionnaire-matrix.usecase.ts#L50-L59) |

→ Corrigé par le déplacement du matrix sur l'*axe participation* (cf. table ci-dessous) :
la campagne devient un segment obligatoire, le use case reçoit enfin `campaignId`.
**Implication frontend** : l'admin doit choisir une campagne avant d'afficher le matrix
(comme la self-route participant le fait déjà).

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

### Plan d'exécution URL — ⬜ À faire (migration complète, backend + frontend même vague)

1. ⬜ **Backend** : appliquer les lignes de la table (renommages + `PATCH` status +
   suppression `archive` + matrix sous campagne, en passant `campaignId` au use case et
   en **dérivant `qid` de `campaign.questionnaireId`** plutôt que de le lire en query —
   côté admin comme participant).
2. ⬜ **Frontend** : mettre à jour tous les consommateurs (`hooks/admin.ts`,
   `hooks/participantSession.ts`, routes) — **rupture assumée**, pas d'alias.
3. ⬜ **Matrix admin** : ajouter le sélecteur de campagne dans l'UI (conséquence du
   passage sur l'axe participation).
4. ⬜ **Tests** : adapter les tests e2e/contract qui ciblent les anciens chemins.

## Décisions à prendre

- [x] **`GET /questionnaires/:qid`** : ✅ tranché **et appliqué** 2026-06-02 → sécurisé avec
      `AdminOrParticipantJwtAuthGuard` (comme son sibling `list()`). Voir Section 2.
- [x] **Transition d'état campagne** : ✅ tranché 2026-06-02 → `PATCH /status`, `archive`
      fusionné dedans (ADR-010 R5, migration complète).
- [ ] **`DELETE`** : autoriser les deux formes (204 sans corps / 200 + résumé) selon le besoin,
      ou imposer une seule forme ? *(non couvert par ADR-010, relève d'ADR-009 §5)*
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
