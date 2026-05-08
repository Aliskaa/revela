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
| **Total** | **1** | **7** | **8** | **7** |

État global : **base saine, dérives accumulées**. Pas de refonte de fond nécessaire — un alignement design tokens + déduplication des composants critiques suffit.

> ✅ **Priorité 1 traitée le 2026-05-08.** Bug template literal corrigé, bleu legacy unifié sur le primary du thème (16 occurrences dans 8 fichiers), `borderRadius: 3` redondants supprimés sur tous les `<Button>` (15 occurrences dans 9 fichiers).
>
> ✅ **Bonus design tokens (2026-05-08).** Sur demande utilisateur, **toutes** les couleurs RGB/RGBA et box-shadows brand-tinted ont été centralisées dans [`lib/theme.ts`](../applications/frontend/src/lib/theme.ts). Extension de `palette.tint` (10 nuances primary, 3 nuances secondary, `overlayNeutral`, `overlayWhite`) et nouvelle clé `palette.shadow` typée (12 ombres : `brandSm/Md/Hero/Active/Whisper/Subtle/Paper/HaloPrimary/HaloSecondary`, `cardSoft`, `thumb`). Les `rgba(15,24,152,X)` et `rgba(245,196,0,X)` n'apparaissent plus que dans `theme.ts`. Helper `BRAND_PRIMARY_RGB` exporté pour les libs non-CSS (jsPDF). Conséquence : axe 1 du récap repasse à `0 🟠 / 0 🟡 / 7 ✅`.

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
| 🟡 | **`PageHeroCard` + `desktopTopBar` redondants** : `ScopedAppShell` rend "Vue d'ensemble" en h5, puis la page rend un `PageHeroCard` "Bienvenue sur Révéla !" en h4 → deux titres concurrents l'un sous l'autre | `routes/admin/route.tsx:36-46` ; `routes/admin/index.tsx:49-67` |
| ✅ | `ScopedAppShell` correctement factorisé entre admin et coach via `scope` | `routes/admin/route.tsx:54-66` ; `routes/coach/route.tsx` (à vérifier) |

## Section 3 — UX & feedbacks

| Statut | Constat | Preuve / reste à faire |
|---|---|---|
| ✅ | ~~Bug d'affichage sur la KPI "Progression" du Regard sur soi~~ : passé en template literal (backticks) le 2026-05-08 — la KPI affiche maintenant correctement `X / N` | `routes/_participant/self-rating.tsx:210` (résolu) |
| 🟠 | **Deux UIs distinctes pour le même Self-Rating** : `SelfRatingStep` → `DimensionCards` (sliders MUI, échelle **0-9**, grille 3 colonnes) vs `_participant/self-rating.tsx` → `RatingDimensionCard` → `RatingScale` (ToggleButtonGroup, échelle **1-9**, cartes empilées). **Échelle qui démarre à 0 ou à 1 selon le composant** | `components/questionnaire/SelfRatingStep.tsx` ; `components/common/DimensionCards.tsx:54` (`min={0}`) ; `routes/_participant/self-rating.tsx` ; `components/questionnaire/RatingDimensionCard.tsx` ; `components/questionnaire/RatingScale.tsx:11` (`min = 1`) |
| 🟠 | **Login peu accueillant** : page cadrée par `minHeight: 80vh` (pas plein écran), boîte logo "Révéla" construite à la main au lieu du `BrandMark` partagé, pas d'illustration ni contexte | `routes/login.tsx:49-83` |
| 🟠 | **Feedbacks asymétriques** : erreurs tantôt `Alert` inline tantôt toast ; loading tantôt `LinearProgress` dans une Card tantôt `Skeleton` rows ; succès `Snackbar` qui auto-redirige sans confirmation utilisateur | `components/questionnaire/SelfRatingStep.tsx:67` ; `routes/_participant/index.tsx:166-176` ; `routes/_participant/self-rating.tsx:91-101, 124-137` |
| 🟠 | **Empty states pauvres** : Card outlined + h6 "Aucun parcours pour le moment". Pas d'illustration, pas de CTA, pas de message d'attente | `routes/_participant/index.tsx:260-270` ; idem pour les listes admin |
| 🟡 | **Densité par défaut, pas d'air** : pages admin systématiquement Hero → KpiGrid → Card-avec-table. Trois blocs sans variation, manque de scénographie | `routes/admin/index.tsx` ; `components/scoped/CampaignsListPage.tsx` |
| 🟡 | **Pas de signal de cliquabilité** sur les Cards de listing (transitions hover absentes/discrètes) | `components/scoped/CampaignsListPage.tsx:293-348` |

## Section 4 — Accessibilité

| Statut | Constat | Preuve / reste à faire |
|---|---|---|
| 🟡 | **Slider 0-9** dans `DimensionCards` sans `aria-valuetext` — le lecteur d'écran annonce "5" au lieu de "Comportement exprimé : 5 sur 9" | `components/common/DimensionCards.tsx:48-78` |
| 🟡 | **Snackbar de succès** sans `role="status"` explicite | `routes/_participant/self-rating.tsx:124-137` |
| 🟡 | **Avatar mobile** sans label accessible | `routes/_participant/route.tsx:244` ; `components/layout/ScopedAppShell.tsx:227` |
| ✅ | `role="status"` + `aria-busy` correctement posés sur Card de chargement | `routes/_participant/index.tsx:166-176` |

---

## Stratégie de refonte (par ordre d'impact / effort)

### Priorité 1 — Quick wins (~30 min, faible risque) — ✅ Terminée le 2026-05-08

1. ✅ **Bug `${filledCount}`** : passé en template literal (backticks) sur `routes/_participant/self-rating.tsx:210`.
2. ✅ **Bleu unifié** : 16 occurrences de `rgb(21, 21, 176)` / `rgba(21, 21, 176, …)` migrées vers le primary du thème. Pour les `bgcolor` à opacité 0.08, utilisation du token `tint.primaryBg` (3 cas dans `routes/invite.$token.tsx`). Pour les autres opacités (0.02, 0.05, 0.06, 0.10, 0.15, 0.25), conservation de `rgba(15, 24, 152, X)` aligné sur le primary. Fichiers touchés : `AiPlaceholder.tsx`, `ScientificProgressBar.tsx`, `invite.$token.tsx`, `DimensionCards.tsx`, `PeerRatingStep.tsx`, `questionnaire/helpers.ts`, `MatrixTableMode.tsx`, `LayoutSidebar.tsx`.
3. ✅ **`borderRadius: 3` retirés des `<Button>`** : 15 occurrences dans 9 fichiers (`__root.tsx`, `CompanyDetailPage.tsx`, `CompaniesListPage.tsx`, `CampaignsListPage.tsx`, `CampaignSynthesisPage.tsx`, `CampaignParticipantTransparencyPage.tsx`, `CampaignDetailPage.tsx`, `OpenDetailButton.tsx`, `peer-feedback.tsx`). Le thème continue de fournir `borderRadius: 8` via `MuiButton`. Typecheck OK.

### Priorité 2 — Décisions produit (à arbitrer avant d'écrire du code)

4. **Échelle Likert** : 0-9 ou 1-9 ? À trancher puis imposer dans les deux composants.
5. **UI canonique self-rating** : sliders ou ToggleButtonGroup ? Recommandation : **ToggleButtonGroup** (meilleure accessibilité tactile mobile, pas d'ambiguïté de drag, plus moderne). Conséquence : supprimer `DimensionCards` ou `RatingDimensionCard`, rebrancher `SelfRatingStep`.
6. **Layout participant canonique** : garder `_participant/route.tsx` (neuf) ou `ParticipantLayout` (legacy) ? Items de nav différents, donc décision produit.

### Priorité 3 — Durcir le design system (~2-3 h)

7. **`theme.ts`** :
   - Exporter des constantes `radius = { sm: 8, md: 12, lg: 16, pill: 999 }` et `elevation = { card, raised, brand }`.
   - Renforcer overrides MUI (Button, Card, Chip, Drawer, Paper) pour rendre les `sx={{ borderRadius: 3 }}` inutiles.
   - Ajouter `palette.surface` (paper alt, hover, selected) pour tuer les `rgba(15,23,42,0.04)` en dur.
8. **Typographie** : descendre `h4`/`h5` à `fontWeight: 700` (au lieu de `800`), réserver `800-900` au hero principal de chaque page.
9. **Propager** dans `PageHeroCard`, `StatCard`, `ScopedAppShell` (3-4 fichiers emblématiques).

### Priorité 4 — Dédupliquer les layouts (~3-5 jours)

10. Étendre `ScopedAppShell` pour servir aussi `_participant` (prop `scope: 'admin' | 'coach' | 'participant'`).
11. Supprimer `ParticipantLayout`, `LayoutSidebar`, `ResponsiveSidebarLayout`, `Navbar` une fois orphelins.
12. Factoriser `BrandMark` et `MobileTopBar` dans des fichiers dédiés.

### Priorité 5 — Moderniser l'expérience (~5-7 jours)

13. **Login** : pleine page, split layout (form + brand à gauche, illustration / quote à droite).
14. **Empty states** : composant `EmptyState` réutilisable (icône, titre, description, CTA).
15. **Page hero** : supprimer les `desktopTopBar` quand un `PageHeroCard` existe — un seul titre par écran.
16. **Self-rating** : sticky footer "Sauver" mobile, indicateur de progression sticky, `aria-valuetext`.
17. **Skeletons cohérents** : créer `LoadingCard` qui remplace les variations actuelles.
18. **Snackbar** : centraliser via `useToast()`, supprimer les `Alert` inline.

### Priorité 6 — Touches finales (en continu)

19. Audit Lighthouse / Axe.
20. Réduire la densité d'ombres : `Card` interactives uniquement (drawer ouvert, modale) en `elevation: raised`.
21. Animations subtiles (200ms cubic-bezier) sur hover des Cards de listing.

---

## Décisions à prendre avant exécution

1. Échelle Likert : **0-9** ou **1-9** ?
2. Composant self-rating canonique : **slider** ou **ToggleButtonGroup** ?
3. Layout participant canonique : items **`Dashboard / Mes campagnes / Mon profil`** (neuf) ou **`Mon parcours / Mes résultats / Ressources`** (legacy) ?
4. Stratégie de mise à jour : **patch chirurgical** (P1 seulement, ~30 min) ou **vague structurante** (P1 → P3, ~3-4 h) ?

Une fois ces 4 points tranchés, l'exécution peut démarrer sans nouveau cycle de validation.
