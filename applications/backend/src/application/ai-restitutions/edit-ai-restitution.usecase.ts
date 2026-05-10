// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { type IntermediateObject, intermediateObjectSchema, validateOutput } from '@aor/ai-harness';
import type { AiRestitutionValidationFailure, AiRestitutionValidationReport } from '@aor/types';

import { AdminResourceNotFoundError } from '@src/domain/admin/admin.errors';
import type {
    AiRestitutionRecord,
    IAiRestitutionsRepositoryPort,
} from '@src/interfaces/ai-restitutions/IAiRestitutionsRepository.port';
import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';

import { AiRestitutionNotFoundError } from './ai-restitution.errors';

const toReportFailures = (
    failures: ReadonlyArray<{ code: string; detail: string }>
): AiRestitutionValidationFailure[] =>
    failures.map(f => ({
        code: f.code as AiRestitutionValidationFailure['code'],
        detail: f.detail,
    }));

/**
 * Édite la restitution IA — coach met à jour le Markdown puis le validateur §9
 * est rejoué. Le statut passe à 'edited'. La validation peut échouer (le coach
 * peut éditer en plusieurs passes) ; dans ce cas, le rapport est stocké pour
 * que l'UI affiche les erreurs, et `Approve` les bloquera tant que la version
 * courante ne passe pas.
 */
export class EditAiRestitutionUseCase {
    public constructor(
        private readonly ports: {
            readonly campaigns: ICampaignsReadPort;
            readonly restitutions: IAiRestitutionsRepositoryPort;
        }
    ) {}

    public async execute(params: {
        campaignId: number;
        participantId: number;
        coachId?: number;
        editedOutput: string;
    }): Promise<AiRestitutionRecord> {
        const campaign = await this.ports.campaigns.findById(params.campaignId, {
            coachId: params.coachId,
        });
        if (!campaign) {
            throw new AdminResourceNotFoundError('Campagne introuvable.');
        }

        const existing = await this.ports.restitutions.findByParticipantCampaign(
            params.participantId,
            params.campaignId
        );
        if (!existing) {
            throw new AiRestitutionNotFoundError();
        }

        // Reconstruit l'IntermediateObject depuis le snapshot persisté pour
        // pouvoir rejouer le validateur §9 avec les contraintes de l'origine.
        const intermediate: IntermediateObject = intermediateObjectSchema.parse(existing.intermediateJson);

        const validation = validateOutput(params.editedOutput, intermediate);
        const report: AiRestitutionValidationReport = {
            ok: validation.ok,
            word_count: validation.wordCount,
            failures: toReportFailures(validation.failures),
            validated_at: new Date().toISOString(),
        };

        return this.ports.restitutions.update({
            id: existing.id,
            status: 'edited',
            editedOutput: params.editedOutput,
            validationReport: report,
        });
    }
}
