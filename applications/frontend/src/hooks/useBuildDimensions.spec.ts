import type { ParticipantQuestionnaireMatrix } from '@aor/types';
import { describe, expect, test } from 'vitest';

import { buildDimensionsFromMatrix } from './useBuildDimensions';

const baseMatrix = (overrides: Partial<ParticipantQuestionnaireMatrix> = {}): ParticipantQuestionnaireMatrix => ({
    subject_id: 1,
    questionnaire_id: 'B',
    questionnaire_title: 'Behavior',
    likert_max: 5,
    scientific_value_max: 9,
    peer_columns: [],
    self_response_id: null,
    scientific_response_id: null,
    rows: [],
    result_dims: [],
    short_labels: {},
    ...overrides,
});

describe('buildDimensionsFromMatrix', () => {
    test('retourne [] pour une matrice sans dimensions', () => {
        expect(buildDimensionsFromMatrix(baseMatrix())).toEqual([]);
    });

    test("groupe les rows par dimension dans l'ordre déclaré", () => {
        const matrix = baseMatrix({
            rows: [
                { score_key: 1, label: 'Inclusion E', self: 4, peers: [], scientific: null },
                { score_key: 2, label: 'Inclusion W', self: 3, peers: [], scientific: null },
                { score_key: 3, label: 'Contrôle E', self: 5, peers: [], scientific: null },
            ],
            result_dims: [
                { name: 'Inclusion', scores: [1, 2] },
                { name: 'Contrôle', scores: [3] },
            ],
        });

        const result = buildDimensionsFromMatrix(matrix);

        expect(result).toEqual([
            {
                dimension: 'Inclusion',
                items: [
                    { scoreKey: 1, label: 'Inclusion E' },
                    { scoreKey: 2, label: 'Inclusion W' },
                ],
            },
            {
                dimension: 'Contrôle',
                items: [{ scoreKey: 3, label: 'Contrôle E' }],
            },
        ]);
    });

    test('ignore les scoreKeys non trouvés dans rows', () => {
        const matrix = baseMatrix({
            rows: [{ score_key: 1, label: 'Existant', self: null, peers: [], scientific: null }],
            result_dims: [{ name: 'Dim', scores: [1, 99] }],
        });

        const [dim] = buildDimensionsFromMatrix(matrix);
        expect(dim.items).toHaveLength(1);
        expect(dim.items[0]).toEqual({ scoreKey: 1, label: 'Existant' });
    });
});
