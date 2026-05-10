/**
 * Validateur de sortie §9 du PDF.
 *
 * Le validateur intervient APRÈS la génération et AVANT l'affichage à
 * l'utilisateur (ou au coach pour édition). Son rôle est de refuser une
 * restitution qui ne respecte pas les contraintes essentielles.
 *
 * Contrôles déterministes (pas d'appel LLM) :
 *  - Longueur : `max_words` (par défaut 650).
 *  - Structure : présence des 5 sections nommées.
 *  - Formulations interdites : recherche insensible casse + diacritiques.
 *  - Marqueurs hypothétiques : au moins 1 marqueur prudent doit apparaître.
 *  - Dimensions non autorisées : aucune dimension non sélectionnée ne doit
 *    être commentée. Le matching est conservateur (toute occurrence dans
 *    le texte est un échec) — c'est le contrat §9 « Rejeter si une dimension
 *    non fournie est analysée ».
 *  - Nombre de questions finales : entre `MIN_FINAL_QUESTIONS` et
 *    `MAX_FINAL_QUESTIONS` (3-5 d'après §7).
 *
 * Le validateur ne corrige rien : il rapporte des `failures`. La logique
 * de régénération §10 (régénération ciblée → modèle alternatif → message
 * neutre) est portée par l'orchestrateur, pas par le validateur.
 */
import {
    type BehavioralDimension,
    DIMENSION_LABELS,
    MAX_FINAL_QUESTIONS,
    MIN_FINAL_QUESTIONS,
    OUTPUT_SECTIONS,
    type OutputSection,
} from './constants';
import type { IntermediateObject } from './schemas';

export type ValidationFailureCode =
    | 'length_exceeded'
    | 'missing_section'
    | 'forbidden_phrase'
    | 'missing_hypothesis_markers'
    | 'unauthorized_dimension'
    | 'wrong_question_count';

export type ValidationFailure = {
    readonly code: ValidationFailureCode;
    readonly detail: string;
};

export type ValidationResult = {
    readonly ok: boolean;
    readonly failures: ReadonlyArray<ValidationFailure>;
    readonly wordCount: number;
};

/**
 * Normalise une chaîne pour le matching insensible aux diacritiques :
 *  - décomposition NFD (sépare lettre + diacritique combinant) ;
 *  - retrait des marques combinantes Unicode ;
 *  - passage en minuscules.
 *
 * Ex. « Vous Êtes » → « vous etes ».
 */
const normalize = (s: string): string =>
    s
        .normalize('NFD')
        .replace(/\p{Mn}/gu, '')
        .toLowerCase();

const countWords = (text: string): number => {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
        return 0;
    }
    return trimmed.split(/\s+/u).length;
};

/**
 * Étiquettes humaines des sections — utilisées pour le matching.
 * On accepte la variante avec ou sans accent (cf. `normalize`).
 */
const SECTION_LABELS: Readonly<Record<OutputSection, ReadonlyArray<string>>> = {
    lecture_synthetique: ['lecture synthétique'],
    point_de_cadre: ['point de cadre'],
    points_cles: ['points clés de lecture', 'points clés'],
    lecture_manageriale: ['lecture managériale'],
    pistes_de_reflexion: ['pistes de réflexion'],
};

const sectionLabelMatches = (normalizedText: string, labels: ReadonlyArray<string>): boolean => {
    for (const label of labels) {
        if (normalizedText.includes(normalize(label))) {
            return true;
        }
    }
    return false;
};

/**
 * Extrait la dernière section (`pistes_de_reflexion`) du texte pour y
 * compter les questions. On cherche le plus tardif des libellés acceptés
 * et on prend tout ce qui suit.
 */
const extractFinalSection = (text: string): string | null => {
    const normalizedText = normalize(text);
    const labels = SECTION_LABELS.pistes_de_reflexion.map(l => normalize(l));

    let bestStart = -1;
    let bestLabelLength = 0;
    for (const label of labels) {
        const idx = normalizedText.lastIndexOf(label);
        if (idx > bestStart) {
            bestStart = idx;
            bestLabelLength = label.length;
        }
    }

    if (bestStart === -1) {
        return null;
    }
    return text.slice(bestStart + bestLabelLength);
};

const countQuestions = (slice: string): number => {
    const matches = slice.match(/\?/g);
    return matches ? matches.length : 0;
};

/**
 * Recherche dans le texte la mention d'une dimension qui ne fait PAS
 * partie de la sélection autorisée. Toute occurrence est un échec.
 */
const findUnauthorizedDimensions = (text: string, allowed: ReadonlySet<BehavioralDimension>): BehavioralDimension[] => {
    const normalizedText = normalize(text);
    const violations: BehavioralDimension[] = [];

    for (const [dim, labels] of Object.entries(DIMENSION_LABELS) as [BehavioralDimension, ReadonlyArray<string>][]) {
        if (allowed.has(dim)) {
            continue;
        }
        const found = labels.some(label => {
            // Recherche en mot entier pour limiter les faux positifs
            // (ex. « contrôler » ne doit pas matcher « contrôle » ; on
            // utilise un regex \b qui marche bien sur ASCII normalisé).
            const escaped = normalize(label).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            return new RegExp(`\\b${escaped}\\b`, 'u').test(normalizedText);
        });
        if (found) {
            violations.push(dim);
        }
    }

    return violations;
};

/**
 * Valide une restitution générée contre l'objet intermédiaire qui a servi
 * à la générer.
 */
export const validateOutput = (text: string, intermediate: IntermediateObject): ValidationResult => {
    const failures: ValidationFailure[] = [];
    const normalizedText = normalize(text);

    const wordCount = countWords(text);
    if (wordCount > intermediate.style_constraints.max_words) {
        failures.push({
            code: 'length_exceeded',
            detail: `${wordCount} mots > plafond ${intermediate.style_constraints.max_words}.`,
        });
    }

    for (const section of OUTPUT_SECTIONS) {
        if (!sectionLabelMatches(normalizedText, SECTION_LABELS[section])) {
            failures.push({
                code: 'missing_section',
                detail: `Section absente : ${section}.`,
            });
        }
    }

    for (const phrase of intermediate.style_constraints.forbidden_phrases) {
        if (normalizedText.includes(normalize(phrase))) {
            failures.push({
                code: 'forbidden_phrase',
                detail: `Phrase interdite détectée : "${phrase}".`,
            });
        }
    }

    const hasMarker = intermediate.style_constraints.required_hypothesis_markers.some(marker =>
        normalizedText.includes(normalize(marker))
    );
    if (!hasMarker) {
        failures.push({
            code: 'missing_hypothesis_markers',
            detail: "Aucun marqueur d'hypothèse prudent détecté (ex. « pourrait suggérer »).",
        });
    }

    const allowed = new Set<BehavioralDimension>(intermediate.selected_dimensions.map(d => d.name));
    const violations = findUnauthorizedDimensions(text, allowed);
    for (const violation of violations) {
        failures.push({
            code: 'unauthorized_dimension',
            detail: `Dimension non autorisée commentée : ${violation}.`,
        });
    }

    const finalSection = extractFinalSection(text);
    if (finalSection === null) {
        // Déjà rapporté par `missing_section` plus haut — on n'ajoute pas
        // de doublon `wrong_question_count` dans ce cas.
    } else {
        const questionCount = countQuestions(finalSection);
        if (questionCount < MIN_FINAL_QUESTIONS || questionCount > MAX_FINAL_QUESTIONS) {
            failures.push({
                code: 'wrong_question_count',
                detail: `${questionCount} questions finales (attendu : ${MIN_FINAL_QUESTIONS}-${MAX_FINAL_QUESTIONS}).`,
            });
        }
    }

    return {
        ok: failures.length === 0,
        failures,
        wordCount,
    };
};
