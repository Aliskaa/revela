import { randomBytes } from 'node:crypto';

import {
    AdminCsvFileRequiredError,
    AdminResourceNotFoundError,
    AdminValidationError,
} from '@src/domain/admin/admin.errors';
import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type { ICompaniesReadPort } from '@src/interfaces/companies/ICompaniesRepository.port';
import type { IInvitationsWritePort } from '@src/interfaces/invitations/IInvitationsRepository.port';
import type {
    IParticipantsCampaignParticipationWriterPort,
    IParticipantsIdentityReaderPort,
    IParticipantsWriterPort,
} from '@src/interfaces/participants/IParticipantsRepository.port';

import { parseSemicolonCsv } from '@aor/utils';

export class ImportParticipantsToCampaignUseCase {
    public constructor(
        private readonly ports: {
            readonly campaigns: ICampaignsReadPort;
            readonly companies: ICompaniesReadPort;
            readonly participants: IParticipantsIdentityReaderPort &
                IParticipantsWriterPort &
                IParticipantsCampaignParticipationWriterPort;
            readonly invitations: IInvitationsWritePort;
        }
    ) {}

    public async execute(campaignId: number, buffer: Buffer | undefined) {
        if (!buffer) {
            throw new AdminCsvFileRequiredError();
        }
        const campaign = await this.ports.campaigns.findById(campaignId);
        if (!campaign) {
            throw new AdminResourceNotFoundError('Campagne introuvable.');
        }
        if (!campaign.questionnaireId) {
            throw new AdminValidationError('La campagne n’a pas de questionnaire associé.');
        }

        const company = await this.ports.companies.findById(campaign.companyId);
        if (!company) {
            throw new AdminResourceNotFoundError('Entreprise de campagne introuvable.');
        }

        const rows = parseSemicolonCsv(buffer);
        let created = 0;
        let updated = 0;
        let invited = 0;
        const errors: string[] = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const line = i + 2;
            try {
                const firstName = (row.first_name ?? '').trim();
                const lastName = (row.last_name ?? '').trim();
                const email = (row.email ?? '').trim().toLowerCase();
                if (!firstName || !lastName || !email) {
                    errors.push(`Ligne ${String(line)} : prénom, nom et email requis.`);
                    continue;
                }
                let participant = await this.ports.participants.findByEmail(email);
                if (!participant) {
                    participant = await this.ports.participants.create({
                        firstName,
                        lastName,
                        email,
                        companyId: company.id,
                    });
                    created += 1;
                } else {
                    await this.ports.participants.updateCompanyId(participant.id, company.id);
                    updated += 1;
                }
                await this.ports.invitations.create({
                    token: randomBytes(32).toString('base64url'),
                    participantId: participant.id,
                    campaignId: campaign.id,
                    questionnaireId: campaign.questionnaireId,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                });
                await this.ports.participants.ensureCampaignParticipantInvited(campaign.id, participant.id);
                invited += 1;
            } catch (exc) {
                errors.push(`Ligne ${String(line)} : ${exc instanceof Error ? exc.message : String(exc)}`);
            }
        }
        return { created, updated, invited, errors };
    }
}
