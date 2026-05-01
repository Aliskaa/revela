import type { ParticipantQuestionnaireMatrix, ParticipantQuestionnaireMatrixRow, ResultDim } from '@aor/types';

export type PairBlock = {
    eRow: ParticipantQuestionnaireMatrixRow;
    wRow: ParticipantQuestionnaireMatrixRow;
};

export type DimensionBlock = {
    name: string;
    pairs: PairBlock[];
    looseRows: ParticipantQuestionnaireMatrixRow[];
};

export const absDiff = (a: number | null, b: number | null): number | null => {
    if (a === null || b === null) return null;
    return Math.abs(a - b);
};

const buildPairsFromDim = (
    dim: ResultDim,
    rowByKey: Map<number, ParticipantQuestionnaireMatrixRow>
): { pairs: PairBlock[]; consumed: Set<number> } => {
    const consumed = new Set<number>();
    const pairs: PairBlock[] = [];
    if (dim.diff_pairs && dim.diff_pairs.length > 0) {
        for (const pair of dim.diff_pairs) {
            const eRow = rowByKey.get(pair.e);
            const wRow = rowByKey.get(pair.w);
            if (eRow && wRow) {
                pairs.push({ eRow, wRow });
                consumed.add(pair.e);
                consumed.add(pair.w);
            }
        }
        return { pairs, consumed };
    }
    // Fallback : aucune `diff_pairs` déclarée → on appaire les `scores` consécutifs
    // (convention métier : (e, w) en alternance dans `result_dims[].scores`).
    for (let i = 0; i + 1 < dim.scores.length; i += 2) {
        const eKey = dim.scores[i];
        const wKey = dim.scores[i + 1];
        if (eKey === undefined || wKey === undefined) continue;
        const eRow = rowByKey.get(eKey);
        const wRow = rowByKey.get(wKey);
        if (eRow && wRow) {
            pairs.push({ eRow, wRow });
            consumed.add(eKey);
            consumed.add(wKey);
        }
    }
    return { pairs, consumed };
};

export const buildDimensionBlocks = (matrix: ParticipantQuestionnaireMatrix): DimensionBlock[] => {
    const rowByKey = new Map<number, ParticipantQuestionnaireMatrixRow>();
    for (const row of matrix.rows) {
        rowByKey.set(row.score_key, row);
    }
    if (matrix.result_dims.length === 0) {
        return [{ name: '', pairs: [], looseRows: matrix.rows }];
    }
    const blocks: DimensionBlock[] = [];
    for (const dim of matrix.result_dims) {
        const { pairs, consumed } = buildPairsFromDim(dim, rowByKey);
        const looseRows: ParticipantQuestionnaireMatrixRow[] = [];
        for (const sk of dim.scores) {
            if (consumed.has(sk)) continue;
            const row = rowByKey.get(sk);
            if (row) looseRows.push(row);
        }
        blocks.push({ name: dim.name, pairs, looseRows });
    }
    return blocks;
};
