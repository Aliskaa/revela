// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { isQuestionnaireUserFacing } from '@aor/questionnaires';

import { AdminResourceNotFoundError, AdminValidationError } from '@src/domain/admin/admin.errors';
import { Campaign } from '@src/domain/campaigns';
import type { ICampaignsReadPort, ICampaignsWritePort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type { ICoachesReadPort } from '@src/interfaces/coaches/ICoachesRepository.port';
import type { ICompaniesReadPort } from '@src/interfaces/companies/ICompaniesRepository.port';

export class CreateAdminCampaignUseCase {
    public constructor(
        private readonly ports: {
            readonly campaigns: ICampaignsReadPort & ICampaignsWritePort;
            readonly companies: ICompaniesReadPort;
            readonly coaches: ICoachesReadPort;
        }
    ) {}

    public async execute(body: {
        coach_id?: number;
        company_id?: number;
        name?: string;
        questionnaire_id?: string;
        starts_at?: string | null;
        ends_at?: string | null;
        allow_test_without_manual_inputs?: boolean;
        status?: 'draft' | 'active' | 'closed' | 'archived';
    }): Promise<Campaign> {
        const coachId = body.coach_id;
        if (!Number.isFinite(coachId) || (coachId as number) <= 0) {
            throw new AdminValidationError('coach_id invalide.');
        }
        const coach = await this.ports.coaches.findById(coachId as number);
        if (!coach || !coach.isActive) {
            throw new AdminResourceNotFoundError('Coach introuvable.');
        }

        const companyId = body.company_id;
        if (!Number.isFinite(companyId) || (companyId as number) <= 0) {
            throw new AdminValidationError('company_id invalide.');
        }
        const company = await this.ports.companies.findById(companyId as number);
        if (!company) {
            throw new AdminResourceNotFoundError('Entreprise introuvable.');
        }

        const name = (body.name ?? '').trim();
        const existing = name.length >= 3 ? await this.ports.campaigns.findByCompanyAndName(company.id, name) : null;
        if (existing) {
            throw new AdminValidationError('Une campagne avec ce nom existe déjà pour cette entreprise.');
        }

        const questionnaireId = (body.questionnaire_id ?? '').trim().toUpperCase();
        if (!isQuestionnaireUserFacing(questionnaireId)) {
            throw new AdminValidationError('questionnaire_id invalide.');
        }

        const startsAt = body.starts_at ? new Date(body.starts_at) : null;
        if (startsAt && Number.isNaN(startsAt.getTime())) {
            throw new AdminValidationError('starts_at invalide.');
        }
        const endsAt = body.ends_at ? new Date(body.ends_at) : null;
        if (endsAt && Number.isNaN(endsAt.getTime())) {
            throw new AdminValidationError('ends_at invalide.');
        }

        const draft = Campaign.create({
            coachId: coach.id,
            companyId: company.id,
            name,
            questionnaireId,
            status: body.status ?? 'draft',
            allowTestWithoutManualInputs: Boolean(body.allow_test_without_manual_inputs),
            startsAt,
            endsAt,
        });

        return this.ports.campaigns.create(draft);
    }
}
