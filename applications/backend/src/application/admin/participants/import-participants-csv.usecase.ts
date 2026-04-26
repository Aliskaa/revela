// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { randomBytes } from 'node:crypto';

import { getQuestionnaireEntry, isQuestionnaireUserFacing } from '@aor/questionnaires';

import { AdminCsvFileRequiredError } from '@src/domain/admin/admin.errors';
import { Company } from '@src/domain/companies';
import { Invitation } from '@src/domain/invitations';
import { Participant } from '@src/domain/participants';
import type { ICompaniesReadPort, ICompaniesWritePort } from '@src/interfaces/companies/ICompaniesRepository.port';
import type { IInvitationsWritePort } from '@src/interfaces/invitations/IInvitationsRepository.port';
import type {
    IParticipantsIdentityReaderPort,
    IParticipantsWriterPort,
    ParticipantFunctionLevel,
} from '@src/interfaces/participants/IParticipantsRepository.port';

import { parseSemicolonCsv } from '@aor/utils';

const VALID_FUNCTION_LEVELS = new Set<string>(['direction', 'middle_management', 'frontline_manager']);

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
                const organisation = (row.organisation ?? '').trim() || null;
                const direction = (row.direction ?? '').trim() || null;
                const service = (row.service ?? '').trim() || null;
                const rawFunctionLevel = (row.function_level ?? '').trim().toLowerCase();
                const functionLevel: ParticipantFunctionLevel | null = VALID_FUNCTION_LEVELS.has(rawFunctionLevel)
                    ? (rawFunctionLevel as ParticipantFunctionLevel)
                    : null;

                if (!firstName || !lastName || !email) {
                    errors.push(`Ligne ${String(line)} : prénom, nom et email requis.`);
                    continue;
                }

                let companyId: number | null = null;
                if (companyName) {
                    let company = await this.ports.companies.findByName(companyName);
                    if (!company) {
                        company = await this.ports.companies.create(Company.create({ name: companyName }));
                    }
                    companyId = company.id;
                }

                let participant = await this.ports.participants.findByEmail(email);
                if (!participant) {
                    participant = await this.ports.participants.create(
                        Participant.create({
                            firstName,
                            lastName,
                            email,
                            companyId: companyId,
                        })
                    );
                    created += 1;
                } else {
                    const reassigned = participant.setCompanyId(companyId);
                    const saved = await this.ports.participants.save(reassigned);
                    if (saved) {
                        participant = saved;
                    }
                    updated += 1;
                }

                const hasProfileData = organisation || direction || service || functionLevel;
                if (hasProfileData) {
                    const withProfile = participant.updateProfile({
                        ...(organisation !== null && { organisation }),
                        ...(direction !== null && { direction }),
                        ...(service !== null && { service }),
                        ...(functionLevel !== null && { functionLevel }),
                    });
                    const saved = await this.ports.participants.save(withProfile);
                    if (saved) {
                        participant = saved;
                    }
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
                        await this.ports.invitations.create(
                            Invitation.create({
                                token,
                                participantId: participant.id,
                                questionnaireId: qid,
                                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                            })
                        );
                    }
                }
            } catch (exc) {
                errors.push(`Ligne ${String(line)} : ${exc instanceof Error ? exc.message : String(exc)}`);
            }
        }

        return { created, updated, errors };
    }
}
