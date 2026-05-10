// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { type IntermediateObject, intermediateObjectSchema, validateOutput } from '@aor/ai-harness';
import type { AiRestitutionValidationFailure, AiRestitutionValidationReport } from '@aor/types';

import { AdminResourceNotFoundError } from '@src/domain/admin/admin.errors';
import type { IAdminAuthConfigPort } from '@src/interfaces/admin/IAdminAuthConfig.port';
import type {
    AiRestitutionRecord,
    IAiRestitutionsRepositoryPort,
} from '@src/interfaces/ai-restitutions/IAiRestitutionsRepository.port';
import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type { ICoachesReadPort } from '@src/interfaces/coaches/ICoachesRepository.port';

import { AiRestitutionNotApprovableError, AiRestitutionNotFoundError } from './ai-restitution.errors';

const toReportFailures = (
    failures: ReadonlyArray<{ code: string; detail: string }>
): AiRestitutionValidationFailure[] =>
    failures.map(f => ({
        code: f.code as AiRestitutionValidationFailure['code'],
        detail: f.detail,
    }));

/**
 * Approuve une restitution IA — la rend visible au participant.
 *
 * Garde-fou §9 (décision Laurent 2026-05-10) : le validateur est rejoué sur
 * la version courante (`editedOutput ?? rawOutput`). Si une seule contrainte
 * échoue → `AiRestitutionNotApprovableError`. Le coach ne peut PAS forcer
 * la diffusion d'une restitution non conforme.
 *
 * `actorCoachId` :
 *  - scope=coach → coach connecté.
 *  - scope=super-admin → résolu vers la ligne sentinelle « Admin »
 *    (cf. `EnsureAdminCoachService` P05).
 */
export class ApproveAiRestitutionUseCase {
    public constructor(
        private readonly ports: {
            readonly campaigns: ICampaignsReadPort;
            readonly coaches: ICoachesReadPort;
            readonly authConfig: IAdminAuthConfigPort;
            readonly restitutions: IAiRestitutionsRepositoryPort;
        }
    ) {}

    public async execute(params: {
        campaignId: number;
        participantId: number;
        coachId?: number;
        actorCoachId: number | null;
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

        const currentText = existing.editedOutput ?? existing.rawOutput;
        const intermediate: IntermediateObject = intermediateObjectSchema.parse(existing.intermediateJson);
        const validation = validateOutput(currentText, intermediate);

        if (!validation.ok) {
            throw new AiRestitutionNotApprovableError(toReportFailures(validation.failures));
        }

        const report: AiRestitutionValidationReport = {
            ok: true,
            word_count: validation.wordCount,
            failures: [],
            validated_at: new Date().toISOString(),
        };

        const resolvedActorCoachId = await this.resolveActorCoachId(params.actorCoachId);

        return this.ports.restitutions.update({
            id: existing.id,
            status: 'approved',
            validationReport: report,
            approvedAt: new Date(),
            approvedByCoachId: resolvedActorCoachId,
        });
    }

    private async resolveActorCoachId(actorCoachId: number | null): Promise<number> {
        if (actorCoachId !== null) {
            return actorCoachId;
        }
        const adminCoach = await this.ports.coaches.findByUsername(this.ports.authConfig.superAdminUsername);
        if (!adminCoach) {
            throw new Error(
                "Compte coach Admin introuvable. EnsureAdminCoachService n'a pas pu initialiser la ligne sentinelle."
            );
        }
        return adminCoach.id;
    }
}
