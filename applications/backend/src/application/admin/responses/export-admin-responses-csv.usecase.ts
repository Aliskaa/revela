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

import { AdminInvalidQuestionnaireError } from '@src/domain/admin/admin.errors';
import type { IResponsesExportPort } from '@src/interfaces/responses/IResponsesRepository.port';

import { formatFrenchDateTime } from '@aor/utils';
import type { AdminCsvExport } from './admin-csv-export';

export class ExportAdminResponsesCsvUseCase {
    public constructor(private readonly ports: { readonly responses: IResponsesExportPort }) {}

    public async execute(qid: string): Promise<AdminCsvExport> {
        if (!qid || !QUESTIONNAIRE_CATALOG[qid]) {
            throw new AdminInvalidQuestionnaireError('Questionnaire invalide. Paramètre ?qid= requis.');
        }
        const q = QUESTIONNAIRE_CATALOG[qid];
        const scoreKeys = Object.keys(q.score_labels).sort((a, b) => Number(a) - Number(b));
        const list = await this.ports.responses.listAllForQuestionnaire(qid);

        const header = ['id', 'nom', 'email', 'organisation', 'date'].concat(
            scoreKeys.map(k => q.score_labels[k] ?? k)
        );
        const csvLines = [header.join(';')];
        for (const r of list) {
            const scoresMap = Object.fromEntries(r.scores.map(s => [String(s.scoreKey), String(s.value)]));
            const row = [
                String(r.id),
                r.name,
                r.email,
                r.organisation ?? '',
                r.submittedAt ? formatFrenchDateTime(r.submittedAt) : '',
            ].concat(scoreKeys.map(k => scoresMap[k] ?? ''));
            csvLines.push(row.join(';'));
        }
        const body = `\ufeff${csvLines.join('\n')}`;
        return { body, filename: `responses_${qid}.csv` };
    }
}
