// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { ParticipantAdminListItem } from '@src/interfaces/participants/IParticipantsRepository.port';
import type { IParticipantsAdminReadPort } from '@src/interfaces/participants/IParticipantsRepository.port';

export class ListAdminParticipantsUseCase {
    public constructor(private readonly ports: { readonly participants: IParticipantsAdminReadPort }) {}

    public async execute(params: {
        page: number;
        perPage: number;
        companyId?: number;
    }): Promise<{
        items: ParticipantAdminListItem[];
        total: number;
        page: number;
        pages: number;
        perPage: number;
    }> {
        const result = await this.ports.participants.listWithCompany({
            page: params.page,
            perPage: params.perPage,
            companyId: params.companyId,
        });
        return {
            items: result.items,
            total: result.total,
            page: result.page,
            pages: result.pages,
            perPage: result.perPage,
        };
    }
}
