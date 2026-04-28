// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type {
    IParticipantsAdminReadPort,
    ListParticipantsParams,
    ParticipantAdminListItem,
} from '@src/interfaces/participants/IParticipantsRepository.port';
import { expect, test } from 'vitest';

import { ListAdminParticipantsUseCase } from './list-admin-participants.usecase';

/**
 * Tests d'isolation scope=coach (cf. ADR-008 + docs/avancement-2026-04-28.md).
 * Vérifient que le `coachId` reçu par le use case est bien propagé au port repository
 * — c'est ce qui garantit qu'un coach ne voit que les participants de ses campagnes.
 */

const buildStub = () => {
    const calls: ListParticipantsParams[] = [];
    const port: IParticipantsAdminReadPort = {
        listWithCompany: async (params: ListParticipantsParams) => {
            calls.push(params);
            return { items: [] as ParticipantAdminListItem[], total: 0, page: 1, pages: 1, perPage: params.perPage };
        },
        listByCompanyId: async () => [],
        listCampaignParticipantProgress: async () => [],
    };
    return { port, calls };
};

test('list participants forwards coachId when scope=coach', async () => {
    const { port, calls } = buildStub();
    const useCase = new ListAdminParticipantsUseCase({ participants: port });

    await useCase.execute({ page: 1, perPage: 10, coachId: 42 });

    expect(calls).toHaveLength(1);
    expect(calls[0].coachId).toBe(42);
});

test('list participants does not pass coachId when scope=super-admin', async () => {
    const { port, calls } = buildStub();
    const useCase = new ListAdminParticipantsUseCase({ participants: port });

    await useCase.execute({ page: 1, perPage: 10 });

    expect(calls).toHaveLength(1);
    expect(calls[0].coachId).toBeUndefined();
});
