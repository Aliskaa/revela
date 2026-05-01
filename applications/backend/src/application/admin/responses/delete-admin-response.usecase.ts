// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { AdminConfirmationRequiredError, AdminResourceNotFoundError } from '@src/domain/admin/admin.errors';
import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type {
    IResponsesRecordReaderPort,
    IResponsesWriterPort,
} from '@src/interfaces/responses/IResponsesRepository.port';

export class DeleteAdminResponseUseCase {
    public constructor(
        private readonly ports: {
            readonly responses: IResponsesWriterPort & IResponsesRecordReaderPort;
            readonly campaigns: ICampaignsReadPort;
        }
    ) {}

    /**
     * Filtrage scope=coach (G5 RGPD) : si `coachId` est fourni, on vérifie d'abord que la
     * réponse appartient à une campagne de ce coach. Sinon → 404 (pas 403, pour ne pas
     * leak l'existence). Pas de filtrage en scope super-admin.
     */
    public async execute(
        responseId: number,
        confirm: boolean | undefined,
        params: { coachId?: number } = {}
    ): Promise<{
        message: string;
        deleted_response_id: number;
    }> {
        if (confirm !== true) {
            throw new AdminConfirmationRequiredError();
        }

        if (params.coachId !== undefined) {
            const record = await this.ports.responses.findById(responseId);
            if (!record || record.campaignId === null || record.campaignId === undefined) {
                throw new AdminResourceNotFoundError();
            }
            const campaign = await this.ports.campaigns.findById(record.campaignId);
            if (!campaign || campaign.coachId !== params.coachId) {
                throw new AdminResourceNotFoundError();
            }
        }

        const ok = await this.ports.responses.deleteById(responseId);
        if (!ok) {
            throw new AdminResourceNotFoundError();
        }
        return {
            message: 'Réponse et scores associés supprimés définitivement.',
            deleted_response_id: responseId,
        };
    }
}
