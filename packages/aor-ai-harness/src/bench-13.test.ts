/**
 * Banc de test recommandé §13 du PDF.
 *
 * Sept profils types qui vérifient les comportements clés du harness
 * SANS appel LLM. La logique LLM (génération + régénération) est
 * testée séparément dans le Lot 3 ; ici on teste tout ce qui est
 * déterministe en amont et en aval du modèle.
 *
 * Mapping PDF §13 → tests :
 *   1. « Aucun écart significatif »   → harness sélectionne 0 dimension.
 *   2. « Fort écart inclusion »       → harness sélectionne inclusion.
 *   3. « Fort écart contrôle »        → harness sélectionne control.
 *   4. « Fort écart ouverture »       → harness sélectionne openness.
 *   5. « Feedback pairs divergent »   → reason = ecart_auto_feedback.
 *   6. « Trois dimensions candidates »→ priorisation : 2 dimensions max.
 *   7. « Sortie trop longue »         → validateur émet length_exceeded.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { buildIntermediateObject } from './build-intermediate';
import { parseHarnessInput } from './schemas';
import { selectDimensions } from './select-dimensions';
import { validateOutput } from './validate-output';

const buildInput = (params: {
    inclusion: { e: number; w: number; pf: number };
    control: { e: number; w: number; pf: number };
    openness: { e: number; w: number; pf: number };
    transparency?: number;
}) =>
    parseHarnessInput({
        module: 'firo_b_short_restitution',
        language: 'fr',
        scores: {
            inclusion: {
                expressed: params.inclusion.e,
                wanted: params.inclusion.w,
                peer_feedback: params.inclusion.pf,
            },
            control: {
                expressed: params.control.e,
                wanted: params.control.w,
                peer_feedback: params.control.pf,
            },
            openness: {
                expressed: params.openness.e,
                wanted: params.openness.w,
                peer_feedback: params.openness.pf,
            },
            transparency: { score: params.transparency ?? 50 },
        },
    });

test('§13 cas 1 — aucun écart significatif : 0 dimension, intermediate utilisable', () => {
    const input = buildInput({
        inclusion: { e: 5, w: 5, pf: 5 },
        control: { e: 4, w: 5, pf: 4 },
        openness: { e: 6, w: 6, pf: 6 },
    });
    const selected = selectDimensions(input);
    assert.equal(selected.length, 0);

    const intermediate = buildIntermediateObject(input, selected);
    assert.equal(intermediate.selected_dimensions.length, 0);
    assert.equal(intermediate.transparency.score, 50);
    // Les contraintes de style restent présentes même sans dimension à commenter
    // (le modèle doit produire une restitution prudente sur l'équilibre apparent).
    assert.ok(intermediate.style_constraints.forbidden_phrases.length > 0);
    assert.ok(intermediate.style_constraints.required_hypothesis_markers.length > 0);
});

test('§13 cas 2 — fort écart inclusion : 1 dimension sélectionnée, reason expressed/wanted', () => {
    const input = buildInput({
        inclusion: { e: 2, w: 8, pf: 3 }, // gap_ew=6, gap_sp=1
        control: { e: 5, w: 5, pf: 5 },
        openness: { e: 5, w: 5, pf: 5 },
    });
    const selected = selectDimensions(input);
    assert.equal(selected.length, 1);
    assert.equal(selected[0]?.name, 'inclusion');
    assert.equal(selected[0]?.gap, 6);
    assert.equal(selected[0]?.reason, 'ecart_exprime_desire');
});

test('§13 cas 3 — fort écart contrôle : ne déborde pas sur les autres dimensions', () => {
    const input = buildInput({
        inclusion: { e: 5, w: 5, pf: 5 },
        control: { e: 7, w: 2, pf: 6 }, // gap_ew=5
        openness: { e: 5, w: 5, pf: 5 },
    });
    const selected = selectDimensions(input);
    assert.equal(selected.length, 1);
    assert.equal(selected[0]?.name, 'control');

    const intermediate = buildIntermediateObject(input, selected);
    // Vérifie que le scope strict est respecté : l'intermediate ne contient
    // aucune trace des dimensions non sélectionnées (cf. §6 PDF).
    assert.equal(intermediate.selected_dimensions.length, 1);
    const names = intermediate.selected_dimensions.map(d => d.name);
    assert.ok(!names.includes('inclusion'));
    assert.ok(!names.includes('openness'));
});

test('§13 cas 4 — fort écart ouverture : reason expressed/wanted attendu', () => {
    const input = buildInput({
        inclusion: { e: 5, w: 5, pf: 5 },
        control: { e: 5, w: 5, pf: 5 },
        openness: { e: 1, w: 7, pf: 2 }, // gap_ew=6
    });
    const selected = selectDimensions(input);
    assert.equal(selected.length, 1);
    assert.equal(selected[0]?.name, 'openness');
    assert.equal(selected[0]?.reason, 'ecart_exprime_desire');
});

test('§13 cas 5 — feedback pairs divergent : reason = ecart_auto_feedback', () => {
    const input = buildInput({
        // expressed/wanted alignés (gap=1) mais expressed/peer_feedback divergent (gap=5)
        inclusion: { e: 7, w: 6, pf: 2 },
        control: { e: 5, w: 5, pf: 5 },
        openness: { e: 5, w: 5, pf: 5 },
    });
    const selected = selectDimensions(input);
    assert.equal(selected.length, 1);
    assert.equal(selected[0]?.name, 'inclusion');
    assert.equal(selected[0]?.reason, 'ecart_auto_feedback');
    assert.equal(selected[0]?.gap, 5);
});

test('§13 cas 6 — trois dimensions candidates : top 2 retenues, ordre par intensité', () => {
    const input = buildInput({
        inclusion: { e: 5, w: 8, pf: 5 }, // gap=3
        control: { e: 1, w: 7, pf: 2 }, // gap=6
        openness: { e: 4, w: 8, pf: 4 }, // gap=4
    });
    const selected = selectDimensions(input);
    assert.equal(selected.length, 2);
    assert.equal(selected[0]?.name, 'control'); // gap=6
    assert.equal(selected[1]?.name, 'openness'); // gap=4
    // Inclusion (gap=3) éliminée par le plafond max 2.
    assert.ok(!selected.some(d => d.name === 'inclusion'));
});

test('§13 cas 7 — sortie trop longue : validateur émet length_exceeded', () => {
    const input = buildInput({
        inclusion: { e: 2, w: 8, pf: 3 },
        control: { e: 5, w: 5, pf: 5 },
        openness: { e: 5, w: 5, pf: 5 },
    });
    const intermediate = buildIntermediateObject(input);

    // On simule une sortie modèle volontairement trop longue (1 200 mots),
    // mais structurellement correcte sur les autres axes.
    const lorem = Array.from({ length: 250 }, () => 'mot pourrait suggérer hypothèse').join(' ');
    const tooLong = `
Lecture synthétique
${lorem}

Point de cadre
Les scores reflètent un comportement dans un contexte donné.

Points clés de lecture
Sur l'inclusion, l'écart pourrait suggérer un besoin d'ajustement.

Lecture managériale
Cet écart peut inviter à explorer les rituels d'équipe.

Pistes de réflexion
Q1 ? Q2 ? Q3 ?
`;

    const result = validateOutput(tooLong, intermediate);
    assert.equal(result.ok, false);
    assert.ok(
        result.failures.some(f => f.code === 'length_exceeded'),
        `failures attendus length_exceeded — reçu ${JSON.stringify(result.failures.map(f => f.code))}`
    );
});
