# Plan d'avancement — Espace Coach dédié (V1.5)

> Cadrage technique de l'ajout d'un **espace Coach** distinct de l'espace
> super-admin, déclenché par la revue du document
> [Cadrage projet Revela v1.pdf](.) le 2026-04-27.
>
> Suite directe de [avancement-2026-04-27.md](avancement-2026-04-27.md). Ce
> fichier suit l'avancement de cette initiative spécifique sur les jours à
> venir.

---

## TL;DR

Le projet expose aujourd'hui **2 espaces frontend** (`/admin/*` partagé super-admin+coach via scope JWT, `/participant/*`). Le coach se connecte via `/admin/login` et atterrit sur la même chrome admin que le super-admin, sans distinction visuelle ni filtrage des données.

**Modèle cible validé par l'utilisateur le 2026-04-27** :

- **3 espaces frontend** : `participant/`, `coach/`, `admin/` ;
- **2 pages de login** :
  - `/login` → participant uniquement ;
  - `/admin/login` → coach + admin (le frontend redirige vers `/coach` ou `/admin` selon le scope JWT renvoyé par le backend).

**Effort estimé** : 1.5 à 2 jours, découpé en 5 étapes mergeables indépendamment.

---

## 1. État de l'existant (audit 2026-04-27)

### 1.1 Backend

- [admin-auth.usecase.ts](../applications/backend/src/application/admin/auth/admin-auth.usecase.ts) :
  - super-admin via env vars (`AdminAuthConfigPort`) → JWT `{ sub, role: 'admin', scope: 'super-admin' }`
  - coach via DB (`CoachesRepository.findByUsername`) → JWT `{ sub, role: 'admin', scope: 'coach', coachId }`
- [admin-or-participant-jwt-auth.guard.ts](../applications/backend/src/presentation/admin-or-participant-jwt-auth.guard.ts) : guard qui accepte tout JWT signé.
- **Endpoints admin actuellement non filtrés par coachId** : `/admin/campaigns`, `/admin/participants`, `/admin/responses`, `/admin/coaches`, `/admin/companies` retournent toutes les données quel que soit le scope.

### 1.2 Frontend

- [routes/admin/login.tsx](../applications/frontend/src/routes/admin/login.tsx) : après `login.mutateAsync`, fait simplement `navigate({ to: '/admin' })` — pas de routing conditionnel.
- [routes/admin/route.tsx](../applications/frontend/src/routes/admin/route.tsx) : chrome admin (sidebar 6 items, mobile drawer, topbar avec recherche, footer logout).
- [routes/participant/route.tsx](../applications/frontend/src/routes/participant/route.tsx) : chrome participant (sidebar 6 items, mobile drawer, topbar simple).
- Pas de `routes/coach/`.
- [src/lib/auth.ts](../applications/frontend/src/lib/auth.ts) : `parseAdminJwtClaims(token)` existe déjà → permet d'extraire `scope`, `coachId` côté UI sans appel API.

### 1.3 Conventions du projet à respecter

- [ADR-008](adr/ADR-008-backend-layer-first-with-actor-segmentation.md) : layer-first, sous-dossier `application/admin/` pour les use cases admin, sous-dossier `application/coach/` à créer pour les use cases côté coach.
- Convention de naming (cf. [ADR-008 §2](adr/ADR-008-backend-layer-first-with-actor-segmentation.md)) :
  - `participant-session/` = participant en session ;
  - `participants/` = collection admin ;
  - **Décision à acter** : on prend `coach-session/` (cohérent avec `participant-session/`) pour les use cases côté coach connecté, et `coaches/` (déjà en place, pluriel) reste pour la collection admin.

---

## 2. Plan d'exécution — 5 étapes

### Étape 1 — Backend : exposer le scope + filtres coach

**But** : que le frontend sache où rediriger après login, et qu'un coach ne voie que ses propres données.

#### 1.a — Réponse de login enrichie

Le `POST /admin/login` retourne actuellement `{ access_token }`. Le scope est déjà encodable dans le JWT, mais pour éviter au frontend de décoder côté client à chaque navigation, exposer explicitement :

```ts
// Retour du POST /admin/login
{
  access_token: string;
  scope: 'super-admin' | 'coach';
  coach_id: number | null;  // présent si scope='coach'
}
```

`AdminLoginResult` (domain) est déjà créé via `AdminLoginResult.create(token)` ; étendre pour inclure scope + coach_id, mettre à jour le DTO de présentation et le schema Zod dans `@aor/types`.

#### 1.b — Filtres coachId sur les endpoints

Les endpoints admin doivent accepter le scope du JWT et filtrer en conséquence. Pattern déjà bien établi avec les ports — il faut ajouter un paramètre `coachId?: number | null` aux use cases qui listent (et filtrer dans le repository), puis le passer depuis le controller via le claim JWT :

| Endpoint | Filtre quand scope=coach |
|---|---|
| `GET /admin/campaigns` | uniquement les campagnes où `coachId === claims.coachId` |
| `GET /admin/campaigns/:id` | 404 si pas attribuée à ce coach |
| `GET /admin/participants` | uniquement les participants des campagnes du coach |
| `GET /admin/responses` | uniquement les réponses des campagnes du coach |
| `GET /admin/companies` | uniquement les entreprises ayant au moins une campagne du coach |
| `GET /admin/coaches` | refus 403 (ou liste vide) — un coach n'a pas à voir ses confrères |
| `GET /admin/dashboard` | KPIs scopés au périmètre du coach |

#### 1.c — Tests

Au moins un test backend par endpoint critique : "un coach ne peut pas accéder à une campagne d'un autre coach" (test 403 ou 404). Couverture super-admin = inchangée.

**Estimation** : 0.5 j.

### Étape 2 — Frontend : redirection post-login

**But** : `/admin/login` redirige vers le bon espace selon le scope.

```tsx
// routes/admin/login.tsx — après mutateAsync
const result = await login.mutateAsync({ username, password });
if (result.scope === 'coach') {
    navigate({ to: '/coach' });
} else {
    navigate({ to: '/admin' });
}
```

Si on garde la lecture via le JWT plutôt que d'élargir la réponse de login (option 1.a alternative) :

```tsx
const claims = parseAdminJwtClaims(result.access_token);
navigate({ to: claims.scope === 'coach' ? '/coach' : '/admin' });
```

**Estimation** : 30 min.

### Étape 3 — Frontend : factoriser `<AppSidebar>` générique

**But** : éviter la duplication massive des 200 lignes de chrome entre `admin/route.tsx` et le futur `coach/route.tsx`.

Créer un composant `<AppSidebar>` paramétré :

```tsx
// components/layout/AppSidebar.tsx
type Props = {
  brand: { name: string; subtitle: string; icon: ElementType };
  navItems: { label: string; to: string; icon: ElementType; exact?: boolean }[];
  onLogout: () => void;
};

export function AppSidebar({ brand, navItems, onLogout }: Props) { /* ... */ }
```

Et un `<MobileTopBar>` pareillement paramétré. Refacto `routes/admin/route.tsx` pour consommer ces composants — pas de changement visuel, juste un découpage en composants réutilisables.

**Estimation** : 0.5 j (refacto + tests visuels manuels).

### Étape 4 — Frontend : créer `routes/coach/`

**But** : le coach a son propre espace, sa propre sidebar, ses propres routes.

#### 4.a — Squelette

```
routes/coach/
├── route.tsx              # chrome (AppSidebar + AppTopBar) + beforeLoad
├── index.tsx              # dashboard coach (KPIs filtrés)
├── campaigns/
│   ├── index.tsx          # liste de SES campagnes
│   └── $campaignId.tsx    # détail (réutilise les composants de admin/campaign-detail/)
└── participants/
    ├── index.tsx          # liste de SES participants
    └── $participantId.matrix.tsx  # déjà existant côté admin, à réutiliser
```

#### 4.b — `beforeLoad` strict

```ts
beforeLoad: () => {
    if (!userAdmin.isAuthenticated()) {
        throw redirect({ to: '/admin/login' });
    }
    const claims = userAdmin.getClaims();
    if (claims?.scope !== 'coach') {
        throw redirect({ to: '/admin' });  // un super-admin tape /coach → renvoyé sur /admin
    }
}
```

Et symétriquement, `routes/admin/route.tsx` ajoute :

```ts
if (claims?.scope === 'coach') {
    throw redirect({ to: '/coach' });  // un coach tape /admin → renvoyé sur /coach
}
```

#### 4.c — Sidebar coach (3-4 items)

| Item | Route |
|---|---|
| Dashboard | `/coach` |
| Mes campagnes | `/coach/campaigns` |
| Mes participants | `/coach/participants` |
| Mon profil (V2 : modifier mdp) | `/coach/profile` |

Pas de "Coachs", "Entreprises", "Réponses" globales — un coach ne voit que ses propres campagnes et leurs sous-objets.

#### 4.d — Dashboard coach

Réutiliser le composant `StatCard` :

| KPI | Source |
|---|---|
| Mes campagnes actives | filtrage côté backend (étape 1.b) |
| Mes participants | idem |
| Réponses collectées sur mes campagnes | idem |
| Prochaine action / restitution | nouveau use case `GetCoachNextAction` (V2) |

**Estimation** : 0.5 j.

### Étape 5 — Tests + validation

- **Backend** : tests d'isolation (un coach ne peut accéder aux données d'un autre coach via aucun endpoint).
- **Frontend** : test du routing post-login (scope=coach → /coach, scope=super-admin → /admin), test du beforeLoad (un super-admin sur /coach → /admin).
- **Manuel** : se connecter en tant que coach, vérifier que la sidebar est dédiée, que les KPIs sont filtrés, qu'aucune donnée hors-périmètre ne fuit.

**Estimation** : 0.25-0.5 j.

---

## 3. Décisions à acter avant exécution

| # | Décision | Choix proposé |
|---|---|---|
| 1 | Scope dans la réponse de login : exposé explicitement (option 1.a) ou décodé du JWT côté frontend (alternative) ? | **Exposé explicitement** — moins de logique de parsing côté frontend, contrat plus clair, et le JWT reste agnostique pour le guard. |
| 2 | Naming backend : `application/coach/` ou `application/coach-session/` ? | **`application/coach-session/`** (cohérent avec `participant-session/`). À acter dans une mise à jour mineure de [ADR-008](adr/ADR-008-backend-layer-first-with-actor-segmentation.md) §2. |
| 3 | Un super-admin peut-il « impersonner » un coach pour debug ? | **Pas en V1.5** — ajouter ça augmente la surface attaque. À considérer en V2 si besoin opérationnel. |
| 4 | Le coach voit-il la liste des autres coaches ? | **Non** — endpoint `GET /admin/coaches` filtré (vide pour scope=coach) ou 403. Au choix selon ce qui simplifie le frontend. |
| 5 | Le coach a-t-il un endpoint pour modifier son propre mot de passe ? | **Pas en V1.5** — le super-admin reset le mot de passe via `PATCH /admin/coaches/:id`. Auto-service en V2. |

---

## 4. Statut d'exécution

| Étape | Statut | Notes |
|---|---|---|
| Audit existant + cadrage | ✅ | Ce document |
| Étape 1.a — Backend : scope dans réponse login | ⏳ | |
| Étape 1.b — Backend : filtres coachId sur endpoints | ⏳ | |
| Étape 1.c — Backend : tests d'isolation | ⏳ | |
| Étape 2 — Frontend : redirection post-login | ⏳ | |
| Étape 3 — Frontend : refacto `<AppSidebar>` | ⏳ | |
| Étape 4.a — Frontend : squelette `routes/coach/` | ⏳ | |
| Étape 4.b — Frontend : beforeLoad scope=coach | ⏳ | |
| Étape 4.c — Frontend : sidebar coach | ⏳ | |
| Étape 4.d — Frontend : dashboard coach | ⏳ | |
| Étape 5 — Tests + validation manuelle | ⏳ | |
| Mise à jour [ADR-008](adr/ADR-008-backend-layer-first-with-actor-segmentation.md) §2 (`coach-session/`) | ⏳ | |

---

## 5. Hors scope V1.5 (à tracer dans TOTO)

- **Workflow validation IA-coach** (cadrage page 8) : analyse IA générée → revue/édition coach → envoi participant. Dépend de l'analyse IA elle-même qui est un autre chantier.
- **Impersonation super-admin → coach** pour debug.
- **Auto-service coach** : changer son propre mot de passe, mettre à jour son profil display name, voir son historique de coachings clos.
- **Notifications coach** : alertes quand un participant termine une étape, etc.
