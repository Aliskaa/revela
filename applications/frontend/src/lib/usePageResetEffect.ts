// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import * as React from 'react';

/**
 * Réinitialise la pagination à `0` quand l'une des dépendances passées change.
 *
 * Pattern initialement écrit en ligne dans 6 routes admin :
 *
 * ```ts
 * React.useEffect(() => { setPage(0); }, [search]);
 * ```
 *
 * Biome (`useExhaustiveDependencies`) signalait ces appels parce que `search` figurait dans la deps
 * array mais n'était pas lu dans le body — c'était volontaire (effet de "changement détecté"), mais
 * répété dans 6 fichiers. En centralisant ici, l'intention « reset page on filter/perPage change »
 * devient explicite, et le `biome-ignore` est justifié à un seul endroit.
 *
 * Toutes les valeurs passées dans `triggers` sont incluses comme dépendances de l'effet.
 */
export function usePageResetEffect(setPage: (page: number) => void, triggers: ReadonlyArray<unknown>) {
    React.useEffect(() => {
        setPage(0);
        // Biome ne déclenche pas `useExhaustiveDependencies` ici car le spread `...triggers` rend la
        // deps array opaque à l'analyse statique — c'est précisément ce qu'on veut : l'effet doit se
        // relancer à chaque changement d'un trigger sans qu'on n'ait à lire les valeurs dans le body.
    }, [setPage, ...triggers]);
}
