import type { ParticipantQuestionnaireMatrix } from '@aor/types';
import { useMemo } from 'react';

export type ScoreItem = { scoreKey: number; label: string };
export type DimensionBlock = { dimension: string; items: ScoreItem[] };

export const buildDimensionsFromMatrix = (matrix: ParticipantQuestionnaireMatrix): DimensionBlock[] => {
    const dims: DimensionBlock[] = [];
    for (const rd of matrix.result_dims) {
        const items: ScoreItem[] = [];
        for (const scoreKey of rd.scores) {
            const row = matrix.rows.find(r => r.score_key === scoreKey);
            if (row) items.push({ scoreKey, label: row.label });
        }
        dims.push({ dimension: rd.name, items });
    }
    return dims;
};

export const useBuildDimensions = (matrix: ParticipantQuestionnaireMatrix | undefined): DimensionBlock[] =>
    useMemo(() => (matrix ? buildDimensionsFromMatrix(matrix) : []), [matrix]);
