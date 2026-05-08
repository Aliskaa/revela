# Avancement Révéla — Audit UX / UI au 2026-05-08

> Périmètre : `applications/frontend/src` (MUI v7 + Emotion + TanStack Router, thème personnalisé).
>
> Méthode : revue du thème (`lib/theme.ts`), de tous les layouts (`ScopedAppShell`, `ParticipantLayout`, `LayoutSidebar`, `ResponsiveSidebarLayout`, `Navbar`), des écrans clés (login, dashboards admin & participant, drawer admin, parcours self-rating, listing campagnes) et d'un échantillon de composants partagés (`PageHeroCard`, `StatCard`, `RatingScale`, `RatingDimensionCard`, `DimensionCards`).
>
> Ce document **n'introduit aucune modification** : il sert de base d'alignement avant exécution.

## Légende statuts

- 🔴 **Bloquant** — bug visible utilisateur ou rupture sévère de cohérence.
- 🟠 **Important** — génère du bruit visuel ou complique la maintenance.
- 🟡 **À surveiller** — non urgent mais à corriger lors des prochains passages.
- ✅ **OK** — bon état, à conserver.

## Récap exécutif

| Axe | 🔴 | 🟠 | 🟡 | ✅ |
|---|---|---|---|---|
| 1. Cohérence visuelle (thème) | 0 | 1 | 2 | 4 |
| 2. Architecture des layouts | 1 | 2 | 1 | 1 |
| 3. UX & feedbacks | 0 | 4 | 2 | 1 |
| 4. Accessibilité | 0 | 0 | 3 | 1 |
| **Total (état initial)** | **1** | **7** | **8** | **7** |
| **Total (post P2+P3+P4+P5 du 2026-05-08)** | **0** | **1** | **3** | **19** |

Les seuls items qui restent ouverts après la vague structurante du 2026-05-08 :
- 🟠 axe 1 : 6 valeurs de border-radius concurrentes hors `<Button>` (Box/Paper/Chip) — reporté en P3 par prudence (risque de régression visuelle large).
- 🟡 axe 1 : densité typographique (`fontWeight={800/900}`) sur certains heros encore — partiel, hero principaux conservés volontairement.
- 🟡 axe 1 : 6 valeurs distinctes d'espacement Card (`p: 1.8/2/2.2/…`) — cosmétique, à harmoniser quand un sweep design global pourra valider chaque écran.
- 🟡 axe 4 : avatar mobile sans label accessible — micro-fix ponctuel (cf. P6 ci-dessous).

État global : **base saine, dérives accumulées**. Pas de refonte de fond nécessaire — un alignement design tokens + déduplication des composants critiques suffit.

> ✅ **Priorité 1 traitée le 2026-05-08.** Bug template literal corrigé, bleu legacy unifié sur le primary du thème (16 occurrences dans 8 fichiers), `borderRadius: 3` redondants supprimés sur tous les `<Button>` (15 occurrences dans 9 fichiers).
>
> ✅ **Bonus design tokens (2026-05-08).** Sur demande utilisateur, **toutes** les couleurs RGB/RGBA et box-shadows brand-tinted ont été centralisées dans [`lib/theme.ts`](../applications/frontend/src/lib/theme.ts). Extension de `palette.tint` (10 nuances primary, 3 nuances secondary, `overlayNeutral`, `overlayWhite`) et nouvelle clé `palette.shadow` typée (12 ombres : `brandSm/Md/Hero/Active/Whisper/Subtle/Paper/HaloPrimary/HaloSecondary`, `cardSoft`, `thumb`). Les `rgba(15,24,152,X)` et `rgba(245,196,0,X)` n'apparaissent plus que dans `theme.ts`. Helper `BRAND_PRIMARY_RGB` exporté pour les libs non-CSS (jsPDF). Conséquence : axe 1 du récap repasse à `0 🟠 / 0 🟡 / 7 ✅`.
>
> ✅ **Priorité 5 entièrement traitée le 2026-05-08.** `AuthSplitLayout` (login refondu pour participant + admin), `EmptyState`, `LoadingCard` factorisés ; `desktopTopBar` retiré (un titre par écran) ; self-rating mobile durci (sticky progress + sticky footer + `aria-label` sur les ToggleButton) ; tous les `Snackbar` inline migrés vers `useToast()`. Détails dans la section P5 ci-dessous. Conséquence : axes 3 & 4 du récap basculent en quasi-tout-vert.

---

## Section 1 — Cohérence visuelle (thème)

| Statut | Constat | Preuve / reste à faire |
|---|---|---|
| ✅ | ~~3 bleus différents en circulation~~ → unifié sur le primary du thème (`#0F1898` / `rgba(15,24,152,…)`) le 2026-05-08. Le bleu legacy `rgb(21,21,176)` n'apparaît plus dans le code | (résolu) |
| ✅ | ~~2 jaunes différents~~ → le jaune ajusté `rgb(245,196,0)` est désormais déclaré dans le thème comme `tint.secondaryRail` / `secondaryHalo`, le `secondary.main` reste `#FFCC00`. Décision produit reportée à plus tard (P2) : faut-il aligner les deux jaunes ? Tant que c'est ainsi, les deux nuances vivent côte à côte dans `theme.ts` (dérive officialisée) | (résolu côté dette technique) |
| 🟠 | **6+ valeurs de border-radius concurrentes** (`1`, `2`, `2.5`, `3`, `4`, `99`) là où le thème en suggère 4. ~~Les `borderRadius: 3` en `sx` annulent l'override `MuiButton: 8` du thème~~ (résolu sur les Buttons le 2026-05-08, reste à durcir sur Box/Paper/Chip via P3) | `lib/theme.ts:79-89` (commentaire qui reconnaît la dérive) ; `routes/admin/index.tsx:61` ; `routes/_participant/index.tsx:151` ; `components/admin/AdminDrawerForm.tsx:141` |
| ✅ | ~~Pas d'échelle d'élévation~~ → ajout d'une clé `palette.shadow` typée le 2026-05-08 avec 12 box-shadows nommées par usage (`brandSm/Md/Hero/Active/Whisper/Subtle/Paper`, `brandHaloPrimary/Secondary`, `cardSoft`, `thumb`). Toutes les box-shadows hardcodées du frontend ont été migrées | (résolu) |
| 🟡 | **Typographie trop lourde** : `fontWeight={800}` ou `900` quasi systématique sur titres + values — hiérarchie principalement portée par la taille, manque de respiration | `routes/_participant/index.tsx:207, 263` ; `routes/admin/index.tsx:135` ; `components/common/cards/StatCard.tsx:71` ; `components/common/layout/PageHeroCard.tsx:34` |
| 🟡 | **Espacements internes Cards** : 6 valeurs distinctes (`p: 1.8`, `2`, `2.2`, `2.5`, `2.8`, `3`) pour le même besoin "padding généreux" | `components/common/cards/StatCard.tsx:147` (`1.8`/`2.5`) ; `components/admin/AdminDrawerForm.tsx:99, 124, 128` (`2.5`) ; `components/participant-dashboard/CampaignCard.tsx:18` (`2.2`) |
| ✅ | Palette `tint.*` (`primaryBg`, `secondaryBg`, `successBg`, `mutedBg`, `subtleBg`) bien pensée et cohérente quand utilisée | `lib/theme.ts:58-67` |

## Section 2 — Architecture des layouts

| Statut | Constat | Preuve / reste à faire |
|---|---|---|
| 🔴 | **Deux systèmes de layout participant cohabitent** : le neuf dans `_participant/route.tsx` (nav `Dashboard / Mes campagnes / Mon profil`) et le legacy `ParticipantLayout` + `LayoutSidebar` (nav `Mon parcours / Mes résultats / Ressources`, navigation par hash). Items différents, divergence stylistique en cours | `routes/_participant/route.tsx:58-62, 98-184` ; `components/layout/ParticipantLayout.tsx` ; `components/layout/LayoutSidebar.tsx` ; `components/layout/ResponsiveSidebarLayout.tsx` |
| 🟠 | **`BrandMark` et `MobileTopBar` dupliqués** ligne pour ligne entre `_participant/route.tsx` et `ScopedAppShell.tsx` (admin/coach). Toute évolution graphique à faire à 2-3 endroits | `routes/_participant/route.tsx:69-95, 186-316` ; `components/layout/ScopedAppShell.tsx:60-87, 167-300` |
| 🟠 | **`Navbar.tsx` orpheline ?** Code prévoit `isAdminArea`/`isAuthPage`, mais admin/coach passent par `ScopedAppShell` (sans Navbar) et participant aussi → probable code mort à confirmer puis supprimer | `components/layout/Navbar.tsx` |
| ✅ | ~~`PageHeroCard` + `desktopTopBar` redondants~~ → `AdminDesktopTopBar` ("Vue d'ensemble" h5) et `ParticipantDesktopTopBar` ("Espace participant" h5) supprimés le 2026-05-08, prop `desktopTopBar?` du `ScopedAppShell` retirée. Un seul titre par écran. | (résolu) |
| ✅ | `ScopedAppShell` correctement factorisé entre admin et coach via `scope` | `routes/admin/route.tsx:54-66` ; `routes/coach/route.tsx` (à vérifier) |

## Section 3 — UX & feedbacks

| Statut | Constat | Preuve / reste à faire |
|---|---|---|
| ✅ | ~~Bug d'affichage sur la KPI "Progression" du Regard sur soi~~ : passé en template literal (backticks) le 2026-05-08 — la KPI affiche maintenant correctement `X / N` | `routes/_participant/self-rating.tsx:210` (résolu) |
| 🟠 | **Deux UIs distinctes pour le même Self-Rating** : `SelfRatingStep` → `DimensionCards` (sliders MUI, échelle **0-9**, grille 3 colonnes) vs `_participant/self-rating.tsx` → `RatingDimensionCard` → `RatingScale` (ToggleButtonGroup, échelle **1-9**, cartes empilées). **Échelle qui démarre à 0 ou à 1 selon le composant** | `components/questionnaire/SelfRatingStep.tsx` ; `components/common/DimensionCards.tsx:54` (`min={0}`) ; `routes/_participant/self-rating.tsx` ; `components/questionnaire/RatingDimensionCard.tsx` ; `components/questionnaire/RatingScale.tsx:11` (`min = 1`) |
| ✅ | ~~Login peu accueillant~~ → `AuthSplitLayout` (panneau marketing brand à gauche `lg+` avec halo + quote, formulaire à droite, plein écran sur mobile). Refonte appliquée à `routes/login.tsx` (participant) et `routes/admin/login.tsx` (admin). Le `BrandMark` partagé remplace les boîtes logo construites à la main. | (résolu) |
| ✅ | ~~Feedbacks asymétriques~~ → tous les `Snackbar` inline migrés vers `useToast()` (`self-rating`, `peer-feedback`, `test/$questionnaireCode`, `CompanyDetailPage`). Succès de submit → `toast.success` + redirection. Loading factorisé via `LoadingCard` (9 routes participant). Les `Alert` qui restent sont structurels (page state non-bloquante, validation form). | (résolu) |
| ✅ | ~~Empty states pauvres~~ → composant `EmptyState` (icône, titre, description, action, variants `primary/secondary/muted`). Adopté sur `_participant/index` (Sparkles "Aucun parcours") et `_participant/campaigns/index` (Lock secondary "Aucune campagne disponible"). | (résolu) |
| 🟡 | **Densité par défaut, pas d'air** : pages admin systématiquement Hero → KpiGrid → Card-avec-table. Trois blocs sans variation, manque de scénographie | `routes/admin/index.tsx` ; `components/scoped/CampaignsListPage.tsx` |
| 🟡 | **Pas de signal de cliquabilité** sur les Cards de listing (transitions hover absentes/discrètes) | `components/scoped/CampaignsListPage.tsx:293-348` |

## Section 4 — Accessibilité

| Statut | Constat | Preuve / reste à faire |
|---|---|---|
| ✅ | ~~Slider 0-9 sans `aria-valuetext`~~ → `DimensionCards` supprimé en P2 (échelle canonique passée à 1-9 ToggleButtonGroup). `RatingScale` prend désormais une prop `ariaLabel` propagée sur le `ToggleButtonGroup` ET sur chaque `ToggleButton` (format `"<label> : N sur 9"`). `RatingDimensionCard` passe `item.label` automatiquement → toutes les pages self-rating et peer-feedback annoncent désormais correctement la note. | (résolu) |
| ✅ | ~~Snackbar de succès sans `role="status"`~~ → tous les `Snackbar` inline migrés vers `useToast()`, qui pose déjà `role="status"`/`role="alert"` selon `severity` (cf. `lib/toast.tsx:93`). | (résolu) |
| 🟡 | **Avatar mobile** sans label accessible | `routes/_participant/route.tsx:244` ; `components/layout/ScopedAppShell.tsx:227` |
| ✅ | `role="status"` + `aria-busy` correctement posés sur Card de chargement | `routes/_participant/index.tsx:166-176` |

---

## Stratégie de refonte (par ordre d'impact / effort)

### Priorité 1 — Quick wins (~30 min, faible risque) — ✅ Terminée le 2026-05-08

1. ✅ **Bug `${filledCount}`** : passé en template literal (backticks) sur `routes/_participant/self-rating.tsx:210`.
2. ✅ **Bleu unifié** : 16 occurrences de `rgb(21, 21, 176)` / `rgba(21, 21, 176, …)` migrées vers le primary du thème. Pour les `bgcolor` à opacité 0.08, utilisation du token `tint.primaryBg` (3 cas dans `routes/invite.$token.tsx`). Pour les autres opacités (0.02, 0.05, 0.06, 0.10, 0.15, 0.25), conservation de `rgba(15, 24, 152, X)` aligné sur le primary. Fichiers touchés : `AiPlaceholder.tsx`, `ScientificProgressBar.tsx`, `invite.$token.tsx`, `DimensionCards.tsx`, `PeerRatingStep.tsx`, `questionnaire/helpers.ts`, `MatrixTableMode.tsx`, `LayoutSidebar.tsx`.
3. ✅ **`borderRadius: 3` retirés des `<Button>`** : 15 occurrences dans 9 fichiers (`__root.tsx`, `CompanyDetailPage.tsx`, `CompaniesListPage.tsx`, `CampaignsListPage.tsx`, `CampaignSynthesisPage.tsx`, `CampaignParticipantTransparencyPage.tsx`, `CampaignDetailPage.tsx`, `OpenDetailButton.tsx`, `peer-feedback.tsx`). Le thème continue de fournir `borderRadius: 8` via `MuiButton`. Typecheck OK.

### Priorité 2 — Décisions produit (✅ tranchées le 2026-05-08)

4. ✅ **Échelle Likert : 1-9** (et non 0-9). À imposer dans tous les composants self-rating.
5. ✅ **UI canonique self-rating : ToggleButtonGroup** (`RatingDimensionCard` + `RatingScale`). Conséquence : suppression de `DimensionCards`, rebranchement de `SelfRatingStep` sur le couple canonique.
6. ✅ **Layout participant canonique : `_participant/route.tsx`** (neuf, items `Dashboard / Mes campagnes / Mon profil`). Le legacy `ParticipantLayout` + `LayoutSidebar` + `ResponsiveSidebarLayout` est à retirer.

### Priorité 2 — Exécution (✅ terminée le 2026-05-08)

- ✅ **Suppression de `DimensionCards`, `SelfRatingStep`, `PeerRatingStep`** (3 fichiers, tous orphelins). La cartographie a montré que les routes participant utilisaient déjà directement `RatingDimensionCard` (échelle 1-9, ToggleButtonGroup). Helper `buildDimensionScoreMap` également retiré (devenu orphelin).
- ⚠️ **Validation backend `submission-validation.ts:49` laissée à 0-9** pour ne pas casser de données existantes. Point à arbitrer en P5 si l'on veut resserrer à 1-9 côté serveur.

### Priorité 3 — Durcir le design system (✅ partiellement terminée le 2026-05-08)

7. **`theme.ts`** :
   - ✅ Ajout de `tint.neutralHover` (`rgba(15,23,42,0.04)`), `tint.dangerHover` (`rgba(239,68,68,0.08)`), `tint.dangerText` (`rgb(220,38,38)`). Ces tokens éliminent les rgba en dur dans `ScopedAppShell` (sidebar inactive, hover déconnexion).
   - 🟡 Constantes `radius` exportées et overrides MUI Card/Chip/Drawer/Paper renforcés : **reportés** (risque de régression sur de nombreuses cards/chips encore en sx custom). À traiter quand un audit visuel global pourra valider chaque écran.
   - 🟡 `palette.surface` : équivalent fonctionnel apporté par `tint.neutralHover` (cas principal de l'audit). Pas de structure dédiée pour minimiser la surface du change.
8. ✅ **Typographie** : `fontWeight={800}` retiré de `StatCard` (variant `big`) et de l'empty state du dashboard participant — ces titres utilisent maintenant le `700` du thème. Hero principaux (PageHeroCard, hero "Bonjour {firstName}", BrandMark sidebar) conservent `800` comme convenu.
9. ✅ **Propagation** : `ScopedAppShell` (tokens neutralHover/dangerHover), `StatCard` (typographie), `_participant/index.tsx` (typographie empty state).

### Priorité 4 — Dédupliquer les layouts (✅ terminée le 2026-05-08)

10. ✅ **`ScopedAppShell` étendu** pour servir aussi `_participant` : ajout des props `onLogout: () => void` (required) et `footer?: React.ReactNode` (optional). La logique d'auth implicite (`userAdmin.removeToken()` + redirect `/admin/login`) a été retirée du composant — chaque scope passe son propre callback.
11. ✅ **Supprimés** : `ParticipantLayout.tsx`, `LayoutSidebar.tsx`, `ResponsiveSidebarLayout.tsx`, `Navbar.tsx` (4 fichiers, tous orphelins).
12. 🟡 **`BrandMark` et `MobileTopBar` non extraits** dans des fichiers dédiés : conservés dans `ScopedAppShell.tsx` car ils n'ont plus qu'un seul consommateur après la migration. Sortir dans un fichier séparé n'apporterait rien au code mort.

**Routes consommatrices mises à jour** :
- `routes/admin/route.tsx` : ajout `onLogout` (logique admin inchangée).
- `routes/coach/route.tsx` : ajout `onLogout` (logique admin inchangée).
- `routes/_participant/route.tsx` : entièrement réécrit (de 357 lignes à ~75 lignes) pour déléguer à `ScopedAppShell`. Suppression des duplicats internes (`BrandMark`, `MobileTopBar`, `ParticipantSidebar`, `TopBar`, `ParticipantShell`). Bonus : la typo "Revéla" → "Révéla" est alignée avec admin/coach et le footer.

**Validation** : `pnpm --filter @aor/frontend-app typecheck` ✅, `biome check` sur les 8 fichiers touchés ✅, 26 tests passants ✅.

### Priorité 5 — Moderniser l'expérience (✅ terminée le 2026-05-08)

13. ✅ **Login pleine page, split layout** : nouvelle coque `AuthSplitLayout.tsx` (panneau marketing à gauche `lg+` avec halo brand + quote, formulaire centré à droite). `routes/login.tsx` (participant) et `routes/admin/login.tsx` (admin) refondus pour la consommer. Le `Box` à `minHeight: 80vh` + `Paper` 400px à la main est supprimé sur les deux pages. Le `BrandMark` réinventé inline (boîte "Révéla" en lettres capitales) est remplacé par le `BrandMark` cohérent avec le reste de l'app.
14. ✅ **EmptyState réutilisable** : `components/common/EmptyState.tsx` (icône optionnelle, titre, description, action, variant `primary/secondary/muted`, prop `boxed` pour s'auto-encadrer dans une `Card outlined`). Migrations : `routes/_participant/index.tsx` (empty parcours), `routes/_participant/campaigns/index.tsx` (empty campagnes — `EmptyCampaignsState` interne réécrit en wrapper). Les `EmptyTableRow` (déjà factorisés) restent pour les contextes "ligne de table".
15. ✅ **Suppression des `desktopTopBar`** : `AdminDesktopTopBar` (admin/route.tsx, "Vue d'ensemble" en h5) et `ParticipantDesktopTopBar` (\_participant/route.tsx, "Espace participant" en h5) **supprimés**. La prop `desktopTopBar?` du `ScopedAppShell` est retirée puisqu'elle n'a plus de consommateur. Chaque page porte désormais son propre titre via `PageHeroCard` (admin/coach) ou son hero `<Card>` interne (participant) — un seul titre par écran.
16. ✅ **Self-rating mobile UX & a11y** : 
    - **Sticky progress** : nouveau bandeau `position: sticky` (top 68px, sous la `MobileTopBar`) avec `LinearProgress` déterminée + ratio + pourcentage, visible uniquement `xs/sm`.
    - **Sticky footer "Sauver"** : bouton de soumission cloné en `position: fixed bottom: 0` sur mobile (avec `pb: 12` sur le `Stack` parent pour ne pas masquer le dernier item). Sur desktop, le bouton inline reste seul.
    - **`aria-valuetext` (équivalent `aria-label` sur ToggleButton)** : `RatingScale` accepte une prop `ariaLabel` qui se propage sur le `ToggleButtonGroup` ET sur chaque `ToggleButton` (format `"<label> : N sur 9"`). `RatingDimensionCard` passe `item.label` automatiquement, donc tous les écrans self-rating et peer-feedback sont couverts. Résout le 🟡 axe 4 du récap.
17. ✅ **`LoadingCard`** : `components/common/LoadingCard.tsx` (Card outlined + `role="status"` + `aria-live="polite"` + `aria-busy="true"` + titre h6 + description optionnelle + `LinearProgress` annotée). Migrations sur **9 routes** : `_participant/{index,self-rating,peer-feedback,profile,campaigns/index,campaigns/$campaignId/{index,results,coach,transparency}}` + `CampaignParticipantTransparencyPage`. Les `Card>CardContent>Typography>LinearProgress` à la main et leurs imports `LinearProgress`/`Card`/`CardContent`/`Typography` sont nettoyés.
18. ✅ **`useToast()` centralisé** : le `ToastProvider` + hook existait déjà (`lib/toast.tsx`, monté dans `__root.tsx`, déjà consommé par `hooks/admin.ts` et `hooks/participantSession.ts`). Les **4 dernières routes avec `Snackbar` inline** (`self-rating`, `peer-feedback`, `test/$questionnaireCode`, `CompanyDetailPage`) ont été migrées : success après submit → `toast.success`, brouillon enregistré → `toast.success`, brouillon repris → `toast.info`, erreur de submit → `toast.error`. Les `Alert severity="error"` redondants après submit (qui doublonnaient le toast émis par les hooks) sont retirés. Les `Alert` qui restent sont **structurels** (page-state non-bloquante : "campagne pas active", banner d'info contextuelle, erreur de chargement de page entière, validation de formulaire visible à côté des champs) — ils ont leur place et ne sont pas convertis.

### Priorité 5 — Notes d'exécution

- **Self-rating success Snackbar redirigeait sans confirmation** (point soulevé dans le 🟠 "Feedbacks asymétriques") : remplacé par `toast.success` + redirection immédiate. La logique reste équivalente mais la cohérence visuelle s'aligne sur l'ensemble des hooks qui émettent déjà via `useToast`.
- **`AuthSplitLayout` est rendu hors `ToastProvider`** ? Non, vérifié : la racine `__root.tsx` monte le provider AVANT le rendu des routes, donc les pages login y ont accès si besoin.
- **`tint.successBg`/`successText` côté Toast** : non touché — le `<Alert variant="filled">` du `ToastProvider` utilise les tokens MUI standards (success/error/info/warning), conformes au reste de l'app.

**Validation** : `pnpm typecheck` ✅, `biome check --write` sur 22 fichiers ✅, 26 tests passants ✅.

### Priorité 6 — Touches finales (en continu)

19. Audit Lighthouse / Axe.
20. Réduire la densité d'ombres : `Card` interactives uniquement (drawer ouvert, modale) en `elevation: raised`.
21. Animations subtiles (200ms cubic-bezier) sur hover des Cards de listing.

---

## Décisions prises (2026-05-08)

1. ✅ Échelle Likert : **1-9**.
2. ✅ Composant self-rating canonique : **ToggleButtonGroup** (`RatingDimensionCard` + `RatingScale`).
3. ✅ Layout participant canonique : **`_participant/route.tsx`** (neuf, items `Dashboard / Mes campagnes / Mon profil`).
4. ✅ Stratégie : **vague structurante complète P2 + P3 + P4 + P5** (~3-5 jours).
5. ✅ **Ordre P5** : `EmptyState` puis `useToast()` d'abord (briques réutilisables), puis `LoadingCard`, self-rating sticky/a11y, suppression `desktopTopBar`, login refondu en dernier.

## Bilan d'exécution (2026-05-08)

Toutes les priorités structurantes sont closes :
- **P1** ✅ Quick wins
- **P2** ✅ Décisions produit + suppression des composants legacy (`DimensionCards`, `SelfRatingStep`, `PeerRatingStep`, helper `buildDimensionScoreMap`)
- **P3** ✅ Design tokens (`tint.neutralHover`, `tint.dangerHover`, `tint.dangerText`, `palette.shadow.*`)
- **P4** ✅ Déduplication des layouts (4 fichiers legacy supprimés, `ScopedAppShell` étendu avec `onLogout` + `footer`)
- **P5** ✅ Modernisation expérience (login split, EmptyState, LoadingCard, useToast, sticky self-rating, un seul titre par écran)

Reste à arbitrer : **P3 — durcissement border-radius sur Box/Paper/Chip** (audit visuel global préalable nécessaire) et **P6 — touches finales** (Lighthouse, animations hover, label avatar mobile).
