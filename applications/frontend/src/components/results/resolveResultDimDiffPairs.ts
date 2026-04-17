import type { DiffPair, ResultDim } from '@aor/types';

/**
 * Résout les paires (e, w) utilisées par {@link CalculationBlock}.
 * L'API peut renvoyer uniquement `scores` par dimension (ex. questionnaire F) sans `diff_pairs` :
 * on regroupe alors les scores par paires consécutives, comme dans le catalogue ICO.
 */
export const resolveResultDimDiffPairs = (
    dim: ResultDim,
    shortLabels: Record<string, string> | undefined,
): DiffPair[] => {
    if (dim.diff_pairs && dim.diff_pairs.length > 0) {
        return dim.diff_pairs;
    }

    const { scores } = dim;
    if (scores.length < 2 || scores.length % 2 !== 0) {
        return [];
    }

    const pairs: DiffPair[] = [];
    for (let i = 0; i < scores.length; i += 2) {
        const e = scores[i];
        const w = scores[i + 1];
        if (e === undefined || w === undefined) {
            break;
        }
        const keyE = String(e);
        const keyW = String(w);
        const labelE = shortLabels?.[keyE] ?? `Indicateur ${keyE}`;
        const labelW = shortLabels?.[keyW] ?? `Indicateur ${keyW}`;
        pairs.push({
            e,
            w,
            if_e_gt: labelE,
            if_w_gt: labelW,
        });
    }
    return pairs;
};
