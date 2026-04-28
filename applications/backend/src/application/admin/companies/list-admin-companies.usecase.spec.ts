// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { Company } from '@src/domain/companies';
import type {
    CompanyWithParticipantCountReadModel,
    ICompaniesReadPort,
} from '@src/interfaces/companies/ICompaniesRepository.port';
import { expect, test } from 'vitest';

import { ListAdminCompaniesUseCase } from './list-admin-companies.usecase';

/**
 * Tests d'isolation scope=coach (cf. ADR-008 + docs/avancement-2026-04-28.md).
 * Vérifient que le `coachId` reçu par le use case est propagé au port repository.
 */

const buildStub = () => {
    const calls: ({ coachId?: number } | undefined)[] = [];
    const port: ICompaniesReadPort = {
        findByName: async (): Promise<Company | null> => null,
        findById: async (): Promise<Company | null> => null,
        findByIdWithParticipantCount: async () => null,
        listOrderedWithParticipantCount: async (params?: { coachId?: number }) => {
            calls.push(params);
            return [] as CompanyWithParticipantCountReadModel[];
        },
    };
    return { port, calls };
};

test('list companies forwards coachId when scope=coach', async () => {
    const { port, calls } = buildStub();
    const useCase = new ListAdminCompaniesUseCase({ companies: port });

    await useCase.execute({ coachId: 42 });

    expect(calls).toHaveLength(1);
    expect(calls[0]?.coachId).toBe(42);
});

test('list companies does not pass coachId when scope=super-admin', async () => {
    const { port, calls } = buildStub();
    const useCase = new ListAdminCompaniesUseCase({ companies: port });

    await useCase.execute();

    expect(calls).toHaveLength(1);
    expect(calls[0]?.coachId).toBeUndefined();
});
