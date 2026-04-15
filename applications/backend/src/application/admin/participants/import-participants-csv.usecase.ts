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

import { randomBytes } from 'node:crypto';

import { getQuestionnaireEntry, isQuestionnaireUserFacing } from '@aor/questionnaires';

import { AdminCsvFileRequiredError } from '@src/domain/admin/admin.errors';
import type { ICompaniesReadPort, ICompaniesWritePort } from '@src/interfaces/companies/ICompaniesRepository.port';
import type { IInvitationsWritePort } from '@src/interfaces/invitations/IInvitationsRepository.port';
import type { IParticipantsIdentityReaderPort, IParticipantsWriterPort } from '@src/interfaces/participants/IParticipantsRepository.port';

import { parseSemicolonCsv } from '@aor/utils';

export class ImportParticipantsCsvUseCase {
    public constructor(
        private readonly ports: {
            readonly companies: ICompaniesReadPort & ICompaniesWritePort;
            readonly participants: IParticipantsIdentityReaderPort & IParticipantsWriterPort;
            readonly invitations: IInvitationsWritePort;
        }
    ) {}

    public async execute(buffer: Buffer | undefined): Promise<{
        created: number;
        updated: number;
        errors: string[];
    }> {
        if (!buffer) {
            throw new AdminCsvFileRequiredError();
        }
        const rows = parseSemicolonCsv(buffer);
        let created = 0;
        let updated = 0;
        const errors: string[] = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const line = i + 2;
            try {
                const companyName = (row.company_name ?? '').trim();
                const firstName = (row.first_name ?? '').trim();
                const lastName = (row.last_name ?? '').trim();
                const email = (row.email ?? '').trim().toLowerCase();
                const qid = (row.questionnaire_type ?? '').trim().toUpperCase();

                if (!firstName || !lastName || !email) {
                    errors.push(`Ligne ${String(line)} : prénom, nom et email requis.`);
                    continue;
                }

                let companyId: number | null = null;
                if (companyName) {
                    let company = await this.ports.companies.findByName(companyName);
                    if (!company) {
                        company = await this.ports.companies.create({ name: companyName });
                    }
                    companyId = company.id;
                }

                let participant = await this.ports.participants.findByEmail(email);
                if (!participant) {
                    participant = await this.ports.participants.create({
                        firstName,
                        lastName,
                        email,
                        companyId: companyId ?? undefined,
                    });
                    created += 1;
                } else {
                    await this.ports.participants.updateCompanyId(participant.id, companyId);
                    updated += 1;
                }

                if (qid) {
                    if (!getQuestionnaireEntry(qid)) {
                        errors.push(`Ligne ${String(line)} : questionnaire « ${qid} » inconnu.`);
                    } else if (!isQuestionnaireUserFacing(qid)) {
                        errors.push(
                            `Ligne ${String(line)} : questionnaire « ${qid} » non disponible pour les invitations (ignoré).`
                        );
                    } else {
                        const token = randomBytes(32).toString('base64url');
                        await this.ports.invitations.create({
                            token,
                            participantId: participant.id,
                            questionnaireId: qid,
                            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        });
                    }
                }
            } catch (exc) {
                errors.push(`Ligne ${String(line)} : ${exc instanceof Error ? exc.message : String(exc)}`);
            }
        }

        return { created, updated, errors };
    }
}
