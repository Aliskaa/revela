// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { computeTransparencyScore } from '@aor/scoring';

import type { GetParticipantQuestionnaireMatrixUseCase } from '@src/application/participant-session/get-participant-questionnaire-matrix.usecase';
import { AdminResourceNotFoundError } from '@src/domain/admin/admin.errors';
import type { IAdminAuthConfigPort } from '@src/interfaces/admin/IAdminAuthConfig.port';
import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type { ICoachesReadPort } from '@src/interfaces/coaches/ICoachesRepository.port';
import type {
    IParticipantsTransparencyScorePort,
    ParticipantTransparencyScoreSnapshot,
} from '@src/interfaces/participants/IParticipantsRepository.port';

export class TransparencyScoreNotComputableError extends Error {
    public constructor() {
        super(
            'Score de transparence non calculable : il faut au moins un feedback pair et une réponse Élément Humain (test scientifique).'
        );
        this.name = 'TransparencyScoreNotComputableError';
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/**
 * Active manuellement le score de transparence (P23) pour un participant sur une campagne.
 * Le calcul s'appuie sur la matrice « peers received » + la réponse Élément Humain (F).
 *
 * - Filtrage scope=coach : si `coachId` est fourni, la campagne doit appartenir à ce coach.
 * - Persiste un snapshot figé (valeur + peerCount + auteur de l'activation) afin de garantir
 *   le timing pédagogique (la valeur n'évolue plus si de nouveaux feedbacks arrivent).
 * - L'auteur (`actorCoachId`) :
 *   - en scope coach → coach authentifié ;
 *   - en scope super-admin → résolu vers la ligne `coaches` sentinelle créée par
 *     `EnsureAdminCoachService` (P05). Si `actorCoachId` est `null`, on lookup la sentinelle.
 */
export class ActivateParticipantTransparencyScoreUseCase {
    public constructor(
        private readonly ports: {
            readonly campaigns: ICampaignsReadPort;
            readonly coaches: ICoachesReadPort;
            readonly authConfig: IAdminAuthConfigPort;
            readonly transparency: IParticipantsTransparencyScorePort;
            readonly getMatrix: GetParticipantQuestionnaireMatrixUseCase;
        }
    ) {}

    public async execute(params: {
        campaignId: number;
        participantId: number;
        /** `coachId` du coach connecté en scope=coach ; `undefined` en scope super-admin (pas de filtrage). */
        coachId?: number;
        /** `coachId` à enregistrer comme auteur ; `null` en scope super-admin → résolu sentinelle. */
        actorCoachId: number | null;
    }): Promise<ParticipantTransparencyScoreSnapshot> {
        const campaign = await this.ports.campaigns.findById(params.campaignId, { coachId: params.coachId });
        if (!campaign) {
            throw new AdminResourceNotFoundError('Campagne introuvable.');
        }
        const qid = (campaign.questionnaireId ?? '').trim().toUpperCase();
        if (qid.length === 0) {
            throw new AdminResourceNotFoundError('Questionnaire de la campagne introuvable.');
        }

        const matrix = await this.ports.getMatrix.execute({
            participantId: params.participantId,
            qid,
            campaignId: params.campaignId,
            coachId: params.coachId,
            peerColumnPerspective: 'received',
            anonymizeReceivedPeerLabels: false,
        });

        const peerCount = matrix.peer_columns.length;
        const computation = computeTransparencyScore({
            rows: matrix.rows.map(row => ({
                scientific: row.scientific,
                peers: row.peers,
            })),
            peerCount,
        });
        if (!computation) {
            throw new TransparencyScoreNotComputableError();
        }

        const resolvedActorCoachId = await this.resolveActorCoachId(params.actorCoachId);

        return this.ports.transparency.saveTransparencyScoreSnapshot({
            campaignId: params.campaignId,
            participantId: params.participantId,
            value: computation.score,
            peerCount: computation.peerCount,
            activatedByCoachId: resolvedActorCoachId,
        });
    }

    private async resolveActorCoachId(actorCoachId: number | null): Promise<number> {
        if (actorCoachId !== null) {
            return actorCoachId;
        }
        const adminCoach = await this.ports.coaches.findByUsername(this.ports.authConfig.superAdminUsername);
        if (!adminCoach) {
            throw new Error(
                "Compte coach Admin introuvable. EnsureAdminCoachService n'a pas pu initialiser la ligne sentinelle."
            );
        }
        return adminCoach.id;
    }
}
