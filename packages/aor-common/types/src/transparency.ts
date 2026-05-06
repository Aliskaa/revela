import { z } from 'zod';

/**
 * Table de conversion F → P du livret participant (Étape III « Transparence », P23).
 * P[F] = max(F, 9 − F) = écart maximum théorique entre F et un score pair sur l'échelle 0..9.
 * P sert de poids pédagogique au dénominateur du score de transparence.
 *
 * Partagée entre backend (`@aor/scoring`) et frontend (page détail transparence) pour éviter
 * toute divergence entre le calcul et l'affichage.
 */
export const TRANSPARENCY_F_TO_P_TABLE = [
    [0, 9],
    [1, 8],
    [2, 7],
    [3, 6],
    [4, 5],
    [5, 5],
    [6, 6],
    [7, 7],
    [8, 8],
    [9, 9],
] as const satisfies ReadonlyArray<readonly [number, number]>;

/** Lookup direct : `TRANSPARENCY_F_TO_P[F]` renvoie P. */
export const TRANSPARENCY_F_TO_P = [9, 8, 7, 6, 5, 5, 6, 7, 8, 9] as const;

/** Helper équivalent à un lookup dans la table — utile pour les calculs ad hoc. */
export const transparencyConvertFToP = (f: number): number => Math.max(f, 9 - f);

/**
 * Snapshot du score de transparence (P23) pour un couple campagne/participant.
 * Le score est figé au moment où le coach/admin a cliqué « Lancer le calcul ».
 */
export const participantTransparencyScoreSnapshotSchema = z.object({
    campaign_id: z.number().int(),
    participant_id: z.number().int(),
    value: z.number().int().min(0).max(100),
    peer_count: z.number().int().min(0),
    activated_at: z.string(),
    activated_by_coach_id: z.number().int().nullable(),
});
export type ParticipantTransparencyScoreSnapshot = z.infer<typeof participantTransparencyScoreSnapshotSchema>;

export const participantTransparencyScoreEnvelopeSchema = z.object({
    snapshot: participantTransparencyScoreSnapshotSchema.nullable(),
});
export type ParticipantTransparencyScoreEnvelope = z.infer<typeof participantTransparencyScoreEnvelopeSchema>;
