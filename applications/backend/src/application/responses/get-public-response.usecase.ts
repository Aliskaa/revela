/*
 * Copyright (c) 2026 AOR Conseil. All rights reserved.
 * Proprietary and confidential.
 * Licensed under the AOR Commercial License.
 *
 * Use, reproduction, modification, distribution, or disclosure of this
 * source code, in whole or in part, is prohibited except under a valid
 * written commercial agreement with AOR Conseil.
 *
 * See LICENSE.md for the full license terms.
 */

import { getQuestionnaireEntry } from '@aor/questionnaires';

import { ResponseRecordNotFoundError } from '@src/domain/responses/responses.errors';
import type { IResponsesRecordReaderPort } from '@src/interfaces/responses/IResponsesRepository.port';

import { responseBaseJson, responseWithCatalogToJson } from './response-serialization';

/** Returns a public response payload enriched with questionnaire metadata when available. */
export class GetPublicResponseUseCase {
    public constructor(private readonly ports: { readonly responses: IResponsesRecordReaderPort }) {}

    public async execute(responseId: number): Promise<Record<string, unknown>> {
        const record = await this.ports.responses.findById(responseId);
        if (!record) {
            throw new ResponseRecordNotFoundError();
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
