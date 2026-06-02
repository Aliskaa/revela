# ADR-009: Conventions d'homogénéité des controllers de présentation

## Status

Accepted — complète [ADR-008](./ADR-008-backend-layer-first-with-actor-segmentation.md)
sur le **comment** écrire un controller (ADR-008 fixe le **où** les placer).

## Date

2026-06-02

## Context

Un audit de cohérence de `applications/backend/src/presentation/` (13 controllers)
mené le 2026-06-02 a montré que les routes, bien que fonctionnelles, ne sont **pas
homogènes**. Les divergences observées (détail et preuves dans
[docs/avancement-2026-06-02-presentation-routes.md](../avancement-2026-06-02-presentation-routes.md)) :

1. **Validation des entrées** : 4 stratégies coexistent — `schema.parse()` brut
   (renvoie 500 au lieu de 400), `schema.safeParse()` → `BadRequestException`,
   `body: unknown` délégué au use case, et `body: { champ?: type }` typé inline
   **sans aucune validation runtime** (toute la branche admin de mutation).
2. **Un endpoint non protégé** : `GET /questionnaires/:qid` n'a aucun guard alors
   que son sibling `GET /questionnaires` exige une authentification et que la classe
   déclare `@ApiBearerAuth`. Aucun `APP_GUARD` global ne le couvre.
3. **Application des guards** : au niveau classe côté admin, mais répétée par méthode
   côté participant (~20 fois) et partielle côté questionnaires.
4. **Duplication du scoping coach** : `req.user.scope === 'coach' ? req.user.coachId : undefined`
   répété ~25 fois ; `ensureCampaignAccess()` copié à l'identique dans 3 controllers.
5. **Parsing de pagination** : 3 implémentations différentes (deux copiées-collées
   `normalizePage/normalizePerPage/...`, une troisième inline divergente).
6. **Filtres d'exception** : au niveau classe côté admin, par méthode côté participant,
   **absents** côté scoring.
7. **Conventions REST hétérogènes** : verbes (`POST /status` vs `PATCH /coach`),
   sémantique `DELETE` (204 sans corps vs 200 avec corps), chemins d'avatar
   (`avatars/me` vs `profile/avatar` vs `coaches/:id/avatar`), nommage des handlers
   (`...Endpoint`), localisation du mapping snake_case (presenters vs inline),
   documentation Swagger (`@ApiOperation` sur un seul controller).

Aucune de ces divergences ne casse une fonctionnalité aujourd'hui, mais elles
augmentent la charge cognitive, multiplient les points de copier-coller et créent
des asymétries de sécurité (points 1 et 2). L'absence de convention écrite fait que
chaque nouveau controller réinvente ses choix.

## Decision

On adopte les conventions suivantes pour **tout controller de `presentation/`**,
existant (à converger progressivement) et nouveau (obligatoire).

### 1. Validation au bord, unique et typée

- Toute entrée non triviale (`@Body`, et query/param structurés) est validée par un
  **schéma Zod** au niveau du controller, via `safeParse` → `BadRequestException`
  en cas d'échec. C'est la **frontière transport** au sens d'ADR-008 §5.
- On introduit un `ZodValidationPipe` réutilisable pour appliquer ce contrat de
  façon déclarative (`@Body(new ZodValidationPipe(schema))`) plutôt qu'un `safeParse`
  manuel répété.
- Interdits : `schema.parse()` brut dans un handler (fuite ZodError → 500), et
  `@Body() body: { champ?: type }` typé inline **sans** validation runtime
  correspondante.
- Le schéma vit dans `@aor/types` quand il est partagé front/back (cf. CLAUDE.md,
  Zod v4), sinon au plus près du controller.

### 2. Authentification et autorisation déclaratives

- **Guard d'authentification au niveau classe.** Les routes publiques d'un controller
  par ailleurs authentifié sont l'exception explicite, pas l'inverse. Aucun handler
  protégé ne doit dépendre d'un guard oublié sur une autre méthode.
- **`GET /questionnaires/:qid` doit être protégé** (ou son ouverture documentée et
  assumée explicitement). Par défaut : protégé, comme son sibling `list`.
- **Décorateurs partagés** pour supprimer la duplication :
  - `@CurrentUser()` → expose `JwtValidatedUser` sans `@Req() req: { user: ... }`.
  - `@CurrentCoachScope()` → résout `scope === 'coach' ? coachId : undefined`.
  - `@CurrentParticipantId()` (déjà existant) reste la référence côté participant.
- **`CampaignAccessGuard`** (ou garde équivalent réutilisable) remplace les trois
  copies d'`ensureCampaignAccess()`. Le périmètre coach est vérifié une seule fois,
  de façon déclarative.

### 3. Filtres d'exception au niveau classe

Les `@UseFilters` qui s'appliquent à tout un controller sont déclarés au niveau
classe (pattern admin actuel). Un controller qui peut renvoyer une erreur métier
**doit** avoir un filtre — `scoring` ne doit pas rester sans filtre.

### 4. Utilitaires transverses, pas de copier-coller

- **Pagination** : un seul `PaginationQueryPipe` (ou util partagé) remplace les
  trois implémentations. Bornes (`per_page ≤ 200`, défauts) centralisées.
- **Mapping snake_case** : toujours dans un presenter (`admin.presenters.ts` ou
  équivalent), jamais mappé inline dans le handler.
- **Réponse fichier** (avatars) : un helper `sendBinary(res, buffer, mimeType)`
  centralise les en-têtes `Content-Type` / `Cache-Control` répétés.

### 5. Conventions REST

- **Verbes** : `PATCH` pour une mise à jour partielle de ressource ;
  `POST /<ressource>/<action>` pour une action métier de type RPC
  (`/activate`, `/generate`, `/approve`, `/reject`, `/archive`). Une transition
  d'état d'une ressource existante (statut campagne) relève de `PATCH`, pas de `POST`.
- **`DELETE`** : convention unique. Suppression sans payload de retour →
  `@HttpCode(204)` ; suppression renvoyant un résumé (RGPD erase, delete response)
  → `200` avec corps documenté. Le choix doit être conscient et cohérent par famille.
- **Chemins** : un schéma de chemin par concept. Les avatars suivent
  `<ressource>/:id/avatar` (lecture/écriture sur le même chemin selon le verbe).
- **Nommage des handlers** : pas de suffixe technique (`...Endpoint`) ; le nom décrit
  l'intent métier.

### 6. Documentation OpenAPI

Chaque route porte un `@ApiOperation({ summary })`. La doc Swagger ne doit pas être
le privilège d'un seul controller.

## Consequences

### Positives

- **Sécurité par défaut** : plus d'endpoint protégé qui dépend d'un guard posé
  ailleurs ; validation systématique au bord ferme la classe de bugs « type TS qui
  ne valide rien au runtime ».
- **Moins de copier-coller** : ~25 répétitions de scoping + 3 `ensureCampaignAccess`
  + 3 parseurs de pagination convergent vers des briques nommées.
- **Onboarding** : un nouveau controller se lit comme les autres ; les choix
  (validation, guard, filtre, presenter) sont prévisibles.
- **Status HTTP corrects** : 400 sur entrée invalide (au lieu de 500 sur le `parse`
  brut de scoring).

### Coûts assumés

- **Convergence progressive** : les 13 controllers existants ne sont pas réécrits
  d'un coup. Le suivi se fait dans le fichier d'avancement ; pendant la transition,
  ancien et nouveau style cohabitent temporairement.
- **Quelques briques transverses à écrire** (`ZodValidationPipe`, décorateurs,
  `CampaignAccessGuard`, `PaginationQueryPipe`, helper binaire) avant d'en récolter
  le bénéfice.

## Guardrails (règles de revue)

- Rejeter tout handler avec `@Body() body: { ... }` inline **sans** schéma Zod associé.
- Rejeter tout `schema.parse()` brut dans un controller (exiger `safeParse`/pipe).
- Rejeter tout nouvel `ensureCampaignAccess()` local (utiliser le guard partagé).
- Rejeter toute nouvelle copie d'un parseur de pagination.
- Toute route protégée : guard au niveau classe (ou exemption publique explicite).
- Toute nouvelle route : `@ApiOperation` présent.

## Alternatives Considered

- **Ne rien formaliser, corriger au fil de l'eau** : rejetée. Sans convention écrite,
  chaque controller continue de diverger ; l'audit aurait à être refait.
- **Réécriture big-bang des 13 controllers** : rejetée. Risque de régression sur des
  routes en production, gel des features. La convergence incrémentale pilotée par le
  fichier d'avancement est préférée (même logique que le rejet de l'option A dans ADR-008).
- **Validation déléguée systématiquement au use case** (controller « bête ») :
  rejetée. ADR-008 §5 place explicitement le parsing HTTP et la normalisation au bord,
  dans `presentation/`. Garder la validation au controller préserve cette frontière et
  donne un 400 propre sans faire remonter des erreurs de transport dans la couche métier.

## References

- [ADR-008](./ADR-008-backend-layer-first-with-actor-segmentation.md) — structure
  physique et frontière transport/métier que cet ADR complète.
- [ADR-007](./ADR-007-use-drawer-form-zod.md) — Zod déjà adopté côté formulaires admin.
- [docs/avancement-2026-06-02-presentation-routes.md](../avancement-2026-06-02-presentation-routes.md)
  — audit détaillé (preuves `fichier:ligne`) et suivi d'exécution.
- CLAUDE.md — Zod v4 pour les schémas partagés, BiomeJS, pnpm.
