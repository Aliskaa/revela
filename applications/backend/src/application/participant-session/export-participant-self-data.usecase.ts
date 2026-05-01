// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type {
    ParticipantExportCampaign,
    ParticipantExportResponse,
    ParticipantExportResponseRole,
    ParticipantSelfDataExport,
} from '@aor/types';
import { ParticipantAccountNotFoundError } from '@src/domain/participant-session/participant-session.errors';
import type { Response } from '@src/domain/responses';
import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type { ICompaniesReadPort } from '@src/interfaces/companies/ICompaniesRepository.port';
import type {
    IParticipantsCampaignStateReaderPort,
    IParticipantsIdentityReaderPort,
    IParticipantsInviteAssignmentsReaderPort,
} from '@src/interfaces/participants/IParticipantsRepository.port';
import type { IResponsesSubmissionReaderPort } from '@src/interfaces/responses/IResponsesRepository.port';

const isoOrNull = (date: Date | null | undefined): string | null => {
    if (date == null) return null;
    return date instanceof Date ? date.toISOString() : new Date(date).toISOString();
};

/**
 * Détermine le rôle du participant dans une réponse donnée — utile pour que le participant
 * comprenne à quel titre la donnée est conservée. Priorité : `subject` > `rated` > `rater`
 * > `submitter` (auteur via invite token, legacy). Cas multi-rôles peu probables (la plupart
 * des réponses ont un rôle dominant), mais on choisit le plus signifiant côté RGPD.
 */
const determineRole = (response: Response, participantId: number): ParticipantExportResponseRole => {
    const snap = response.persistenceSnapshot();
    if (snap.subjectParticipantId === participantId) return 'subject';
    if (snap.ratedParticipantId === participantId) return 'rated';
    if (snap.raterParticipantId === participantId) return 'rater';
    return 'submitter';
};

/**
 * Construit l'export RGPD « mes données » d'un participant authentifié (Articles 15 et 20
 * du RGPD). Agrège profil, métadonnées RH, assignations campagnes et l'ensemble des
 * réponses dans lesquelles il est impliqué (sujet, évaluateur, évalué ou auteur).
 *
 * La sortie est un objet sérialisable en JSON, consommé tel quel pour le téléchargement
 * JSON et pour la génération PDF côté frontend (cf. `lib/exportParticipantData.ts`).
 */
export class ExportParticipantSelfDataUseCase {
    public constructor(
        private readonly ports: {
            readonly participants: IParticipantsIdentityReaderPort &
                IParticipantsInviteAssignmentsReaderPort &
                IParticipantsCampaignStateReaderPort;
            readonly companies: ICompaniesReadPort;
            readonly campaigns: ICampaignsReadPort;
            readonly responses: IResponsesSubmissionReaderPort;
        }
    ) {}

    public async execute(participantId: number): Promise<ParticipantSelfDataExport> {
        const participant = await this.ports.participants.findById(participantId);
        if (!participant) {
            throw new ParticipantAccountNotFoundError();
        }

        const company =
            participant.companyId === null ? null : await this.ports.companies.findById(participant.companyId);

        const assignments = await this.ports.participants.listInviteAssignmentsForParticipant(participantId);
        const campaigns: ParticipantExportCampaign[] = await Promise.all(
            assignments.map(async assignment => {
                let campaignName: string | null = null;
                let invitedAt: string | null = null;
                let joinedAt: string | null = null;
                if (assignment.campaignId !== null && assignment.campaignId !== undefined) {
                    const campaign = await this.ports.campaigns.findById(assignment.campaignId);
                    campaignName = campaign?.name ?? null;
                    const state = await this.ports.participants.getCampaignParticipantInviteState(
                        assignment.campaignId,
                        participantId
                    );
                    invitedAt = isoOrNull(state?.invitedAt ?? null);
                    joinedAt = isoOrNull(state?.joinedAt ?? null);
                }
                return {
                    campaign_id: assignment.campaignId,
                    campaign_name: campaignName,
                    questionnaire_id: assignment.questionnaireId,
                    invited_at: invitedAt,
                    joined_at: joinedAt,
                };
            })
        );

        const allResponses = await this.ports.responses.listAllInvolvingParticipant(participantId);
        const responses: ParticipantExportResponse[] = allResponses.map(response => {
            const snap = response.persistenceSnapshot();
            return {
                response_id: snap.id,
                questionnaire_id: snap.questionnaireId,
                submission_kind: snap.submissionKind,
                role: determineRole(response, participantId),
                campaign_id: snap.campaignId,
                submitted_at: isoOrNull(snap.submittedAt),
                name_at_submission: snap.name,
                email_at_submission: snap.email,
                organisation_at_submission: snap.organisation,
            };
        });

        return {
            generated_at: new Date().toISOString(),
            format_version: '1.0',
            profile: {
                participant_id: participant.id,
                first_name: participant.firstName,
                last_name: participant.lastName,
                email: participant.email,
                organisation: participant.organisation,
                direction: participant.direction,
                service: participant.service,
                function_level: participant.functionLevel,
                company: company === null ? null : { id: company.id, name: company.name },
            },
            campaigns,
            responses,
        };
    }
}
