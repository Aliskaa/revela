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

import {
    AdminCompanyIdRequiredError,
    AdminInvalidQuestionnaireError,
    AdminResourceNotFoundError,
} from '@src/domain/admin/admin.errors';
import type { ICompaniesReadPort } from '@src/interfaces/companies/ICompaniesRepository.port';
import type { IResponsesExportPort } from '@src/interfaces/responses/IResponsesRepository.port';

import { formatDateOnly } from '@aor/utils';
import type { AdminCsvExport } from './admin-csv-export';

export class ExportAdminAnonymizedResponsesCsvUseCase {
    public constructor(
        private readonly ports: {
            readonly responses: IResponsesExportPort;
            readonly companies: ICompaniesReadPort;
        }
    ) {}

    public async execute(qid: string, companyId: number): Promise<AdminCsvExport> {
        if (!qid || !QUESTIONNAIRE_CATALOG[qid]) {
            throw new AdminInvalidQuestionnaireError('Paramètre qid invalide ou manquant.');
        }
        if (!Number.isFinite(companyId)) {
            throw new AdminCompanyIdRequiredError();
        }
        const company = await this.ports.companies.findById(companyId);
        if (!company) {
            throw new AdminResourceNotFoundError();
        }
        const q = QUESTIONNAIRE_CATALOG[qid];
        const scoreKeys = Object.keys(q.score_labels).sort((a, b) => Number(a) - Number(b));
        const list = await this.ports.responses.listAnonymizedForCompany(qid, companyId);

        const header = ['ligne', 'date_soumission', 'questionnaire'].concat(scoreKeys.map(k => q.score_labels[k] ?? k));
        const csvLines = [header.join(';')];
        for (let i = 0; i < list.length; i++) {
            const r = list[i];
            const scoresMap = Object.fromEntries(r.scores.map(s => [String(s.scoreKey), String(s.value)]));
            const row = [String(i + 1), r.submittedAt ? formatDateOnly(r.submittedAt) : '', qid].concat(
                scoreKeys.map(k => scoresMap[k] ?? '')
            );
            csvLines.push(row.join(';'));
        }
        const safeName = company.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 40);
        const body = `\ufeff${csvLines.join('\n')}`;
        return { body, filename: `anonymized_${safeName}_${qid}.csv` };
    }
}
