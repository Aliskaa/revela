/*
 * Copyright (c) 2026 AOR Conseil. All rights reserved.
 * Proprietary and confidential.
 * Licensed under the AOR Commercial License.
 *
 * Use, reproduction, modification, distribution, or disclosure of this
 * source code, in whole or in part, is prohibited except under a valid
 * written commercial agreement with AOR Conseil.
 *
 * See LICENSE.md for the full license terms.
 */

import { ParticipantAccountNotFoundError } from '@src/domain/participant/participant-session.errors';
import type { CampaignStatus, ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type { IParticipantsIdentityReaderPort, IParticipantsInviteAssignmentsReaderPort, IParticipantsCampaignStateReaderPort } from '@src/interfaces/participants/IParticipantsRepository.port';

const normalizeStepStatus = (status: 'locked' | 'pending' | 'completed'): 'locked' | 'pending' | 'completed' => {
    if (status === 'completed' || status === 'locked') {
        return status;
    }
    return 'pending';
};

export type ParticipantSessionDto = {
    participant_id: number;
    email: string;
    first_name: string;
    last_name: string;
    assignments: Array<{
        campaign_id: number | null;
        questionnaire_id: string;
        campaign_status: CampaignStatus | null;
        invitation_confirmed: boolean;
        progression: {
            self_rating_status: 'locked' | 'pending' | 'completed';
            peer_feedback_status: 'locked' | 'pending' | 'completed';
            element_humain_status: 'locked' | 'pending' | 'completed';
            results_status: 'locked' | 'pending' | 'completed';
        } | null;
    }>;
};

export class GetParticipantSessionUseCase {
    public constructor(
        private readonly ports: {
            readonly participants: IParticipantsIdentityReaderPort & IParticipantsInviteAssignmentsReaderPort & IParticipantsCampaignStateReaderPort;
            readonly campaigns: ICampaignsReadPort;
        }
    ) {}

    public async execute(participantId: number): Promise<ParticipantSessionDto> {
        const participant = await this.ports.participants.findById(participantId);
        if (!participant) {
            throw new ParticipantAccountNotFoundError();
        }

        const assignments = await this.ports.participants.listInviteAssignmentsForParticipant(participantId);
        const assignmentsWithProgress = await Promise.all(
            assignments.map(async assignment => {
                const progress =
                    assignment.campaignId === null || assignment.campaignId === undefined
                        ? null
                        : await this.ports.participants.findProgressForCampaignParticipant(
                              assignment.campaignId,
                              participantId
                          );
                let campaignStatus: CampaignStatus | null = null;
                let invitationConfirmed = true;
                if (assignment.campaignId !== null && assignment.campaignId !== undefined) {
                    const campaign = await this.ports.campaigns.findById(assignment.campaignId);
                    campaignStatus = campaign?.status ?? null;
                    const state = await this.ports.participants.getCampaignParticipantInviteState(
                        assignment.campaignId,
                        participantId
                    );
                    invitationConfirmed = state?.joinedAt != null;
                }
                return {
                    campaign_id: assignment.campaignId,
                    questionnaire_id: assignment.questionnaireId,
                    campaign_status: campaignStatus,
                    invitation_confirmed: invitationConfirmed,
                    progression: progress
                        ? {
                              self_rating_status: normalizeStepStatus(progress.selfRatingStatus),
                              peer_feedback_status: normalizeStepStatus(progress.peerFeedbackStatus),
                              element_humain_status: normalizeStepStatus(progress.elementHumainStatus),
                              results_status: normalizeStepStatus(progress.resultsStatus),
                          }
                        : null,
                };
            })
        );

        const visibleAssignments = assignmentsWithProgress.filter(row => row.campaign_status !== 'archived');

        return {
            participant_id: participant.id,
            email: participant.email,
            first_name: participant.firstName,
            last_name: participant.lastName,
            assignments: visibleAssignments,
        };
    }
}
