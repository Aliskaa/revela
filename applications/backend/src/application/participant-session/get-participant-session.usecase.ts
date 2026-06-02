// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { getQuestionnaireEntry } from '@aor/questionnaires';
import type { ParticipantSession } from '@aor/types';
import {
    participantAvatarPublicPath,
    participantCampaignCoachAvatarPublicPath,
} from '@src/application/participant-session/upload-participant-avatar.usecase';
import { ParticipantAccountNotFoundError } from '@src/domain/participant-session/participant-session.errors';
import type { CampaignStatus, ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type { ICoachesReadPort } from '@src/interfaces/coaches/ICoachesRepository.port';
import type { ICompaniesReadPort } from '@src/interfaces/companies/ICompaniesRepository.port';
import type {
    IParticipantsCampaignStateReaderPort,
    IParticipantsIdentityReaderPort,
    IParticipantsInviteAssignmentsReaderPort,
} from '@src/interfaces/participants/IParticipantsRepository.port';

const normalizeStepStatus = (status: 'locked' | 'pending' | 'completed'): 'locked' | 'pending' | 'completed' => {
    if (status === 'completed' || status === 'locked') {
        return status;
    }
    return 'pending';
};

export class GetParticipantSessionUseCase {
    public constructor(
        private readonly ports: {
            readonly participants: IParticipantsIdentityReaderPort &
                IParticipantsInviteAssignmentsReaderPort &
                IParticipantsCampaignStateReaderPort;
            readonly campaigns: ICampaignsReadPort;
            readonly companies: ICompaniesReadPort;
            readonly coaches: ICoachesReadPort;
        }
    ) {}

    public async execute(participantId: number): Promise<ParticipantSession> {
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
                const peerRatingsCount =
                    assignment.campaignId === null || assignment.campaignId === undefined
                        ? 0
                        : await this.ports.participants.countPeerRatingsForCampaignSubject(
                              assignment.campaignId,
                              participantId
                          );
                let campaignStatus: CampaignStatus | null = null;
                let campaignName: string | null = null;
                let companyId: number | null = null;
                let companyName: string | null = null;
                let coachId: number | null = null;
                let coachName: string | null = null;
                let coachAvatarUrl: string | null = null;
                let allowTestWithoutManualInputs = false;
                let invitationConfirmed = true;
                const questionnaireTitle =
                    getQuestionnaireEntry(assignment.questionnaireId)?.title ?? assignment.questionnaireId;
                if (assignment.campaignId !== null && assignment.campaignId !== undefined) {
                    const campaign = await this.ports.campaigns.findById(assignment.campaignId);
                    campaignStatus = campaign?.status ?? null;
                    campaignName = campaign?.name ?? null;
                    companyId = campaign?.companyId ?? null;
                    coachId = campaign?.coachId ?? null;
                    allowTestWithoutManualInputs = campaign?.allowTestWithoutManualInputs ?? false;
                    const [company, coach] = await Promise.all([
                        companyId === null ? Promise.resolve(null) : this.ports.companies.findById(companyId),
                        coachId === null ? Promise.resolve(null) : this.ports.coaches.findById(coachId),
                    ]);
                    companyName = company?.name ?? null;
                    coachName = coach?.displayName ?? null;
                    if (coachId !== null) {
                        const resolved = await this.ports.coaches.resolveAvatarUrl(coachId);
                        if (resolved) {
                            const cacheBuster = resolved.includes('?v=')
                                ? Number(resolved.split('?v=')[1])
                                : undefined;
                            coachAvatarUrl = participantCampaignCoachAvatarPublicPath(
                                assignment.campaignId,
                                Number.isFinite(cacheBuster) ? cacheBuster : undefined
                            );
                        }
                    }
                    const state = await this.ports.participants.getCampaignParticipantInviteState(
                        assignment.campaignId,
                        participantId
                    );
                    invitationConfirmed = state?.joinedAt != null;
                }
                return {
                    campaign_id: assignment.campaignId,
                    campaign_name: campaignName,
                    company_id: companyId,
                    company_name: companyName,
                    coach_id: coachId,
                    coach_name: coachName,
                    coach_avatar_url: coachAvatarUrl,
                    questionnaire_id: assignment.questionnaireId,
                    questionnaire_title: questionnaireTitle,
                    campaign_status: campaignStatus,
                    allow_test_without_manual_inputs: allowTestWithoutManualInputs,
                    invitation_confirmed: invitationConfirmed,
                    progression: progress
                        ? {
                              self_rating_status: normalizeStepStatus(progress.selfRatingStatus),
                              peer_feedback_status: normalizeStepStatus(progress.peerFeedbackStatus),
                              element_humain_status: normalizeStepStatus(progress.elementHumainStatus),
                              feedback_coach: null,
                              peer_ratings_count: peerRatingsCount,
                          }
                        : null,
                };
            })
        );

        const visibleAssignments = assignmentsWithProgress.filter(row => row.campaign_status !== 'archived');

        let avatarUrl: string | null = null;
        if (participant.hasAvatar()) {
            const updatedAt = await this.ports.participants.findUpdatedAt(participantId);
            avatarUrl = participantAvatarPublicPath(updatedAt?.getTime() ?? Date.now());
        }

        let company_name: string | null = null;
        if (participant.companyId !== null) {
            const company = await this.ports.companies.findById(participant.companyId);
            company_name = company?.name ?? null;
        }
        if (!company_name) {
            company_name =
                visibleAssignments.find(assignment => assignment.company_name)?.company_name ?? null;
        }

        return {
            participant_id: participant.id,
            email: participant.email,
            first_name: participant.firstName,
            last_name: participant.lastName,
            company_name,
            organisation: participant.organisation ?? null,
            direction: participant.direction ?? null,
            service: participant.service ?? null,
            function_level: participant.functionLevel ?? null,
            avatar_url: avatarUrl,
            assignments: visibleAssignments,
        };
    }
}
