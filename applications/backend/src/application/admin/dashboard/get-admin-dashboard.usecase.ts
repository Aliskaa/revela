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

import { QUESTIONNAIRE_CATALOG } from '@aor/questionnaires';

import { AdminDashboardSnapshot } from '@aor/domain';
import type { ICompaniesReadPort } from '@src/interfaces/companies/ICompaniesRepository.port';
import type { IParticipantsMetricsPort } from '@src/interfaces/participants/IParticipantsRepository.port';
import type { IResponsesMetricsPort } from '@src/interfaces/responses/IResponsesRepository.port';

export class GetAdminDashboardUseCase {
    public constructor(
        private readonly ports: {
            readonly responses: IResponsesMetricsPort;
            readonly participants: IParticipantsMetricsPort;
            readonly companies: ICompaniesReadPort;
        }
    ) {}

    public async execute(): Promise<AdminDashboardSnapshot> {
        const totalResponses = await this.ports.responses.countAll();
        const companies = await this.ports.companies.listOrderedWithParticipantCount();
        const participantTotal = await this.ports.participants.countAll();

        const byQuestionnaire: Record<string, { title: string; count: number; lastSubmittedAt: Date | null }> = {};
        for (const qid of Object.keys(QUESTIONNAIRE_CATALOG)) {
            const q = QUESTIONNAIRE_CATALOG[qid];
            const count = await this.ports.responses.countByQuestionnaire(qid);
            const lastAt = await this.ports.responses.findLatestSubmittedAt(qid);
            byQuestionnaire[qid] = {
                title: q.title,
                count,
                lastSubmittedAt: lastAt ?? null,
            };
        }

        return AdminDashboardSnapshot.create({
            totalResponses,
            totalParticipants: participantTotal,
            totalCompanies: companies.length,
            byQuestionnaire,
        });
    }
}
