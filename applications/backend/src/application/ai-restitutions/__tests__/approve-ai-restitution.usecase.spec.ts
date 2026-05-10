// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { type HarnessInput, buildIntermediateObject, parseHarnessInput, selectDimensions } from '@aor/ai-harness';
import { Campaign } from '@src/domain/campaigns';
import type { IAdminAuthConfigPort } from '@src/interfaces/admin/IAdminAuthConfig.port';
import type {
    AiRestitutionRecord,
    IAiRestitutionsRepositoryPort,
    UpdateAiRestitutionInput,
} from '@src/interfaces/ai-restitutions/IAiRestitutionsRepository.port';
import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type { ICoachesReadPort } from '@src/interfaces/coaches/ICoachesRepository.port';
import { describe, expect, test, vi } from 'vitest';

import { AiRestitutionNotApprovableError, AiRestitutionNotFoundError } from '../ai-restitution.errors';
import { ApproveAiRestitutionUseCase } from '../approve-ai-restitution.usecase';

const VALID_TEXT = `# Lecture synthétique
Sur la dimension Inclusion, l'écart pourrait suggérer un ajustement utile.

# Point de cadre
Les scores reflètent un comportement situé dans un contexte donné.

# Points clés de lecture
Cet écart peut indiquer dans ce contexte un point à explorer.

# Lecture managériale
Cette lecture peut inviter à explorer les rituels d'équipe.

# Pistes de réflexion
Quelle situation a déclenché ce besoin ? Quels rituels d'équipe ? Comment l'équipe perçoit-elle ce signal ?
`;

const INVALID_TEXT = 'Tu es très ouvert. Voici un diagnostic clair sur ta personnalité.';

const buildHarnessInput = (): HarnessInput =>
    parseHarnessInput({
        module: 'firo_b_short_restitution',
        language: 'fr',
        scores: {
            inclusion: { expressed: 2, wanted: 8, peer_feedback: 3 },
            control: { expressed: 5, wanted: 5, peer_feedback: 5 },
            openness: { expressed: 5, wanted: 5, peer_feedback: 5 },
            transparency: { score: 60 },
        },
    });

const buildCampaign = (): Campaign =>
    Campaign.hydrate({
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
    });

const makeRecord = (overrides: Partial<AiRestitutionRecord>): AiRestitutionRecord => {
    const input = buildHarnessInput();
    const intermediate = buildIntermediateObject(input, selectDimensions(input));
    return {
        id: 100,
        participantId: 42,
        campaignId: 7,
        status: 'generated',
        model: 'claude-opus-4-7:fake',
        promptVersion: 'v1-test',
        promptVersionId: 1,
        intermediateJson: intermediate,
        rawOutput: VALID_TEXT,
        editedOutput: null,
        validationReport: null,
        regenAttempts: 0,
        generatedAt: new Date('2026-05-10'),
        approvedAt: null,
        approvedByCoachId: null,
        updatedAt: new Date('2026-05-10'),
        ...overrides,
    };
};

const makeCampaignsPort = (campaign: Campaign | null): ICampaignsReadPort =>
    ({ findById: vi.fn().mockResolvedValue(campaign) }) as unknown as ICampaignsReadPort;

const makeAuthConfig = (): IAdminAuthConfigPort => ({
    superAdminUsername: 'admin',
    superAdminPassword: 'whatever',
});

const makeCoachesPort = (sentinelId: number | null): ICoachesReadPort =>
    ({
        findByUsername: vi.fn().mockResolvedValue(sentinelId === null ? null : { id: sentinelId }),
    }) as unknown as ICoachesReadPort;

const makeRestitutionsPort = (
    record: AiRestitutionRecord | null,
    captureUpdate?: (input: UpdateAiRestitutionInput) => void
): IAiRestitutionsRepositoryPort => ({
    findByParticipantCampaign: vi.fn().mockResolvedValue(record),
    findById: vi.fn().mockResolvedValue(record),
    findActivePromptVersion: vi.fn(),
    create: vi.fn(),
    update: vi.fn(async (input: UpdateAiRestitutionInput) => {
        captureUpdate?.(input);
        return makeRecord({
            status: input.status ?? 'generated',
            approvedAt: input.approvedAt ?? null,
            approvedByCoachId: input.approvedByCoachId ?? null,
            validationReport: input.validationReport ?? null,
        });
    }),
});

describe('ApproveAiRestitutionUseCase', () => {
    test('aucune restitution → AiRestitutionNotFoundError', async () => {
        const useCase = new ApproveAiRestitutionUseCase({
            campaigns: makeCampaignsPort(buildCampaign()),
            coaches: makeCoachesPort(null),
            authConfig: makeAuthConfig(),
            restitutions: makeRestitutionsPort(null),
        });

        await expect(useCase.execute({ campaignId: 7, participantId: 42, actorCoachId: 5 })).rejects.toBeInstanceOf(
            AiRestitutionNotFoundError
        );
    });

    test('texte courant invalide → AiRestitutionNotApprovableError (pas de mise à jour)', async () => {
        let captured: UpdateAiRestitutionInput | undefined;
        const useCase = new ApproveAiRestitutionUseCase({
            campaigns: makeCampaignsPort(buildCampaign()),
            coaches: makeCoachesPort(null),
            authConfig: makeAuthConfig(),
            restitutions: makeRestitutionsPort(makeRecord({ rawOutput: INVALID_TEXT, editedOutput: null }), input => {
                captured = input;
            }),
        });

        await expect(useCase.execute({ campaignId: 7, participantId: 42, actorCoachId: 5 })).rejects.toBeInstanceOf(
            AiRestitutionNotApprovableError
        );

        expect(captured).toBeUndefined();
    });

    test('texte raw valide → status="approved", approvedAt non-null, coach renseigné', async () => {
        let captured: UpdateAiRestitutionInput | undefined;
        const useCase = new ApproveAiRestitutionUseCase({
            campaigns: makeCampaignsPort(buildCampaign()),
            coaches: makeCoachesPort(null),
            authConfig: makeAuthConfig(),
            restitutions: makeRestitutionsPort(makeRecord({ rawOutput: VALID_TEXT }), input => {
                captured = input;
            }),
        });

        const record = await useCase.execute({
            campaignId: 7,
            participantId: 42,
            actorCoachId: 5,
        });

        expect(record.status).toBe('approved');
        expect(captured?.status).toBe('approved');
        expect(captured?.approvedAt).toBeInstanceOf(Date);
        expect(captured?.approvedByCoachId).toBe(5);
    });

    test('actorCoachId=null (super-admin) → résolution sentinelle', async () => {
        let captured: UpdateAiRestitutionInput | undefined;
        const useCase = new ApproveAiRestitutionUseCase({
            campaigns: makeCampaignsPort(buildCampaign()),
            coaches: makeCoachesPort(99), // ligne sentinelle Admin (id=99)
            authConfig: makeAuthConfig(),
            restitutions: makeRestitutionsPort(makeRecord({ rawOutput: VALID_TEXT }), input => {
                captured = input;
            }),
        });

        await useCase.execute({ campaignId: 7, participantId: 42, actorCoachId: null });

        expect(captured?.approvedByCoachId).toBe(99);
    });

    test('texte édité prioritaire sur raw — édition valide passe', async () => {
        let captured: UpdateAiRestitutionInput | undefined;
        const useCase = new ApproveAiRestitutionUseCase({
            campaigns: makeCampaignsPort(buildCampaign()),
            coaches: makeCoachesPort(null),
            authConfig: makeAuthConfig(),
            restitutions: makeRestitutionsPort(
                makeRecord({ rawOutput: INVALID_TEXT, editedOutput: VALID_TEXT }),
                input => {
                    captured = input;
                }
            ),
        });

        const record = await useCase.execute({
            campaignId: 7,
            participantId: 42,
            actorCoachId: 5,
        });

        expect(record.status).toBe('approved');
        expect(captured?.status).toBe('approved');
    });
});
