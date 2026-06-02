// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Module } from '@nestjs/common';

import { ApproveAiRestitutionUseCase } from '@src/application/ai-restitutions/approve-ai-restitution.usecase';
import { EditAiRestitutionUseCase } from '@src/application/ai-restitutions/edit-ai-restitution.usecase';
import { GenerateAiRestitutionUseCase } from '@src/application/ai-restitutions/generate-ai-restitution.usecase';
import { GetAdminAiRestitutionUseCase } from '@src/application/ai-restitutions/get-admin-ai-restitution.usecase';
import { RejectAiRestitutionUseCase } from '@src/application/ai-restitutions/reject-ai-restitution.usecase';
import {
    ANTHROPIC_API_KEY_PORT_SYMBOL,
    type AnthropicApiKeyPort,
    AnthropicLlmAdapter,
} from '@src/infrastructure/llm/anthropic-llm.adapter';
import { FakeLlmAdapter } from '@src/infrastructure/llm/fake-llm.adapter';
import {
    type ILlmAdapterRegistry,
    LLM_ADAPTER_REGISTRY_SYMBOL,
    LlmAdapterRegistry,
} from '@src/infrastructure/llm/llm-adapter-registry';
import { ADMIN_AUTH_CONFIG_PORT_SYMBOL, type IAdminAuthConfigPort } from '@src/interfaces/admin/IAdminAuthConfig.port';
import {
    AI_RESTITUTIONS_REPOSITORY_PORT_SYMBOL,
    type IAiRestitutionsRepositoryPort,
} from '@src/interfaces/ai-restitutions/IAiRestitutionsRepository.port';
import {
    CAMPAIGNS_REPOSITORY_PORT_SYMBOL,
    type ICampaignsReadPort,
} from '@src/interfaces/campaigns/ICampaignsRepository.port';
import { COACHES_REPOSITORY_PORT_SYMBOL, type ICoachesReadPort } from '@src/interfaces/coaches/ICoachesRepository.port';
import { requireEnv } from '@src/shared/env';

import { AuditModule } from '@src/presentation/audit/audit.module';
import { AdminAiRestitutionsController } from './admin-ai-restitutions.controller';
import { AdminCampaignsModule } from './admin-campaigns.module';
import { AdminSharedModule } from './admin-shared.module';
import {
    APPROVE_AI_RESTITUTION_USE_CASE_SYMBOL,
    EDIT_AI_RESTITUTION_USE_CASE_SYMBOL,
    GENERATE_AI_RESTITUTION_USE_CASE_SYMBOL,
    GET_ADMIN_AI_RESTITUTION_USE_CASE_SYMBOL,
    REJECT_AI_RESTITUTION_USE_CASE_SYMBOL,
} from './admin.tokens';
import { CampaignAccessGuard } from './campaign-access.guard';

/**
 * Module Restitution IA — endpoints admin/coach §10 PDF AOR.
 *
 * Sélection de l'adapter pilotée par BDD : `ai_prompt_versions.provider`
 * détermine quel adapter LLM est utilisé (cf. décision Laurent 2026-05-10 :
 * tout paramètre métier en BDD, jamais en `.env`). Le `LlmAdapterRegistry`
 * mappe `provider → adapter`. La clé API Anthropic reste un secret en `.env`
 * (puis AWS Secrets Manager).
 *
 * Importe `AdminCampaignsModule` pour réutiliser `GET_ADMIN_CAMPAIGN_DETAIL_USE_CASE_SYMBOL`
 * (consommé par le `CampaignAccessGuard` qui scope l'accès campagne du coach).
 */
@Module({
    imports: [AdminSharedModule, AdminCampaignsModule, AuditModule],
    controllers: [AdminAiRestitutionsController],
    providers: [
        CampaignAccessGuard,
        FakeLlmAdapter,
        AnthropicLlmAdapter,
        {
            provide: ANTHROPIC_API_KEY_PORT_SYMBOL,
            useFactory: (): AnthropicApiKeyPort => ({ apiKey: requireEnv('ANTHROPIC_API_KEY') }),
        },
        {
            provide: LLM_ADAPTER_REGISTRY_SYMBOL,
            useFactory: (anthropic: AnthropicLlmAdapter, fake: FakeLlmAdapter) =>
                new LlmAdapterRegistry([
                    ['anthropic', anthropic],
                    ['fake', fake],
                ]),
            inject: [AnthropicLlmAdapter, FakeLlmAdapter],
        },
        {
            provide: GENERATE_AI_RESTITUTION_USE_CASE_SYMBOL,
            useFactory: (
                campaigns: ICampaignsReadPort,
                restitutions: IAiRestitutionsRepositoryPort,
                llmRegistry: ILlmAdapterRegistry
            ) => new GenerateAiRestitutionUseCase({ campaigns, restitutions, llmRegistry }),
            inject: [
                CAMPAIGNS_REPOSITORY_PORT_SYMBOL,
                AI_RESTITUTIONS_REPOSITORY_PORT_SYMBOL,
                LLM_ADAPTER_REGISTRY_SYMBOL,
            ],
        },
        {
            provide: EDIT_AI_RESTITUTION_USE_CASE_SYMBOL,
            useFactory: (campaigns: ICampaignsReadPort, restitutions: IAiRestitutionsRepositoryPort) =>
                new EditAiRestitutionUseCase({ campaigns, restitutions }),
            inject: [CAMPAIGNS_REPOSITORY_PORT_SYMBOL, AI_RESTITUTIONS_REPOSITORY_PORT_SYMBOL],
        },
        {
            provide: APPROVE_AI_RESTITUTION_USE_CASE_SYMBOL,
            useFactory: (
                campaigns: ICampaignsReadPort,
                coaches: ICoachesReadPort,
                authConfig: IAdminAuthConfigPort,
                restitutions: IAiRestitutionsRepositoryPort
            ) =>
                new ApproveAiRestitutionUseCase({
                    campaigns,
                    coaches,
                    authConfig,
                    restitutions,
                }),
            inject: [
                CAMPAIGNS_REPOSITORY_PORT_SYMBOL,
                COACHES_REPOSITORY_PORT_SYMBOL,
                ADMIN_AUTH_CONFIG_PORT_SYMBOL,
                AI_RESTITUTIONS_REPOSITORY_PORT_SYMBOL,
            ],
        },
        {
            provide: REJECT_AI_RESTITUTION_USE_CASE_SYMBOL,
            useFactory: (campaigns: ICampaignsReadPort, restitutions: IAiRestitutionsRepositoryPort) =>
                new RejectAiRestitutionUseCase({ campaigns, restitutions }),
            inject: [CAMPAIGNS_REPOSITORY_PORT_SYMBOL, AI_RESTITUTIONS_REPOSITORY_PORT_SYMBOL],
        },
        {
            provide: GET_ADMIN_AI_RESTITUTION_USE_CASE_SYMBOL,
            useFactory: (campaigns: ICampaignsReadPort, restitutions: IAiRestitutionsRepositoryPort) =>
                new GetAdminAiRestitutionUseCase({ campaigns, restitutions }),
            inject: [CAMPAIGNS_REPOSITORY_PORT_SYMBOL, AI_RESTITUTIONS_REPOSITORY_PORT_SYMBOL],
        },
    ],
})
export class AdminAiRestitutionsModule {}
