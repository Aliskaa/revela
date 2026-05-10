/**
 * Construction de l'objet intermédiaire §6 — JSON effectivement
 * transmis au modèle pour la génération.
 *
 * À noter : c'est ici que le harness « décide » de ce qu'on partage avec
 * le LLM. On ne lui donne JAMAIS les scores des dimensions non sélectionnées
 * (pour éviter qu'il les commente — sanctionné par §9).
 */
import { DEFAULT_FORBIDDEN_PHRASES, DEFAULT_HYPOTHESIS_MARKERS, DEFAULT_MAX_WORDS, DEFAULT_TONE } from './constants';
import type { HarnessInput, IntermediateObject, SelectedDimension } from './schemas';
import { selectDimensions } from './select-dimensions';

const TRANSPARENCY_INSTRUCTION =
    'Commenter brièvement la transparence sans conclure sur la personnalité, en restant factuel et contextualisé.';

/**
 * Construit l'objet §6 à partir d'un input §5 validé.
 *
 * @param input  HarnessInput déjà validé via `parseHarnessInput`.
 * @param preselected Optionnel — sélection précalculée. Si absent,
 *   `selectDimensions(input)` est appelé. Permet de réutiliser une
 *   sélection déjà calculée pour la persistance/audit.
 */
export const buildIntermediateObject = (
    input: HarnessInput,
    preselected?: ReadonlyArray<SelectedDimension>
): IntermediateObject => {
    const selected = preselected ?? selectDimensions(input);
    const rules = input.generation_rules;

    return {
        selected_dimensions: [...selected],
        transparency: {
            score: input.scores.transparency.score,
            instruction: TRANSPARENCY_INSTRUCTION,
        },
        style_constraints: {
            tone: DEFAULT_TONE,
            max_words: rules.max_words ?? DEFAULT_MAX_WORDS,
            forbidden_phrases: [...DEFAULT_FORBIDDEN_PHRASES],
            required_hypothesis_markers: [...DEFAULT_HYPOTHESIS_MARKERS],
        },
    };
};
