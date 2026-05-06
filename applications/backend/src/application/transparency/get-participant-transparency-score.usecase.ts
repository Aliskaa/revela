// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type {
    IParticipantsTransparencyScorePort,
    ParticipantTransparencyScoreSnapshot,
} from '@src/interfaces/participants/IParticipantsRepository.port';

/**
 * Lit le snapshot du score de transparence (P23) pour un participant sur une campagne.
 * Renvoie `null` tant que le coach/admin n'a pas activé le score (le bouton « Lancer le calcul »
 * n'a pas encore été cliqué).
 *
 * Cette use case est partagée :
 * - côté participant : `GET /participant/campaigns/:id/transparency` (lecture de son propre snapshot)
 * - côté admin/coach : `GET /admin/campaigns/:id/participants/:pid/transparency`
 * Le contrôle d'accès se fait dans les contrôleurs (vérifie l'appartenance campagne ↔ participant).
 */
export class GetParticipantTransparencyScoreUseCase {
    public constructor(
        private readonly ports: {
            readonly transparency: IParticipantsTransparencyScorePort;
        }
    ) {}

    public execute(params: {
        campaignId: number;
        participantId: number;
    }): Promise<ParticipantTransparencyScoreSnapshot | null> {
        return this.ports.transparency.findTransparencyScoreSnapshot(params.campaignId, params.participantId);
    }
}
