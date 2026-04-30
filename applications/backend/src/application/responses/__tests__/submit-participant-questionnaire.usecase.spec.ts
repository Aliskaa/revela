// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { ResponsesValidationError } from '@src/domain/responses/responses.errors';
import { Participant } from '@src/domain/participants';
import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type { ICompaniesReadPort } from '@src/interfaces/companies/ICompaniesRepository.port';
import type {
    IParticipantsCampaignStateReaderPort,
    IParticipantsIdentityReaderPort,
    IParticipantsInviteAssignmentsReaderPort,
} from '@src/interfaces/participants/IParticipantsRepository.port';
import { Response } from '@src/domain/responses';
import type {
    IResponsesSubmissionReaderPort,
    IResponsesWriterPort,
} from '@src/interfaces/responses/IResponsesRepository.port';
import { expect, test } from 'vitest';

import { SubmitParticipantQuestionnaireUseCase } from './submit-participant-questionnaire.usecase';

const participant = Participant.hydrate({
    id: 7,
    companyId: 3,
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    organisation: null,
    direction: null,
    service: null,
    functionLevel: null,
    passwordHash: 'hash',
    createdAt: new Date(),
});

const scientificPayload = {
    series0: Array(54).fill(0),
    series1: Array(54).fill(0),
};

const participants = {
    findById: async () => participant,
    listInviteAssignmentsForParticipant: async () => [{ campaignId: 11, questionnaireId: 'B' }],
    getCampaignParticipantInviteState: async () => ({ invitedAt: new Date(), joinedAt: new Date() }),
    listJoinedCampaignPeerChoices: async () => [],
} as unknown as IParticipantsIdentityReaderPort &
    IParticipantsInviteAssignmentsReaderPort &
    IParticipantsCampaignStateReaderPort;

const companies = {
    findById: async () => ({
        id: 3,
        name: 'AOR',
        contactName: null,
        contactEmail: null,
        createdAt: new Date(),
    }),
} as unknown as ICompaniesReadPort;

const campaign = (allowTestWithoutManualInputs: boolean) =>
    ({
        findById: async () => ({
            id: 11,
            coachId: 1,
            companyId: 3,
            name: 'Campagne B',
            questionnaireId: 'B',
            status: 'active',
            allowTestWithoutManualInputs,
            startsAt: null,
            endsAt: null,
            createdAt: new Date(),
        }),
    }) as unknown as ICampaignsReadPort;

const responses = (created: Response[]) =>
    ({
        listForSubjectQuestionnaireMatrix: async () => [],
        create: async (draft: Response): Promise<Response> => {
            created.push(draft);
            return Response.hydrate({
                id: 99,
                participantId: draft.participantId,
                inviteTokenId: draft.inviteTokenId,
                questionnaireId: draft.questionnaireId,
                campaignId: draft.campaignId,
                submissionKind: draft.submissionKind,
                subjectParticipantId: draft.subjectParticipantId,
                raterParticipantId: draft.raterParticipantId,
                ratedParticipantId: draft.ratedParticipantId,
                name: draft.name,
                email: draft.email,
                organisation: draft.organisation,
                submittedAt: new Date(),
                scores: [...draft.scores],
            });
        },
    }) as unknown as IResponsesWriterPort & IResponsesSubmissionReaderPort;

test('scientific test is rejected until manual inputs are completed when campaign disallows bypass', async () => {
    const created: Response[] = [];
    const useCase = new SubmitParticipantQuestionnaireUseCase({
        participants,
        companies,
        campaigns: campaign(false),
        responses: responses(created),
    });

    await expect(useCase.execute(participant.id, 'B', scientificPayload, 11)).rejects.toBeInstanceOf(
        ResponsesValidationError
    );
    expect(created).toHaveLength(0);
});

test('scientific test can be submitted before manual inputs when campaign allows bypass', async () => {
    const created: Response[] = [];
    const useCase = new SubmitParticipantQuestionnaireUseCase({
        participants,
        companies,
        campaigns: campaign(true),
        responses: responses(created),
    });

    const result = await useCase.execute(participant.id, 'B', scientificPayload, 11);

    expect(result.response_id).toBe(99);
    expect(created[0]?.submissionKind).toBe('element_humain');
});
