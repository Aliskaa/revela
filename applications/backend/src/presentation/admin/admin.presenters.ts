// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { AdminDashboardSnapshot } from '@aor/domain';
import type { AdminParticipantDetail } from '@src/application/admin/participants/get-admin-participant-detail.usecase';
import type { Campaign } from '@src/domain/campaigns';
import type { Coach } from '@src/domain/coaches';
import type { AuditEventListItem } from '@src/interfaces/audit/IAuditEventsRepository.port';
import type { CompanyWithParticipantCountReadModel } from '@src/interfaces/companies/ICompaniesRepository.port';
import type {
    ParticipantAdminListItem,
    ParticipantCampaignAssignmentItem,
} from '@src/interfaces/participants/IParticipantsRepository.port';

/**
 * Sérialise un événement d'audit (G6 RGPD) en DTO snake_case pour l'API admin.
 * Extrait du mapping inline qui vivait dans `admin-audit.controller` (cf. ADR-009 §4).
 * `created_at` reste un `Date` : `JSON.stringify` (rendu Nest) appelle `Date#toJSON`
 * et émet la même chaîne ISO — comportement préservé à l'identique.
 */
export const auditEventToAdminJson = (e: AuditEventListItem) => ({
    id: e.id,
    actor_type: e.actorType,
    actor_id: e.actorId,
    action: e.action,
    resource_type: e.resourceType,
    resource_id: e.resourceId,
    payload: e.payload,
    ip_address: e.ipAddress,
    created_at: e.createdAt,
});

export const participantToAdminJson = (p: ParticipantAdminListItem) => ({
    id: p.id,
    first_name: p.firstName,
    last_name: p.lastName,
    full_name: `${p.firstName} ${p.lastName}`,
    email: p.email,
    company: p.company ? { id: p.company.id, name: p.company.name } : null,
    organisation: p.organisation,
    direction: p.direction,
    service: p.service,
    function_level: p.functionLevel,
    avatar_url: p.avatar_url,
    created_at: p.createdAt ? p.createdAt.toISOString() : null,
    created_by_coach_id: p.createdByCoachId,
    invite_status: p.inviteStatus,
    response_count: p.responseCount,
});

export const participantCampaignAssignmentToAdminJson = (a: ParticipantCampaignAssignmentItem) => ({
    campaign_id: a.campaignId,
    campaign_name: a.campaignName,
    status: a.status,
    company_id: a.companyId,
    company_name: a.companyName,
    invited_at: a.invitedAt ? a.invitedAt.toISOString() : null,
    joined_at: a.joinedAt ? a.joinedAt.toISOString() : null,
});

export const participantDetailToAdminJson = (detail: AdminParticipantDetail) => ({
    participant: participantToAdminJson(detail.participant),
    campaigns: detail.campaigns.map(participantCampaignAssignmentToAdminJson),
});

export const companyToAdminJson = (c: CompanyWithParticipantCountReadModel) => ({
    id: c.id,
    name: c.name,
    contact_name: c.contactName,
    contact_email: c.contactEmail,
    participant_count: c.participantCount,
    avatar_url: c.avatar_url,
});

/**
 * Sérialise un `Coach` en enveloppe publique : uniquement les champs safe explicitement listés.
 * Le `#passwordHash` (champ privé ECMAScript) n'est jamais atteignable ici.
 *
 * `isAdmin` distingue la ligne sentinelle « Admin » (cible d'assignation des campagnes
 * détenues par l'admin) du reste des coachs. Le frontend l'utilise pour désactiver
 * édition / suppression sur cette ligne.
 */
export const coachToAdminJson = (c: Coach, opts?: { isAdmin?: boolean; avatar_url?: string | null }) => ({
    id: c.id,
    username: c.username,
    displayName: c.displayName,
    isActive: c.isActive,
    avatar_url: opts?.avatar_url ?? null,
    createdAt: c.createdAt,
    isAdmin: opts?.isAdmin ?? false,
});

export const adminCoachDetailToJson = (
    detail: { coach: Coach; campaigns: Campaign[]; avatar_url: string | null },
    opts?: { isAdmin?: boolean }
) => ({
    coach: coachToAdminJson(detail.coach, { ...opts, avatar_url: detail.avatar_url }),
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
