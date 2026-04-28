// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { responseBaseJson } from '@src/application/responses/response-serialization';
import type { IResponsesAdminListPort } from '@src/interfaces/responses/IResponsesRepository.port';

export class ListAdminResponsesUseCase {
    public constructor(private readonly ports: { readonly responses: IResponsesAdminListPort }) {}

    public async execute(params: {
        qid?: string;
        campaignId?: number;
        coachId?: number;
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
            coachId: params.coachId,
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
