import assert from 'node:assert/strict';
import test from 'node:test';

import type { IntermediateObject } from './schemas';
import { validateOutput } from './validate-output';

const intermediate = (
    overrides: Partial<IntermediateObject['style_constraints']> = {},
    selectedNames: ReadonlyArray<'inclusion' | 'control' | 'openness'> = ['inclusion']
): IntermediateObject => ({
    selected_dimensions: selectedNames.map(name => ({
        name,
        reason: 'ecart_exprime_desire',
        expressed: 4,
        wanted: 7,
        peer_feedback: 5,
        gap: 3,
        interpretation_instruction: 'Formuler une hypothèse...',
    })),
    transparency: { score: 50, instruction: 'Commenter brièvement la transparence.' },
    style_constraints: {
        tone: 'professionnel, neutre, sobre',
        max_words: 650,
        forbidden_phrases: ['tu es', 'vous êtes', 'ta personnalité', 'votre personnalité', 'diagnostic'],
        required_hypothesis_markers: ['pourrait suggérer', 'peut inviter à explorer', 'peut indiquer dans ce contexte'],
        ...overrides,
    },
});

const validRestitution = `
Lecture synthétique
Sur la dimension Inclusion, l'écart pourrait suggérer une exploration utile.

Point de cadre
Les scores reflètent un comportement dans un contexte donné, pas une identité.

Points clés de lecture
L'écart inclusion peut indiquer dans ce contexte un ajustement managérial.

Lecture managériale
Cet écart peut inviter à explorer les rituels d'équipe.

Pistes de réflexion
Quelle situation a déclenché ce besoin ? Comment ajuster la fréquence des points individuels ? Que ressent l'équipe sur ce point ?
`;

test('restitution conforme → ok', () => {
    const result = validateOutput(validRestitution, intermediate());
    assert.equal(result.ok, true, JSON.stringify(result.failures));
});

test('formulation interdite « tu es » détectée (insensible casse + accent)', () => {
    const text = validRestitution.replace('Sur la dimension', 'Tu Es sur la dimension');
    const result = validateOutput(text, intermediate());
    assert.equal(result.ok, false);
    assert.ok(result.failures.some(f => f.code === 'forbidden_phrase'));
});

test('formulation interdite « Vous Êtes » détectée (majuscules + accent)', () => {
    const text = validRestitution.replace('Sur la dimension', 'Vous Êtes ouvert sur la dimension');
    const result = validateOutput(text, intermediate());
    assert.ok(result.failures.some(f => f.code === 'forbidden_phrase'));
});

test("absence de marqueur d'hypothèse → fail", () => {
    const text = validRestitution
        .replace('pourrait suggérer', 'indique clairement')
        .replace('peut indiquer dans ce contexte', 'montre que')
        .replace('peut inviter à explorer', 'oblige à modifier');
    const result = validateOutput(text, intermediate());
    assert.ok(result.failures.some(f => f.code === 'missing_hypothesis_markers'));
});

test('section manquante → fail', () => {
    const text = validRestitution.replace('Point de cadre', 'Autre titre');
    const result = validateOutput(text, intermediate());
    assert.ok(result.failures.some(f => f.code === 'missing_section'));
});

test('dimension non autorisée commentée → fail', () => {
    // sélection = inclusion seulement, mais le texte parle de « contrôle »
    const text = validRestitution.replace("L'écart inclusion peut indiquer", "L'écart contrôle peut indiquer");
    const result = validateOutput(text, intermediate({}, ['inclusion']));
    assert.ok(
        result.failures.some(f => f.code === 'unauthorized_dimension'),
        `failures = ${JSON.stringify(result.failures)}`
    );
});

test('trop de questions finales → fail', () => {
    const text = validRestitution.replace(
        "Pistes de réflexion\nQuelle situation a déclenché ce besoin ? Comment ajuster la fréquence des points individuels ? Que ressent l'équipe sur ce point ?",
        'Pistes de réflexion\nQ1 ? Q2 ? Q3 ? Q4 ? Q5 ? Q6 ?'
    );
    const result = validateOutput(text, intermediate());
    assert.ok(result.failures.some(f => f.code === 'wrong_question_count'));
});

test('trop peu de questions finales → fail', () => {
    const text = validRestitution.replace(/Pistes de réflexion[\s\S]*$/u, 'Pistes de réflexion\nQ1 ? Q2 ?');
    const result = validateOutput(text, intermediate());
    assert.ok(result.failures.some(f => f.code === 'wrong_question_count'));
});

test('texte trop long → length_exceeded', () => {
    const long = validRestitution + ' mot'.repeat(700);
    const result = validateOutput(long, intermediate({ max_words: 50 }));
    assert.ok(result.failures.some(f => f.code === 'length_exceeded'));
});
