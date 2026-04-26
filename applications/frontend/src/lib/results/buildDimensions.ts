// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { DimensionView, EcartView, ParticipantQuestionnaireMatrix, ScoreRow } from '@aor/types';

/**
 * View-model des résultats participant. Sortie de la route `participant/results.tsx`
 * pour pouvoir tester la logique métier indépendamment du JSX et la réutiliser
 * (export PDF, futur dashboard coach, etc.).
 */

export const avg = (values: (number | null)[]): number | null => {
    const nums = values.filter((v): v is number => v !== null);
    if (nums.length === 0) {
        return null;
    }
    return Math.round((nums.reduce((s, v) => s + v, 0) / nums.length) * 10) / 10;
};

const bestScore = (row: { scientific: number | null; self: number | null; peers: (number | null)[] }): number | null =>
    row.scientific ?? row.self ?? avg(row.peers);

export const buildDimensions = (matrix: ParticipantQuestionnaireMatrix): DimensionView[] => {
    const dims: DimensionView[] = [];
    const rowMap = new Map(matrix.rows.map(r => [r.score_key, r]));
    const peerLabels = matrix.peer_columns.map(pc => pc.label);

    for (const rd of matrix.result_dims) {
        const rows: ScoreRow[] = [];
        for (const scoreKey of rd.scores) {
            const row = matrix.rows.find(r => r.score_key === scoreKey);
            if (row) {
                rows.push({
                    label: row.label,
                    self: row.self,
                    peers: row.peers.map((v, i) => ({ label: peerLabels[i] ?? `Pair ${String(i + 1)}`, value: v })),
                    scientific: row.scientific,
                });
            }
        }

        const ecarts: EcartView[] = [];
        if (rd.diff_pairs) {
            for (const dp of rd.diff_pairs) {
                const eRow = rowMap.get(dp.e);
                const wRow = rowMap.get(dp.w);
                const eVal = eRow ? bestScore(eRow) : null;
                const wVal = wRow ? bestScore(wRow) : null;
                if (eVal !== null && wVal !== null) {
                    const diff = eVal - wVal;
                    const message = diff > 0 ? dp.if_e_gt : diff < 0 ? dp.if_w_gt : '';
                    ecarts.push({ value: Math.abs(diff), message });
                }
            }
        }

        dims.push({ name: rd.name, rows, ecarts });
    }
    return dims;
};

export const PEER_COLORS = [
    'rgb(255,204,0)',
    'rgb(255,170,0)',
    'rgb(230,150,0)',
    'rgb(200,130,0)',
    'rgb(180,115,0)',
];
