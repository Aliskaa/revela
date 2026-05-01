# ADR-006: Toast émis par les hooks de mutation, pas par les routes

## Status

Accepted

## Date

2026-04-26

## Context

Le frontend a besoin d'un système de feedback utilisateur uniforme après les
mutations (création, mise à jour, suppression, import, invitation, etc.) :

- succès : "Entreprise créée", "Profil mis à jour", "N invitations envoyées"
- échec : "Échec — réessayez" (idéalement avec un message API si disponible)

Sans politique commune, le feedback se retrouve **dispersé dans les routes** :
chaque route appelle `mutation.mutateAsync(...)`, gère son propre
`<Snackbar>` local, ses propres `Alert` d'erreur, son propre format de message.
Symptômes observés avant cette décision :

- Trois implémentations de Snackbar locale dans 3 routes différentes,
- 5 routes qui ne donnaient **aucun feedback** sur les mutations,
- formulation des messages variable (`"Erreur"` vs `"Échec"` vs `"Une erreur est survenue"`),
- propagation manuelle des erreurs (`mutation.isError` propagé en prop `error?` au drawer),
- duplication du try/catch autour de `mutateAsync` partout.

Avec l'arrivée d'un `ToastProvider` global (Sprint 3 #16), on peut centraliser
ce feedback **côté hook**, là où la mutation est définie.

## Decision

1. **Un `ToastProvider` à la racine** ([src/lib/toast.tsx](../../applications/frontend/src/lib/toast.tsx))
   expose un hook `useToast()` avec helpers `success/error/info/warning/notify`.

2. **Chaque hook `useMutation`** (sous `src/hooks/`) appelle `useToast()` et émet
   son propre toast de succès et d'erreur, **sans rien attendre de la route appelante**.

   ```ts
   export function useCreateCompany() {
       const qc = useQueryClient();
       const toast = useToast();
       return useMutation({
           mutationFn: payload => apiClient.post('/admin/companies', payload).then(r => r.data),
           onSuccess: (_, vars) => {
               qc.invalidateQueries({ queryKey: adminKeys.companies });
               toast.success(`Entreprise « ${vars.name} » créée.`);
           },
           onError: err => toast.error(toErrorMessage(err, "Échec de la création de l'entreprise.")),
       });
   }
   ```

3. **Les routes ne dupliquent plus le feedback**. Elles consomment juste
   `mutateAsync` dans un `try { ... } catch { /* le toast est émis par le hook */ }` et
   ferment le drawer / réinitialisent le formulaire selon leur logique d'UI :

   ```tsx
   onSubmit={async values => {
       try {
           await createCompany.mutateAsync(values);
           setDrawerOpen(false);
       } catch {
           // Le toast d'erreur est émis par le hook ; on garde le drawer ouvert.
       }
   }}
   ```

4. **Helper standardisé** `toErrorMessage(err, fallback)` pour extraire
   `err.message` quand présent, sinon le fallback humanisé en français.

5. **Sévérités** :
   - `toast.success` pour les confirmations (durée par défaut 3s, ou 4s pour les
     messages plus longs).
   - `toast.error` pour les échecs (durée 6s, plus long pour permettre la lecture).
   - `toast.warning` pour actions destructives confirmées.
   - `toast.info` rarement utilisé directement, plutôt pour des notifications
     système (mise à jour disponible, etc.).

## Consequences

- **Positives**
  - Cohérence totale du feedback utilisateur — tous les `useMutation` parlent
    la même langue.
  - Les routes maigrissent : plus de `Snackbar` local, plus de `Alert`
    d'erreur dans le JSX, plus de prop `error?` propagée.
  - Refactor des routes >300L facilité (M-5) — moins de plomberie.
  - Un seul endroit à modifier pour changer le ton (passer du "vous" au "tu",
    rebrand, traduction i18n).
- **Coûts**
  - Un hook qui veut **omettre** le toast (cas rare, ex. pré-remplir un draft
    silencieusement) doit refactorer le hook pour exposer une option, ou créer
    un second hook. Pas rencontré jusqu'ici.
  - Si un jour on a deux contextes UI très différents (admin desktop vs
    embed mobile), on pourrait vouloir des messages contextuels — auquel cas
    on extraira les messages dans une fonction injectable.

## Guardrails (règles de revue)

- Une nouvelle route qui consomme un `useMutation` ne doit **pas** ajouter
  un Snackbar local.
- Si un nouveau hook `useXxxMutation` est ajouté, il doit consommer
  `useToast()` et émettre `success` + `error` par défaut.
- Si l'API renvoie une erreur enrichie (champ `error.cause`, code métier),
  passer cette info via le hook, pas via la route.

## Alternatives Considered

- **Toast émis par les routes** (status quo initial) : rejeté pour la
  duplication massive et l'incohérence des messages.
- **Toast émis par un middleware Axios** : rejeté car certains succès n'ont pas
  de message à afficher (ex. polling), et la mutation a un meilleur contexte
  sémantique (`vars` typés) qu'un middleware HTTP générique.
- **Bibliothèque tierce avec stack** (`notistack`, `sonner`, `react-hot-toast`) :
  reportée. Le `<Snackbar>` MUI suffit pour l'instant, et on évite une dep
  supplémentaire. Si on a besoin d'empilement, on bascule.

## References

- [src/lib/toast.tsx](../../applications/frontend/src/lib/toast.tsx)
- [src/hooks/admin.ts](../../applications/frontend/src/hooks/admin.ts)
- [docs/avancement-2026-04-26.md](../avancement-2026-04-26.md) — section toast/snackbar global
