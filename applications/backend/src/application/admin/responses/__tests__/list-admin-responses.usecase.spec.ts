// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type {
    IResponsesAdminListPort,
    ListResponsesParams,
} from '@src/interfaces/responses/IResponsesRepository.port';
import { expect, test } from 'vitest';

import { ListAdminResponsesUseCase } from '../list-admin-responses.usecase';

/**
 * Tests d'isolation scope=coach (cf. ADR-008 + docs/avancement-2026-04-28.md).
 * Vérifient que le `coachId` reçu par le use case est propagé au port repository.
 */

const buildStub = () => {
    const calls: ListResponsesParams[] = [];
    const port: IResponsesAdminListPort = {
        list: async (params: ListResponsesParams) => {
            calls.push(params);
            return { items: [], total: 0, page: 1, pages: 1, perPage: params.perPage };
        },
    };
    return { port, calls };
};

test('list responses forwards coachId when scope=coach', async () => {
    const { port, calls } = buildStub();
    const useCase = new ListAdminResponsesUseCase({ responses: port });

    await useCase.execute({ page: 1, perPage: 10, coachId: 42 });

    expect(calls).toHaveLength(1);
    expect(calls[0].coachId).toBe(42);
});

test('list responses does not pass coachId when scope=super-admin', async () => {
    const { port, calls } = buildStub();
    const useCase = new ListAdminResponsesUseCase({ responses: port });

    await useCase.execute({ page: 1, perPage: 10 });

    expect(calls).toHaveLength(1);
    expect(calls[0].coachId).toBeUndefined();
});
