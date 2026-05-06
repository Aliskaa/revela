import { z } from 'zod';

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
