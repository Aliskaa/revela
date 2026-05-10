/**
 * Sélection déterministe des dimensions à commenter — §4 du PDF.
 *
 * Règles appliquées (dans cet ordre) :
 * 1. Pour chaque dimension comportementale (inclusion / control / openness),
 *    calculer deux écarts :
 *      - `gap_expressed_wanted = |expressed − wanted|`
 *      - `gap_self_peer        = |expressed − peer_feedback|`
 * 2. La dimension est candidate si `max(gap_expressed_wanted, gap_self_peer) ≥ seuil`.
 *    Le seuil par défaut est 2 (cf. §4 PDF) — surchargeable via `min_gap`.
 * 3. La `reason` retenue est celle du gap le plus fort. En cas d'égalité,
 *    `ecart_exprime_desire` l'emporte (l'écart expressed/wanted est l'écart
 *    primaire dans le modèle FIRO-B).
 * 4. Les candidates sont triées par intensité d'écart décroissante. Les ex-aequo
 *    sont triés par l'ordre canonique des dimensions (inclusion < control < openness)
 *    pour garantir un résultat reproductible.
 * 5. On garde au maximum `max_behavioral_dimensions` (par défaut 2, cap dur 2).
 *    Aucune dimension n'est jamais retournée au-delà de ce plafond.
 *
 * `interpretation_instruction` est volontairement neutre et identique d'un
 * cas à l'autre — c'est le prompt système (§7) qui contraint le ton, pas
 * cette instruction. La présence d'une instruction permet au modèle de
 * savoir quoi faire avec les chiffres injectés.
 */
import {
    BEHAVIORAL_DIMENSIONS,
    type BehavioralDimension,
    DEFAULT_GAP_THRESHOLD,
    MAX_BEHAVIORAL_DIMENSIONS_HARD_CAP,
} from './constants';
import type { DimensionScores, HarnessInput, SelectedDimension, SelectionReason } from './schemas';

const DIMENSION_ORDER: ReadonlyMap<BehavioralDimension, number> = new Map(
    BEHAVIORAL_DIMENSIONS.map((dim, index) => [dim, index])
);

const INTERPRETATION_INSTRUCTION_BY_REASON: Readonly<Record<SelectionReason, string>> = {
    ecart_exprime_desire:
        'Formuler une hypothèse sur un possible écart entre besoin exprimé et besoin désiré, sans conclusion identitaire.',
    ecart_auto_feedback:
        'Formuler une hypothèse sur un possible décalage entre auto-perception et perception des pairs, sans conclusion identitaire.',
};

type Candidate = {
    readonly name: BehavioralDimension;
    readonly reason: SelectionReason;
    readonly gap: number;
    readonly scores: DimensionScores;
};

const evaluateDimension = (name: BehavioralDimension, scores: DimensionScores, threshold: number): Candidate | null => {
    const gapExpressedWanted = Math.abs(scores.expressed - scores.wanted);
    const gapSelfPeer = Math.abs(scores.expressed - scores.peer_feedback);
    const maxGap = Math.max(gapExpressedWanted, gapSelfPeer);

    if (maxGap < threshold) {
        return null;
    }

    // Égalité → priorité à l'écart expressed/wanted (écart primaire FIRO-B).
    const reason: SelectionReason = gapExpressedWanted >= gapSelfPeer ? 'ecart_exprime_desire' : 'ecart_auto_feedback';

    return { name, reason, gap: maxGap, scores };
};

const compareCandidates = (a: Candidate, b: Candidate): number => {
    if (a.gap !== b.gap) {
        return b.gap - a.gap;
    }
    // Tie-break stable et reproductible : ordre canonique des dimensions.
    return (DIMENSION_ORDER.get(a.name) ?? 0) - (DIMENSION_ORDER.get(b.name) ?? 0);
};

/**
 * Sélectionne au plus deux dimensions comportementales à commenter.
 * Retourne `[]` si aucune dimension ne dépasse le seuil — dans ce cas,
 * la restitution doit être prudente et centrée sur l'équilibre apparent
 * (cf. §4 PDF, ligne « Aucune dimension candidate »).
 */
export const selectDimensions = (input: HarnessInput): SelectedDimension[] => {
    const threshold = input.generation_rules.min_gap ?? DEFAULT_GAP_THRESHOLD;
    const cap = Math.min(
        input.generation_rules.max_behavioral_dimensions ?? MAX_BEHAVIORAL_DIMENSIONS_HARD_CAP,
        MAX_BEHAVIORAL_DIMENSIONS_HARD_CAP
    );

    const candidates: Candidate[] = [];
    for (const name of BEHAVIORAL_DIMENSIONS) {
        const scores = input.scores[name];
        const candidate = evaluateDimension(name, scores, threshold);
        if (candidate) {
            candidates.push(candidate);
        }
    }

    candidates.sort(compareCandidates);

    return candidates.slice(0, cap).map(c => ({
        name: c.name,
        reason: c.reason,
        expressed: c.scores.expressed,
        wanted: c.scores.wanted,
        peer_feedback: c.scores.peer_feedback,
        gap: c.gap,
        interpretation_instruction: INTERPRETATION_INSTRUCTION_BY_REASON[c.reason],
    }));
};
