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

import type { AdminDashboardSnapshot } from '@aor/domain';
import type { CampaignRecord } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type { CoachRecord } from '@src/interfaces/coaches/ICoachesRepository.port';
import type { CompanyWithParticipantCount } from '@src/interfaces/companies/ICompaniesRepository.port';
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

export const companyToAdminJson = (c: CompanyWithParticipantCount) => ({
    id: c.id,
    name: c.name,
    contact_name: c.contactName,
    contact_email: c.contactEmail,
    participant_count: c.participantCount,
});

const coachWithoutPasswordToJson = (c: Omit<CoachRecord, 'password'>) => ({
    id: c.id,
    username: c.username,
    displayName: c.displayName,
    isActive: c.isActive,
    createdAt: c.createdAt,
});

export const adminCoachDetailToJson = (detail: {
    coach: Omit<CoachRecord, 'password'>;
    campaigns: CampaignRecord[];
}) => ({
    coach: coachWithoutPasswordToJson(detail.coach),
    campaigns: detail.campaigns,
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
