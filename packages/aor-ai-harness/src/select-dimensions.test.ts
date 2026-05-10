import assert from 'node:assert/strict';
import test from 'node:test';

import { parseHarnessInput } from './schemas';
import { selectDimensions } from './select-dimensions';

const baseInput = (overrides: {
    inclusion?: { expressed: number; wanted: number; peer_feedback: number };
    control?: { expressed: number; wanted: number; peer_feedback: number };
    openness?: { expressed: number; wanted: number; peer_feedback: number };
    transparency?: number;
    min_gap?: number;
    max_dims?: number;
}) =>
    parseHarnessInput({
        module: 'firo_b_short_restitution',
        language: 'fr',
        scores: {
            inclusion: overrides.inclusion ?? { expressed: 5, wanted: 5, peer_feedback: 5 },
            control: overrides.control ?? { expressed: 5, wanted: 5, peer_feedback: 5 },
            openness: overrides.openness ?? { expressed: 5, wanted: 5, peer_feedback: 5 },
            transparency: { score: overrides.transparency ?? 50 },
        },
        generation_rules: {
            min_gap: overrides.min_gap ?? 2,
            max_behavioral_dimensions: overrides.max_dims ?? 2,
        },
    });

test('aucun écart ≥ seuil → 0 dimension sélectionnée', () => {
    const input = baseInput({});
    const result = selectDimensions(input);
    assert.equal(result.length, 0);
});

test('écart sous le seuil (gap=1) → ignoré', () => {
    const input = baseInput({ inclusion: { expressed: 5, wanted: 6, peer_feedback: 5 } });
    const result = selectDimensions(input);
    assert.equal(result.length, 0);
});

test('écart à exactement le seuil (gap=2) → admis', () => {
    const input = baseInput({ inclusion: { expressed: 5, wanted: 7, peer_feedback: 5 } });
    const result = selectDimensions(input);
    assert.equal(result.length, 1);
    assert.equal(result[0]?.name, 'inclusion');
    assert.equal(result[0]?.gap, 2);
    assert.equal(result[0]?.reason, 'ecart_exprime_desire');
});

test("priorité expressed/wanted en cas d'égalité avec auto/feedback", () => {
    // gap_expressed_wanted = 3, gap_self_peer = 3 → ex aequo
    const input = baseInput({ inclusion: { expressed: 5, wanted: 8, peer_feedback: 2 } });
    const result = selectDimensions(input);
    assert.equal(result[0]?.reason, 'ecart_exprime_desire');
});

test('reason = ecart_auto_feedback quand gap auto/feedback domine', () => {
    // gap_expressed_wanted = 1, gap_self_peer = 4 → auto/feedback
    const input = baseInput({ inclusion: { expressed: 5, wanted: 6, peer_feedback: 1 } });
    const result = selectDimensions(input);
    assert.equal(result[0]?.gap, 4);
    assert.equal(result[0]?.reason, 'ecart_auto_feedback');
});

test('plafond max 2 même si 3 candidates', () => {
    const input = baseInput({
        inclusion: { expressed: 5, wanted: 8, peer_feedback: 5 }, // gap 3
        control: { expressed: 5, wanted: 9, peer_feedback: 5 }, // gap 4
        openness: { expressed: 5, wanted: 7, peer_feedback: 5 }, // gap 2
    });
    const result = selectDimensions(input);
    assert.equal(result.length, 2);
    assert.equal(result[0]?.name, 'control'); // plus fort
    assert.equal(result[1]?.name, 'inclusion');
});

test('tri stable : ex aequo → ordre canonique inclusion < control < openness', () => {
    const input = baseInput({
        inclusion: { expressed: 5, wanted: 8, peer_feedback: 5 }, // gap 3
        control: { expressed: 5, wanted: 8, peer_feedback: 5 }, // gap 3
        openness: { expressed: 5, wanted: 8, peer_feedback: 5 }, // gap 3
    });
    const result = selectDimensions(input);
    assert.equal(result[0]?.name, 'inclusion');
    assert.equal(result[1]?.name, 'control');
});
