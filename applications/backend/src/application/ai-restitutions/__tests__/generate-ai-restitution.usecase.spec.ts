// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { type HarnessInput, parseHarnessInput } from '@aor/ai-harness';
import { Campaign } from '@src/domain/campaigns';
import { LlmAdapterRegistry } from '@src/infrastructure/llm/llm-adapter-registry';
import type {
    AiPromptVersionRecord,
    AiRestitutionRecord,
    CreateAiRestitutionInput,
    IAiRestitutionsRepositoryPort,
    UpdateAiRestitutionInput,
} from '@src/interfaces/ai-restitutions/IAiRestitutionsRepository.port';
import type { ILlmAdapterPort, LlmGenerateInput } from '@src/interfaces/ai-restitutions/ILlmAdapter.port';
import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import { describe, expect, test, vi } from 'vitest';

import { AiRestitutionPromptNotConfiguredError } from '../ai-restitution.errors';
import { GenerateAiRestitutionUseCase } from '../generate-ai-restitution.usecase';

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

const PROMPT: AiPromptVersionRecord = {
    id: 1,
    version: 'v1-test',
    systemPrompt: 'Tu es un praticien certifié...',
    forbiddenPhrases: ['tu es', 'vous êtes', 'ta personnalité', 'votre personnalité', 'diagnostic'],
    hypothesisMarkers: ['pourrait suggérer', 'peut inviter à explorer', 'peut indiquer dans ce contexte'],
    maxWords: 650,
    provider: 'anthropic',
    model: 'claude-opus-4-7',
    isActive: true,
    createdAt: new Date('2026-05-10'),
};

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

const VALID_LLM_OUTPUT = `# Lecture synthétique
Sur la dimension Inclusion, l'écart pourrait suggérer un ajustement utile.

# Point de cadre
Les scores reflètent un comportement situé dans un contexte donné.

# Points clés de lecture
Cet écart peut indiquer dans ce contexte un point à explorer.

# Lecture managériale
Cette lecture peut inviter à explorer les rituels d'équipe.

# Pistes de réflexion
Quelle situation a déclenché ce besoin ? Quels rituels d'équipe pourraient soutenir cet ajustement ? Comment l'équipe perçoit-elle ces signaux ?
`;

const INVALID_LLM_OUTPUT = 'Tu es très ouvert. Voici un diagnostic clair sur ta personnalité.';

const makeRestitutionsPort = (overrides: {
    activePrompt?: AiPromptVersionRecord | null;
    captureCreate?: (input: CreateAiRestitutionInput) => void;
    captureUpdate?: (input: UpdateAiRestitutionInput) => void;
}): IAiRestitutionsRepositoryPort => {
    const activePrompt = overrides.activePrompt === undefined ? PROMPT : overrides.activePrompt;
    const baseRecord = (input: CreateAiRestitutionInput): AiRestitutionRecord => ({
        id: 100,
        participantId: input.participantId,
        campaignId: input.campaignId,
        status: input.status,
        model: input.model,
        promptVersion: PROMPT.version,
        promptVersionId: input.promptVersionId,
        intermediateJson: input.intermediateJson,
        rawOutput: input.rawOutput,
        editedOutput: null,
        validationReport: input.validationReport,
        regenAttempts: 0,
        generatedAt: new Date(),
        approvedAt: null,
        approvedByCoachId: null,
        updatedAt: new Date(),
    });
    let lastCreated: AiRestitutionRecord | null = null;
    return {
        findActivePromptVersion: vi.fn().mockResolvedValue(activePrompt),
        findByParticipantCampaign: vi.fn().mockResolvedValue(null),
        findById: vi.fn().mockResolvedValue(null),
        create: vi.fn(async (input: CreateAiRestitutionInput): Promise<AiRestitutionRecord> => {
            overrides.captureCreate?.(input);
            lastCreated = baseRecord(input);
            return lastCreated;
        }),
        update: vi.fn(async (input: UpdateAiRestitutionInput) => {
            overrides.captureUpdate?.(input);
            return {
                ...(lastCreated ?? baseRecord({} as CreateAiRestitutionInput)),
                regenAttempts: input.regenAttempts ?? lastCreated?.regenAttempts ?? 0,
            };
        }),
    };
};

const makeCampaignsPort = (campaign: Campaign | null): ICampaignsReadPort =>
    ({
        findById: vi.fn().mockResolvedValue(campaign),
    }) as unknown as ICampaignsReadPort;

const makeAdapter = (...texts: string[]): ILlmAdapterPort => {
    let i = 0;
    return {
        generate: vi.fn(async (input: LlmGenerateInput) => {
            const text = texts[Math.min(i, texts.length - 1)] ?? '';
            i += 1;
            return { text, modelUsed: `${input.model}:test` };
        }),
    };
};

const makeRegistry = (anthropic: ILlmAdapterPort, fake?: ILlmAdapterPort): LlmAdapterRegistry =>
    new LlmAdapterRegistry([
        ['anthropic', anthropic],
        ['fake', fake ?? anthropic],
    ]);

describe('GenerateAiRestitutionUseCase', () => {
    test('campagne hors scope coach → AdminResourceNotFoundError', async () => {
        const useCase = new GenerateAiRestitutionUseCase({
            campaigns: makeCampaignsPort(null),
            restitutions: makeRestitutionsPort({}),
            llmRegistry: makeRegistry(makeAdapter(VALID_LLM_OUTPUT)),
        });

        await expect(
            useCase.execute({
                campaignId: 7,
                participantId: 42,
                coachId: 99,
                harnessInput: buildHarnessInput(),
            })
        ).rejects.toThrow(/Campagne introuvable/);
    });

    test('aucun prompt actif → AiRestitutionPromptNotConfiguredError', async () => {
        const useCase = new GenerateAiRestitutionUseCase({
            campaigns: makeCampaignsPort(buildCampaign()),
            restitutions: makeRestitutionsPort({ activePrompt: null }),
            llmRegistry: makeRegistry(makeAdapter(VALID_LLM_OUTPUT)),
        });

        await expect(
            useCase.execute({
                campaignId: 7,
                participantId: 42,
                harnessInput: buildHarnessInput(),
            })
        ).rejects.toBeInstanceOf(AiRestitutionPromptNotConfiguredError);
    });

    test('tentative 1 valide → status="generated", regenAttempts=0', async () => {
        let captured: CreateAiRestitutionInput | undefined;
        let updateCalled = false;
        const useCase = new GenerateAiRestitutionUseCase({
            campaigns: makeCampaignsPort(buildCampaign()),
            restitutions: makeRestitutionsPort({
                captureCreate: input => {
                    captured = input;
                },
                captureUpdate: () => {
                    updateCalled = true;
                },
            }),
            llmRegistry: makeRegistry(makeAdapter(VALID_LLM_OUTPUT)),
        });

        const record = await useCase.execute({
            campaignId: 7,
            participantId: 42,
            harnessInput: buildHarnessInput(),
        });

        expect(record.status).toBe('generated');
        expect(captured?.validationReport?.ok).toBe(true);
        expect(updateCalled).toBe(false); // pas besoin de patcher regenAttempts
        expect(captured?.intermediateJson).toMatchObject({
            selected_dimensions: [{ name: 'inclusion' }],
        });
    });

    test('tentative 1 KO → tentative 2 OK : regenAttempts=1, status="generated"', async () => {
        let captured: CreateAiRestitutionInput | undefined;
        let updatedRegen: number | undefined;
        const adapter = makeAdapter(INVALID_LLM_OUTPUT, VALID_LLM_OUTPUT);
        const useCase = new GenerateAiRestitutionUseCase({
            campaigns: makeCampaignsPort(buildCampaign()),
            restitutions: makeRestitutionsPort({
                captureCreate: input => {
                    captured = input;
                },
                captureUpdate: input => {
                    updatedRegen = input.regenAttempts;
                },
            }),
            llmRegistry: makeRegistry(adapter),
        });

        const record = await useCase.execute({
            campaignId: 7,
            participantId: 42,
            harnessInput: buildHarnessInput(),
        });

        expect(record.status).toBe('generated');
        expect(captured?.validationReport?.ok).toBe(true);
        expect(updatedRegen).toBe(1);
        expect(adapter.generate).toHaveBeenCalledTimes(2);
        // Le 2ème appel doit contenir l'instruction corrective §10
        const secondCall = (adapter.generate as ReturnType<typeof vi.fn>).mock.calls[1]?.[0] as
            | LlmGenerateInput
            | undefined;
        expect(secondCall?.userPrompt).toMatch(/Régénère-la en corrigeant/u);
        expect(secondCall?.userPrompt).toMatch(/FORMULATIONS INTERDITES/u);
    });

    test('tentatives 1 & 2 KO sur anthropic, fallback fake OK → regenAttempts=2', async () => {
        let captured: CreateAiRestitutionInput | undefined;
        let updatedRegen: number | undefined;
        const anthropicAdapter = makeAdapter(INVALID_LLM_OUTPUT, INVALID_LLM_OUTPUT);
        const fakeAdapter = makeAdapter(VALID_LLM_OUTPUT);
        const useCase = new GenerateAiRestitutionUseCase({
            campaigns: makeCampaignsPort(buildCampaign()),
            restitutions: makeRestitutionsPort({
                captureCreate: input => {
                    captured = input;
                },
                captureUpdate: input => {
                    updatedRegen = input.regenAttempts;
                },
            }),
            llmRegistry: makeRegistry(anthropicAdapter, fakeAdapter),
        });

        const record = await useCase.execute({
            campaignId: 7,
            participantId: 42,
            harnessInput: buildHarnessInput(),
        });

        expect(record.status).toBe('generated');
        expect(captured?.validationReport?.ok).toBe(true);
        expect(updatedRegen).toBe(2);
        expect(anthropicAdapter.generate).toHaveBeenCalledTimes(2);
        expect(fakeAdapter.generate).toHaveBeenCalledTimes(1);
        // Le model persisté doit être celui du fallback (suffixe :test)
        expect(captured?.model).toBe('claude-opus-4-7:test');
    });

    test('3 tentatives toutes KO → status="rejected", report stocké', async () => {
        let captured: CreateAiRestitutionInput | undefined;
        const anthropicAdapter = makeAdapter(INVALID_LLM_OUTPUT, INVALID_LLM_OUTPUT);
        const fakeAdapter = makeAdapter(INVALID_LLM_OUTPUT);
        const useCase = new GenerateAiRestitutionUseCase({
            campaigns: makeCampaignsPort(buildCampaign()),
            restitutions: makeRestitutionsPort({
                captureCreate: input => {
                    captured = input;
                },
            }),
            llmRegistry: makeRegistry(anthropicAdapter, fakeAdapter),
        });

        const record = await useCase.execute({
            campaignId: 7,
            participantId: 42,
            harnessInput: buildHarnessInput(),
        });

        expect(record.status).toBe('rejected');
        expect(captured?.validationReport?.ok).toBe(false);
        const codes = captured?.validationReport?.failures.map(f => f.code) ?? [];
        expect(codes).toContain('forbidden_phrase');
    });
});
