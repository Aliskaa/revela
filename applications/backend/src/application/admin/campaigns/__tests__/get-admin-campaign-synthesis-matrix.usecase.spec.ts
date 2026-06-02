// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Campaign } from '@src/domain/campaigns';
import { Response } from '@src/domain/responses';
import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type {
    CampaignParticipantProgressItem,
    IParticipantsAdminReadPort,
    ListParticipantsParams,
    ParticipantAdminListItem,
    ParticipantCampaignAssignmentItem,
} from '@src/interfaces/participants/IParticipantsRepository.port';
import type { IResponsesSubmissionReaderPort } from '@src/interfaces/responses/IResponsesRepository.port';
import { describe, expect, test } from 'vitest';

import { GetAdminCampaignSynthesisMatrixUseCase } from '../get-admin-campaign-synthesis-matrix.usecase';

const buildCampaign = (overrides: Partial<Parameters<typeof Campaign.create>[0]> = {}): Campaign => {
    return Campaign.hydrate({
        id: 7,
        coachId: 1,
        companyId: 1,
        name: 'Test',
        questionnaireId: 'B',
        status: 'active',
        allowTestWithoutManualInputs: false,
        startsAt: null,
        endsAt: null,
        createdAt: null,
        ...overrides,
    });
};

const buildElementBResponse = (participantId: number, scores: ReadonlyArray<readonly [number, number]>): Response =>
    Response.hydrate({
        id: participantId * 100,
        participantId,
        inviteTokenId: null,
        questionnaireId: 'B',
        campaignId: 7,
        submissionKind: 'element_humain',
        subjectParticipantId: participantId,
        raterParticipantId: null,
        ratedParticipantId: null,
        name: '',
        email: '',
        organisation: null,
        submittedAt: new Date('2026-05-01T12:00:00Z'),
        scores: scores.map(([scoreKey, value]) => ({ scoreKey, value })),
    });

type MockPorts = {
    campaigns: ICampaignsReadPort;
    participants: IParticipantsAdminReadPort;
    responses: IResponsesSubmissionReaderPort;
};

const buildMocks = (cfg: {
    campaign: Campaign | null;
    progress: CampaignParticipantProgressItem[];
    responsesByParticipant: Record<number, Response[]>;
}): MockPorts => {
    const campaigns: ICampaignsReadPort = {
        listAll: async () => [],
        findById: async () => cfg.campaign,
        findByCompanyAndName: async () => null,
    };
    const participants: IParticipantsAdminReadPort = {
        listWithCompany: async (_p: ListParticipantsParams) => ({
            items: [],
            total: 0,
            page: 1,
            pages: 1,
            perPage: 10,
        }),
        listByCompanyId: async () => [],
        listCampaignParticipantProgress: async () => cfg.progress,
        findByIdEnriched: async () => null as ParticipantAdminListItem | null,
        listCampaignsForParticipant: async () => [] as ParticipantCampaignAssignmentItem[],
    };
    const responses: IResponsesSubmissionReaderPort = {
        listForSubjectQuestionnaireMatrix: async (subjectId: number) => cfg.responsesByParticipant[subjectId] ?? [],
        listAllInvolvingParticipant: async () => [],
    };
    return { campaigns, participants, responses };
};

const buildProgress = (participantId: number, fullName: string): CampaignParticipantProgressItem => ({
    participantId,
    fullName,
    email: `${fullName.toLowerCase()}@example.com`,
    avatar_url: null,
    selfRatingStatus: 'completed',
    peerFeedbackStatus: 'completed',
    elementHumainStatus: 'completed',
    resultsStatus: 'pending',
});

describe('GetAdminCampaignSynthesisMatrixUseCase', () => {
    test('returns null when campaign is out of coach scope', async () => {
        const ports = buildMocks({ campaign: null, progress: [], responsesByParticipant: {} });
        const useCase = new GetAdminCampaignSynthesisMatrixUseCase(ports);

        const result = await useCase.execute({ campaignId: 7, coachId: 42 });

        expect(result).toBeNull();
    });

    test('aggregates Élément B scores by participant column and computes gaps', async () => {
        const ports = buildMocks({
            campaign: buildCampaign(),
            progress: [buildProgress(1, 'Alice'), buildProgress(2, 'Bob')],
            responsesByParticipant: {
                1: [
                    buildElementBResponse(1, [
                        [11, 1],
                        [12, 2],
                        [13, 0],
                        [14, 7],
                        [21, 3],
                        [22, 3],
                        [23, 5],
                        [24, 9],
                        [31, 4],
                        [32, 4],
                        [33, 4],
                        [34, 4],
                    ]),
                ],
                2: [
                    // Pas de réponse pour Bob → cellules `null`.
                ],
            },
        });
        const useCase = new GetAdminCampaignSynthesisMatrixUseCase(ports);

        const matrix = await useCase.execute({ campaignId: 7 });

        expect(matrix).not.toBeNull();
        expect(matrix?.gapWarningThreshold).toBe(4);
        expect(matrix?.participants.map(p => p.hasResponse)).toEqual([true, false]);
        expect(matrix?.dimensions).toHaveLength(3);

        const inclusion = matrix?.dimensions[0];
        expect(inclusion?.name).toBe('Inclusion');
        expect(inclusion?.rows[0].values).toEqual([1, null]); // 11 — J'inclus les gens
        expect(inclusion?.rows[1].values).toEqual([2, null]); // 12
        expect(inclusion?.gaps).toHaveLength(2);
        // Paire (11, 12) : |1−2| = 1 → pas de warning
        expect(inclusion?.gaps[0].cells[0]).toEqual({ value: 1, warning: false });
        // Paire (13, 14) : |0−7| = 7 → warning (> 4)
        expect(inclusion?.gaps[1].cells[0]).toEqual({ value: 7, warning: true });
        // Bob sans réponse : valeur nulle, pas de warning
        expect(inclusion?.gaps[0].cells[1]).toEqual({ value: null, warning: false });

        const controle = matrix?.dimensions[1];
        // Paire (23, 24) : |5−9| = 4 → exactement seuil → warning=false (strict >)
        expect(controle?.gaps[1].cells[0]).toEqual({ value: 4, warning: false });
    });

    test('uses the campaign questionnaire when qid is not provided', async () => {
        const ports = buildMocks({
            campaign: buildCampaign({ questionnaireId: 'S', name: 'Test 2' }),
            progress: [buildProgress(1, 'Alice')],
            responsesByParticipant: {
                1: [
                    Response.hydrate({
                        id: 100,
                        participantId: 1,
                        inviteTokenId: null,
                        questionnaireId: 'S',
                        campaignId: 7,
                        submissionKind: 'element_humain',
                        subjectParticipantId: 1,
                        raterParticipantId: null,
                        ratedParticipantId: null,
                        name: '',
                        email: '',
                        organisation: null,
                        submittedAt: new Date('2026-05-01T12:00:00Z'),
                        scores: [
                            { scoreKey: 65, value: 4 },
                            { scoreKey: 66, value: 0 },
                        ],
                    }),
                ],
            },
        });
        const useCase = new GetAdminCampaignSynthesisMatrixUseCase(ports);

        const matrix = await useCase.execute({ campaignId: 7 });

        expect(matrix?.questionnaireId).toBe('S');
        expect(matrix?.questionnaireTitle).toBe('Questionnaire S — Soi');
        expect(matrix?.dimensions).toHaveLength(6);
        expect(matrix?.dimensions[0]?.name).toBe('Présence / Vitalité');
        expect(matrix?.dimensions[0]?.gaps).toHaveLength(1);

        const amour = matrix?.dimensions.find(d => d.name === 'Amour de soi');
        expect(amour?.gaps[0]?.cells[0]).toEqual({ value: 4, warning: false });
    });

    test('computes gap rows for questionnaire F via consecutive score pairs', async () => {
        const ports = buildMocks({
            campaign: buildCampaign({ questionnaireId: 'F' }),
            progress: [buildProgress(1, 'Alice')],
            responsesByParticipant: {
                1: [
                    Response.hydrate({
                        id: 100,
                        participantId: 1,
                        inviteTokenId: null,
                        questionnaireId: 'F',
                        campaignId: 7,
                        submissionKind: 'element_humain',
                        subjectParticipantId: 1,
                        raterParticipantId: null,
                        ratedParticipantId: null,
                        name: '',
                        email: '',
                        organisation: null,
                        submittedAt: new Date('2026-05-01T12:00:00Z'),
                        scores: [
                            { scoreKey: 41, value: 2 },
                            { scoreKey: 42, value: 5 },
                        ],
                    }),
                ],
            },
        });
        const useCase = new GetAdminCampaignSynthesisMatrixUseCase(ports);

        const matrix = await useCase.execute({ campaignId: 7 });

        expect(matrix?.questionnaireId).toBe('F');
        const importance = matrix?.dimensions[0];
        expect(importance?.gaps).toHaveLength(2);
        expect(importance?.gaps[0]?.cells[0]).toEqual({ value: 3, warning: false });
    });

    test('forwards coachId to campaigns.findById for scope filtering', async () => {
        const calls: Array<{ id: number; coachId?: number }> = [];
        const campaigns: ICampaignsReadPort = {
            listAll: async () => [],
            findById: async (id, params) => {
                calls.push({ id, coachId: params?.coachId });
                return null;
            },
            findByCompanyAndName: async () => null,
        };
        const useCase = new GetAdminCampaignSynthesisMatrixUseCase({
            campaigns,
            participants: buildMocks({ campaign: null, progress: [], responsesByParticipant: {} }).participants,
            responses: buildMocks({ campaign: null, progress: [], responsesByParticipant: {} }).responses,
        });

        await useCase.execute({ campaignId: 7, coachId: 42 });

        expect(calls).toEqual([{ id: 7, coachId: 42 }]);
    });
});
