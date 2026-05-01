// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { Participant, ParticipantFunctionLevel } from '@src/domain/participants';
import type { Paginated } from '@src/shared/pagination';

export type { ParticipantFunctionLevel } from '@src/domain/participants';

export const PARTICIPANTS_REPOSITORY_PORT_SYMBOL = Symbol('PARTICIPANTS_REPOSITORY_PORT_SYMBOL');

export type ParticipantInviteAssignment = {
    campaignId: number | null;
    questionnaireId: string;
};

export type CampaignParticipantInviteState = {
    invitedAt: Date | null;
    joinedAt: Date | null;
};

export type ParticipantProgressRecord = {
    campaignId: number;
    participantId: number;
    selfRatingStatus: 'locked' | 'pending' | 'completed';
    peerFeedbackStatus: 'locked' | 'pending' | 'completed';
    elementHumainStatus: 'locked' | 'pending' | 'completed';
    resultsStatus: 'locked' | 'pending' | 'completed';
};

export type ListParticipantsParams = {
    companyId?: number;
    /**
     * Si défini, ne retourne que les participants ayant rejoint au moins une campagne
     * attribuée à ce coach. Utilisé pour le scope=coach des endpoints admin (cf. ADR-008).
     */
    coachId?: number;
    page: number;
    perPage: number;
};

/** Élément de liste admin : participant enrichi avec sa société, ses invitations et le nombre de réponses. */
export type ParticipantAdminListItem = {
    id: number;
    companyId: number | null;
    firstName: string;
    lastName: string;
    email: string;
    organisation: string | null;
    direction: string | null;
    service: string | null;
    functionLevel: ParticipantFunctionLevel | null;
    createdAt: Date | null;
    company: { id: number; name: string } | null;
    readonly inviteStatus: Record<string, string>;
    readonly responseCount: number;
};

/**
 * Vue d'une affectation de campagne pour un participant — utilisée par la fiche détail
 * participant (admin/coach) pour lister les campagnes auxquelles il est rattaché.
 */
export type ParticipantCampaignAssignmentItem = {
    campaignId: number;
    campaignName: string;
    status: string;
    companyId: number | null;
    companyName: string | null;
    invitedAt: Date | null;
    joinedAt: Date | null;
};

export type CampaignParticipantProgressItem = {
    participantId: number;
    fullName: string;
    email: string;
    selfRatingStatus: 'locked' | 'pending' | 'completed';
    peerFeedbackStatus: 'locked' | 'pending' | 'completed';
    elementHumainStatus: 'locked' | 'pending' | 'completed';
    resultsStatus: 'locked' | 'pending' | 'completed';
};

/** Cible de feedback pair : participant ayant rejoint la campagne (hors spectateur). */
export type CampaignPeerChoiceItemDto = {
    participant_id: number;
    first_name: string;
    last_name: string;
    full_name: string;
};

export interface IParticipantsIdentityReaderPort {
    findByEmail(email: string): Promise<Participant | null>;
    findById(id: number): Promise<Participant | null>;
}

export interface IParticipantsInviteAssignmentsReaderPort {
    listQuestionnaireIdsFromInvitesForParticipant(participantId: number): Promise<string[]>;
    listInviteAssignmentsForParticipant(participantId: number): Promise<ParticipantInviteAssignment[]>;
    listCampaignIdsWithConfirmedParticipation(participantId: number): Promise<number[]>;
    getLatestInviteAssignmentForParticipant(participantId: number): Promise<ParticipantInviteAssignment | null>;
}

export interface IParticipantsCampaignParticipationWriterPort {
    ensureCampaignParticipantInvited(campaignId: number, participantId: number): Promise<void>;
    confirmCampaignParticipantParticipation(campaignId: number, participantId: number): Promise<void>;
}

export interface IParticipantsCampaignStateReaderPort {
    getCampaignParticipantInviteState(
        campaignId: number,
        participantId: number
    ): Promise<CampaignParticipantInviteState | null>;
    findProgressForCampaignParticipant(
        campaignId: number,
        participantId: number
    ): Promise<ParticipantProgressRecord | null>;
    listJoinedCampaignPeerChoices(
        campaignId: number,
        exceptParticipantId: number
    ): Promise<CampaignPeerChoiceItemDto[]>;
}

export interface IParticipantsWriterPort {
    /** Persiste une nouvelle entité et retourne l'entité hydratée avec id + createdAt de la DB. */
    create(participant: Participant): Promise<Participant>;
    /** Persiste les changements d'une entité existante. Retourne `null` si l'id n'existe pas. */
    save(participant: Participant): Promise<Participant | null>;
    /**
     * Effacement RGPD : supprime réponses (+ scores), jetons, puis participant.
     * Retourne les compteurs ou `null` si le participant n'existait pas.
     */
    eraseParticipantRgpd(id: number): Promise<{ responsesRemoved: number; inviteTokensRemoved: number } | null>;
}

export interface IParticipantsAdminReadPort {
    listWithCompany(params: ListParticipantsParams): Promise<Paginated<ParticipantAdminListItem>>;
    listByCompanyId(companyId: number): Promise<Participant[]>;
    listCampaignParticipantProgress(campaignId: number): Promise<CampaignParticipantProgressItem[]>;
    /**
     * Variante enrichie de `findById` : inclut company name, invite_status, response_count.
     * Si `coachId` est fourni, retourne `null` si le participant n'a aucune campagne attribuée
     * à ce coach (filtrage scope=coach, ADR-008).
     */
    findByIdEnriched(id: number, params: { coachId?: number }): Promise<ParticipantAdminListItem | null>;
    /**
     * Liste les campagnes auxquelles un participant est rattaché (invité ou ayant rejoint).
     * Si `coachId` est fourni, filtre aux campagnes de ce coach.
     */
    listCampaignsForParticipant(
        participantId: number,
        params: { coachId?: number }
    ): Promise<ParticipantCampaignAssignmentItem[]>;
}

export interface IParticipantsMetricsPort {
    countAll(): Promise<number>;
}

export interface IParticipantsRepositoryPort
    extends IParticipantsIdentityReaderPort,
        IParticipantsInviteAssignmentsReaderPort,
        IParticipantsCampaignParticipationWriterPort,
        IParticipantsCampaignStateReaderPort,
        IParticipantsWriterPort,
        IParticipantsAdminReadPort,
        IParticipantsMetricsPort {}
