# ADR-007: `useDrawerForm` + Zod pour les formulaires drawer admin

## Status

Accepted

## Date

2026-04-26

## Context

L'interface admin a 4-5 formulaires de création/édition présentés dans des
drawers latéraux (entreprise, coach, campagne, participant…). Avant cette
décision, chaque drawer ré-implémentait sa plomberie :

- `useState` local pour chaque champ + champs typés explicitement,
- reset manuel quand `open` passe à `true`,
- validation manuelle inline (`values.name.trim().length >= 3`) avec
  `isSubmitDisabled` calculé à la main,
- pas de gestion des erreurs par champ — un seul `Alert` global,
- duplication de la même logique dans 4 fichiers, avec des variantes
  silencieuses (l'un fait `trim`, l'autre pas, l'un `toLowerCase`, l'autre
  pas).

Le `package.json` contenait déjà `@tanstack/react-form` (jamais utilisé), et
l'écosystème offre `react-hook-form` + `@hookform/resolvers/zod` — deux options
matures. Mais ces deux libs ajoutent ~30-50 KB de bundle et une API
supplémentaire à apprendre.

Pour 4 formulaires simples (≤ 8 champs, validation basique), l'effort
d'apprentissage et le poids de bundle ne sont pas justifiés.

## Decision

1. **Créer un hook minimal `useDrawerForm`** ([src/lib/useDrawerForm.ts](../../applications/frontend/src/lib/useDrawerForm.ts))
   qui factorise les 4 responsabilités identifiées :

   ```ts
   const { values, errors, submit, submitting, setField } = useDrawerForm({
       schema: companyFormSchema,    // schema Zod
       defaultValues: buildDefaults(initial),
       open,                          // reset auto sur open=true
       onSubmit,
   });
   ```

   - state local typé via `z.infer<typeof schema>`,
   - reset automatique à l'ouverture,
   - validation au submit via `schema.safeParse(values)` ; les erreurs Zod
     sont projetées en `errors[fieldName]` pour `<TextField helperText>`,
   - flag `submitting` géré autour de l'`onSubmit` async.

2. **Un schema Zod par formulaire**, aligné sur **le contrat API réel** :

   ```ts
   const companyFormSchema = z.object({
       name: z.string().trim().min(1, "Le nom de l'entreprise est requis."),
       contactName: z.string().trim(),
       contactEmail: z.string().trim().refine(
           v => v.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
           { message: 'Email du contact invalide.' }
       ),
   });
   export type CompanyFormValues = z.infer<typeof companyFormSchema>;
   ```

3. **Aucune dépendance ajoutée** — uniquement Zod (déjà au catalog) + React
   primitives (`useState`, `useEffect`, `useCallback`).

4. **Validation au submit, pas à la frappe.** Pour rester simple. Si on a
   besoin de validation live un jour, on étendra le hook (option
   `validateOnChange`).

## Consequences

- **Positives**
  - Boilerplate quasi nul dans chaque drawer : ~5 lignes pour brancher le hook.
  - Drawers maintenant **alignés sur le contrat API** : champs décoratifs
    purement UI éliminés au passage (on a découvert que CompanyDrawer collectait
    7 champs, dont 4 jamais envoyés au backend).
  - Le hardcode `password: 'changeme123'` dans la création de coach a été
    éliminé : le drawer expose un vrai champ avec validation `min(8)` + toggle
    de visibilité.
  - Code plus auditable — un schema Zod = un contrat lisible en 10 lignes.
- **Coûts**
  - Pas de validation live, pas de gestion sophistiquée des field arrays. À
    re-évaluer si un formulaire complexe (multi-step, dynamic fields) émerge.
  - Pas de support natif de `<form>` + `noValidate` — on continue à utiliser
    des `Button onClick`.

## Guardrails (règles de revue)

- Un nouveau drawer admin doit utiliser `useDrawerForm` + un schema Zod défini
  juste à côté du composant.
- Ne pas dupliquer `useState` + `useEffect(reset on open)` quand le hook
  existe — refactorer si on tombe sur du legacy.
- Garder les schemas Zod proches des composants qui les consomment (pas dans
  `@aor/types`) tant qu'ils ne sont pas partagés avec le backend.

## Alternatives Considered

- **`react-hook-form` + `@hookform/resolvers/zod`** : rejeté — pas justifié pour
  4 formulaires simples, ajoute 2 deps + une nouvelle API.
- **`@tanstack/react-form`** (déjà en dep) : rejeté — API plus jeune, courbe
  d'apprentissage non négligeable, et nous n'avons pas besoin du field-array
  pour ces drawers.
- **State local sans hook factorisé** (status quo) : rejeté — duplication
  documentée ci-dessus.

## References

- [src/lib/useDrawerForm.ts](../../applications/frontend/src/lib/useDrawerForm.ts)
- [src/components/admin/AdminCompanyDrawerForm.tsx](../../applications/frontend/src/components/admin/AdminCompanyDrawerForm.tsx) — exemple d'usage simple
- [src/components/admin/AdminCampaignDrawerForm.tsx](../../applications/frontend/src/components/admin/AdminCampaignDrawerForm.tsx) — exemple avec refine cross-field
- [docs/avancement-2026-04-26.md](../avancement-2026-04-26.md) — section M-10 Drawers refacto
