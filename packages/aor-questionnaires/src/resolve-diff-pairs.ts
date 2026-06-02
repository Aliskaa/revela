// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

/** Minimal shape for a result dimension when resolving e/w score pairs. */
export type ResultDimScorePairsInput = {
    readonly scores: readonly number[];
    readonly diff_pairs?: ReadonlyArray<{ readonly e: number; readonly w: number }>;
};

/**
 * Returns (e, w) score-key pairs for gap / écart computation.
 * Uses explicit `diff_pairs` when present; otherwise pairs consecutive scores
 * (convention: actuel, idéal, … en alternance dans `result_dims[].scores`).
 */
export function resolveResultDimDiffPairs(dim: ResultDimScorePairsInput): Array<{ e: number; w: number }> {
    if (dim.diff_pairs && dim.diff_pairs.length > 0) {
        return dim.diff_pairs.map(pair => ({ e: pair.e, w: pair.w }));
    }
    const pairs: Array<{ e: number; w: number }> = [];
    for (let i = 0; i + 1 < dim.scores.length; i += 2) {
        const e = dim.scores[i];
        const w = dim.scores[i + 1];
        if (e === undefined || w === undefined) {
            continue;
        }
        pairs.push({ e, w });
    }
    return pairs;
}
