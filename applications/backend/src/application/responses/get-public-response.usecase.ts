// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { getQuestionnaireEntry } from '@aor/questionnaires';

import { ResponseRecordNotFoundError } from '@src/domain/responses/responses.errors';
import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type { IResponsesRecordReaderPort } from '@src/interfaces/responses/IResponsesRepository.port';

import { responseBaseJson, responseWithCatalogToJson } from './response-serialization';

/** Returns a public response payload enriched with questionnaire metadata when available. */
export class GetPublicResponseUseCase {
    public constructor(
        private readonly ports: {
            readonly responses: IResponsesRecordReaderPort;
            readonly campaigns: ICampaignsReadPort;
        }
    ) {}

    /**
     * Filtrage scope=coach (G5 RGPD) : si `params.coachId` est fourni, on vérifie que la
     * réponse appartient à une campagne attribuée à ce coach. Sinon → 404 (pour ne pas
     * leak l'existence). Les réponses orphelines (`campaignId === null`, ex. réponses
     * historiques d'avant la cutover V2) sont aussi rejetées en scope=coach.
     */
    public async execute(responseId: number, params: { coachId?: number } = {}): Promise<Record<string, unknown>> {
        const record = await this.ports.responses.findById(responseId);
        if (!record) {
            throw new ResponseRecordNotFoundError();
        }

        if (params.coachId !== undefined) {
            if (record.campaignId === null || record.campaignId === undefined) {
                throw new ResponseRecordNotFoundError();
            }
            const campaign = await this.ports.campaigns.findById(record.campaignId);
            if (!campaign || campaign.coachId !== params.coachId) {
                throw new ResponseRecordNotFoundError();
            }
        }

        const catalog = getQuestionnaireEntry(record.questionnaireId);
        if (catalog) {
            return responseWithCatalogToJson(record, catalog);
        }
        return {
            ...responseBaseJson(record),
            result_dims: [],
            score_labels: {},
            short_labels: {},
        };
    }
}
