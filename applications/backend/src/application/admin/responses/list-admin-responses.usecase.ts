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

import { responseBaseJson } from '@src/application/responses/response-serialization';
import type { IResponsesAdminListPort } from '@src/interfaces/responses/IResponsesRepository.port';

export class ListAdminResponsesUseCase {
    public constructor(private readonly ports: { readonly responses: IResponsesAdminListPort }) {}

    public async execute(params: {
        qid?: string;
        campaignId?: number;
        page: number;
        perPage: number;
    }): Promise<{
        items: ReturnType<typeof responseBaseJson>[];
        total: number;
        page: number;
        pages: number;
        perPage: number;
    }> {
        const result = await this.ports.responses.list({
            questionnaireId: params.qid,
            campaignId: params.campaignId,
            page: params.page,
            perPage: params.perPage,
        });
        return {
            items: result.items.map(r => responseBaseJson(r)),
            total: result.total,
            page: result.page,
            pages: result.pages,
            perPage: result.perPage,
        };
    }
}
