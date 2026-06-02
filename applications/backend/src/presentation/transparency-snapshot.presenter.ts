// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { ParticipantTransparencyScoreSnapshot } from '@src/interfaces/participants/IParticipantsRepository.port';

/**
 * Sérialise un snapshot de score de transparence (read-model partagé défini dans
 * `IParticipantsRepository.port`) en DTO snake_case pour l'API.
 *
 * Placé à la racine `presentation/` (terrain neutre, frontière transport ADR-008 §5)
 * car le même mapping est consommé des deux côtés : par l'admin
 * (`admin-campaigns.controller`) et par le participant authentifié
 * (`participant.controller`, qui le faisait jusqu'ici inline — cf. ADR-009 §4). Une seule
 * source de vérité plutôt qu'un presenter admin + une copie inline participant.
 */
export const transparencyScoreSnapshotToJson = (s: ParticipantTransparencyScoreSnapshot) => ({
    campaign_id: s.campaignId,
    participant_id: s.participantId,
    value: s.value,
    peer_count: s.peerCount,
    activated_at: s.activatedAt.toISOString(),
    activated_by_coach_id: s.activatedByCoachId,
});
