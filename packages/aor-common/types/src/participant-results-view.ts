/**
 * Types de présentation des résultats participant.
 *
 * Ces view-models sont dérivés de {@link ParticipantQuestionnaireMatrix} côté frontend
 * (voir `buildDimensions` dans le route participant/results) puis consommés par
 * l'affichage de la page et par l'export PDF. Ils ne traversent pas la frontière
 * HTTP et n'ont donc pas de schéma Zod — seul un contrat TypeScript partagé est
 * nécessaire pour garder page et PDF en phase.
 */

export type PeerScore = {
    label: string;
    value: number | null;
};

export type ScoreRow = {
    label: string;
    self: number | null;
    peers: PeerScore[];
    scientific: number | null;
};

export type EcartView = {
    value: number;
    message: string;
};

export type DimensionView = {
    name: string;
    rows: ScoreRow[];
    ecarts: EcartView[];
};
