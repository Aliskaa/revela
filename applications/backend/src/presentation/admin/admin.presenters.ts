// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { AdminDashboardSnapshot } from '@aor/domain';
import type { Campaign } from '@src/domain/campaigns';
import type { Coach } from '@src/domain/coaches';
import type { CompanyWithParticipantCountReadModel } from '@src/interfaces/companies/ICompaniesRepository.port';
import type { ParticipantAdminListItem } from '@src/interfaces/participants/IParticipantsRepository.port';

export const participantToAdminJson = (p: ParticipantAdminListItem) => ({
    id: p.id,
    first_name: p.firstName,
    last_name: p.lastName,
    full_name: `${p.firstName} ${p.lastName}`,
    email: p.email,
    company: p.company ? { id: p.company.id, name: p.company.name } : null,
    invite_status: p.inviteStatus,
    response_count: p.responseCount,
});

export const companyToAdminJson = (c: CompanyWithParticipantCountReadModel) => ({
    id: c.id,
    name: c.name,
    contact_name: c.contactName,
    contact_email: c.contactEmail,
    participant_count: c.participantCount,
});

/**
 * Sérialise un `Coach` en enveloppe publique : uniquement les champs safe explicitement listés.
 * Le `#passwordHash` (champ privé ECMAScript) n'est jamais atteignable ici.
 */
export const coachToAdminJson = (c: Coach) => ({
    id: c.id,
    username: c.username,
    displayName: c.displayName,
    isActive: c.isActive,
    createdAt: c.createdAt,
});

export const adminCoachDetailToJson = (detail: { coach: Coach; campaigns: Campaign[] }) => ({
    coach: coachToAdminJson(detail.coach),
    campaigns: detail.campaigns.map(campaignToAdminJson),
});

/** Sérialise un `Campaign` en DTO plat pour l'API admin. */
export const campaignToAdminJson = (c: Campaign) => ({
    id: c.id,
    coachId: c.coachId,
    companyId: c.companyId,
    name: c.name,
    questionnaireId: c.questionnaireId,
    status: c.status,
    allowTestWithoutManualInputs: c.allowTestWithoutManualInputs,
    startsAt: c.startsAt,
    endsAt: c.endsAt,
    createdAt: c.createdAt,
});

export const adminDashboardToJson = (snapshot: AdminDashboardSnapshot) => ({
    total_responses: snapshot.totalResponses,
    total_participants: snapshot.totalParticipants,
    total_companies: snapshot.totalCompanies,
    by_questionnaire: Object.fromEntries(
        Object.entries(snapshot.byQuestionnaire).map(([qid, v]) => [
            qid,
            {
                title: v.title,
                count: v.count,
                last_submitted_at: v.lastSubmittedAt?.toISOString() ?? null,
            },
        ])
    ),
});
