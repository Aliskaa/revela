// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Participant } from '@src/domain/participants';
import { Response } from '@src/domain/responses';
import { ResponsesValidationError } from '@src/domain/responses/responses.errors';
import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type { ICompaniesReadPort } from '@src/interfaces/companies/ICompaniesRepository.port';
import type {
    IParticipantsCampaignStateReaderPort,
    IParticipantsIdentityReaderPort,
    IParticipantsInviteAssignmentsReaderPort,
} from '@src/interfaces/participants/IParticipantsRepository.port';
import type { IElementBDraftsRepositoryPort } from '@src/interfaces/responses/IElementBDraftsRepository.port';
import type {
    IResponsesSubmissionReaderPort,
    IResponsesWriterPort,
} from '@src/interfaces/responses/IResponsesRepository.port';
import { expect, test } from 'vitest';

import { SubmitParticipantQuestionnaireUseCase } from '../submit-participant-questionnaire.usecase';

const elementBDrafts = {
    findByKey: async () => null,
    upsert: async () => {
        throw new Error('not used in submit tests');
    },
    deleteByKey: async () => true,
} as unknown as IElementBDraftsRepositoryPort;

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
    createdByCoachId: null,
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
        elementBDrafts,
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
        elementBDrafts,
    });

    const result = await useCase.execute(participant.id, 'B', scientificPayload, 11);

    expect(result.response_id).toBe(99);
    expect(created[0]?.submissionKind).toBe('element_humain');
});

const participantsWithPeer = {
    findById: async () => participant,
    listInviteAssignmentsForParticipant: async () => [{ campaignId: 11, questionnaireId: 'B' }],
    getCampaignParticipantInviteState: async () => ({ invitedAt: new Date(), joinedAt: new Date() }),
    listJoinedCampaignPeerChoices: async () => [
        { participant_id: 42, full_name: 'Pair Cible', first_name: 'Pair', last_name: 'Cible' },
    ],
} as unknown as IParticipantsIdentityReaderPort &
    IParticipantsInviteAssignmentsReaderPort &
    IParticipantsCampaignStateReaderPort;

const B_SCORE_KEYS = ['11', '12', '13', '14', '21', '22', '23', '24', '31', '32', '33', '34'];

const fullPeerScores = (): Record<string, number> => {
    const s: Record<string, number> = {};
    for (const k of B_SCORE_KEYS) {
        s[k] = 5;
    }
    return s;
};

const peerRatingPayload = (overrides: Record<string, unknown> = {}) => ({
    kind: 'peer_rating' as const,
    peer_label: 'Pair Cible',
    rated_participant_id: 42,
    scores: fullPeerScores(),
    ...overrides,
});

test('peer rating persists trimmed comments aligned with their score keys', async () => {
    const created: Response[] = [];
    const useCase = new SubmitParticipantQuestionnaireUseCase({
        participants: participantsWithPeer,
        companies,
        campaigns: campaign(false),
        responses: responses(created),
        elementBDrafts,
    });

    await useCase.execute(
        participant.id,
        'B',
        peerRatingPayload({
            comments: { '11': '  Très inclusif au quotidien.  ', '12': '' },
        }),
        11
    );

    expect(created).toHaveLength(1);
    const draft = created[0];
    expect(draft?.submissionKind).toBe('peer_rating');
    const byKey = new Map(draft?.scores.map(s => [s.scoreKey, s]) ?? []);
    expect(byKey.get(11)?.comment).toBe('Très inclusif au quotidien.');
    // Commentaire vide → null en base, pas une chaîne vide.
    expect(byKey.get(12)?.comment ?? null).toBeNull();
});

test('peer rating rejects comments orphelins (clé sans note correspondante)', async () => {
    const created: Response[] = [];
    const useCase = new SubmitParticipantQuestionnaireUseCase({
        participants: participantsWithPeer,
        companies,
        campaigns: campaign(false),
        responses: responses(created),
        elementBDrafts,
    });

    await expect(
        useCase.execute(
            participant.id,
            'B',
            peerRatingPayload({
                comments: { '99': 'Aucune note correspondante' },
            }),
            11
        )
    ).rejects.toBeInstanceOf(ResponsesValidationError);
    expect(created).toHaveLength(0);
});

test('peer rating rejects comments > 150 caractères', async () => {
    const created: Response[] = [];
    const useCase = new SubmitParticipantQuestionnaireUseCase({
        participants: participantsWithPeer,
        companies,
        campaigns: campaign(false),
        responses: responses(created),
        elementBDrafts,
    });

    const tooLong = 'a'.repeat(151);
    await expect(
        useCase.execute(participant.id, 'B', { ...peerRatingPayload(), comments: { '11': tooLong } }, 11)
    ).rejects.toBeInstanceOf(ResponsesValidationError);
    expect(created).toHaveLength(0);
});
