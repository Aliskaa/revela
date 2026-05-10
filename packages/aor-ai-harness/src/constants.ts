/**
 * Constantes du harness IA Révéla — extraites du document
 * « Harness appliqué au module FIRO B / Élément Humain » (Marius AI, 2026-05-08).
 *
 * Source de vérité côté backend : aucune valeur ne doit être dupliquée
 * dans les use cases ou les controllers. Le frontend ne consomme JAMAIS
 * ces constantes (le harness est centralisé côté serveur — §11 PDF).
 */

/**
 * Les trois dimensions comportementales FIRO-B traitées par le harness.
 * L'ordre est canonique pour les itérations stables (sélection, sérialisation).
 */
export const BEHAVIORAL_DIMENSIONS = ['inclusion', 'control', 'openness'] as const;

export type BehavioralDimension = (typeof BEHAVIORAL_DIMENSIONS)[number];

/**
 * Seuil §4 : une dimension est candidate si |expressed − wanted| ≥ 2
 * OU si |expressed − peer_feedback| ≥ 2.
 *
 * Configurable via `generation_rules.min_gap` côté input, mais ce défaut
 * sert de garde-fou si la valeur n'est pas fournie ou hors plage.
 */
export const DEFAULT_GAP_THRESHOLD = 2;

/**
 * Plafond §4 : si plus de 2 dimensions sont candidates, on garde les
 * deux plus fortes (intensité d'écart décroissante). Le harness refuse
 * toujours de commenter plus que ce plafond, même si l'input demande +.
 */
export const MAX_BEHAVIORAL_DIMENSIONS_HARD_CAP = 2;

/**
 * Plafond §7 : la restitution générée ne doit pas dépasser 650 mots.
 * Surchargeable par `generation_rules.max_words` mais ce défaut s'applique
 * si l'input ne fournit pas de valeur.
 */
export const DEFAULT_MAX_WORDS = 650;

/**
 * Formulations interdites §6 / §7 / §9 : recherchées en sortie de
 * génération par le validateur. La recherche est insensible à la casse
 * et aux diacritiques.
 */
export const DEFAULT_FORBIDDEN_PHRASES: ReadonlyArray<string> = [
    'tu es',
    'vous êtes',
    'ta personnalité',
    'votre personnalité',
    'diagnostic',
];

/**
 * Marqueurs d'hypothèse §6 / §7 : la sortie doit contenir au moins UN
 * de ces marqueurs (preuve que le modèle s'est tenu au registre prudent).
 */
export const DEFAULT_HYPOTHESIS_MARKERS: ReadonlyArray<string> = [
    'pourrait suggérer',
    'peut inviter à explorer',
    'peut indiquer dans ce contexte',
];

/**
 * Ton de référence §6, injecté dans `style_constraints.tone`.
 */
export const DEFAULT_TONE = 'professionnel, neutre, sobre';

/**
 * Sections obligatoires §7 — ordre canonique de la restitution.
 * Le validateur §9 vérifie leur présence.
 */
export const OUTPUT_SECTIONS = [
    'lecture_synthetique',
    'point_de_cadre',
    'points_cles',
    'lecture_manageriale',
    'pistes_de_reflexion',
] as const;

export type OutputSection = (typeof OUTPUT_SECTIONS)[number];

/**
 * Bornes §7 : la dernière section « Pistes de réflexion » doit contenir
 * entre 3 et 5 questions ouvertes (comptage par '?').
 */
export const MIN_FINAL_QUESTIONS = 3;
export const MAX_FINAL_QUESTIONS = 5;

/**
 * Bornes des scores FIRO-B (livret participant). Aligné sur l'échelle
 * `@aor/types` (0-9 par dimension exprimée/désirée/feedback).
 */
export const FIRO_SCORE_MIN = 0;
export const FIRO_SCORE_MAX = 9;

/**
 * Bornes du score de transparence Révéla (calculé par
 * `computeTransparencyScore` dans `@aor/scoring`).
 */
export const TRANSPARENCY_SCORE_MIN = 0;
export const TRANSPARENCY_SCORE_MAX = 100;

/**
 * Étiquettes humaines des dimensions FIRO-B en français — utilisées
 * pour le prompt utilisateur (§8) et par le validateur §9 quand il
 * vérifie que les dimensions citées dans le texte font bien partie
 * des dimensions sélectionnées.
 *
 * Inclut les variantes acceptées (avec/sans accent) pour le matching
 * insensible aux diacritiques.
 */
export const DIMENSION_LABELS: Readonly<Record<BehavioralDimension, ReadonlyArray<string>>> = {
    inclusion: ['inclusion'],
    control: ['contrôle', 'controle', 'control'],
    // « Affection / Ouverture » dans le catalog Révéla, « openness » dans le PDF.
    // On accepte les deux registres dans la sortie — c'est un alias, pas une
    // dimension nouvelle.
    openness: ['ouverture', 'openness', 'affection'],
};
