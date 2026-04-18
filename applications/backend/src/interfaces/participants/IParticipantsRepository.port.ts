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

import type { Paginated } from '@src/shared/pagination';

export const PARTICIPANTS_REPOSITORY_PORT_SYMBOL = Symbol('PARTICIPANTS_REPOSITORY_PORT_SYMBOL');

export type ParticipantFunctionLevel = 'direction' | 'middle_management' | 'frontline_manager';

export type ParticipantRecord = {
    id: number;
    companyId: number | null;
    firstName: string;
    lastName: string;
    email: string;
    organisation: string | null;
    direction: string | null;
    service: string | null;
    functionLevel: ParticipantFunctionLevel | null;
    passwordHash: string | null;
    createdAt: Date | null;
};

export type UpdateParticipantProfileCommand = {
    organisation?: string | null;
    direction?: string | null;
    service?: string | null;
    functionLevel?: ParticipantFunctionLevel | null;
};

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

export type CreateParticipantCommand = {
    companyId?: number;
    firstName: string;
    lastName: string;
    email: string;
};

export type ListParticipantsParams = {
    companyId?: number;
    page: number;
    perPage: number;
};

export type ParticipantWithCompany = ParticipantRecord & {
    company: { id: number; name: string } | null;
};

/** Élément de liste admin aligné sur le `to_dict` Python (champs snake_case côté API). */
export type ParticipantAdminListItem = ParticipantWithCompany & {
    readonly inviteStatus: Record<string, string>;
    readonly responseCount: number;
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
    findByEmail(email: string): Promise<ParticipantRecord | null>;
    findById(id: number): Promise<ParticipantRecord | null>;
}

export interface IParticipantsInviteAssignmentsReaderPort {
    /**
     * Identifiants de questionnaires distincts présents sur les jetons d’invitation du participant,
     * triés par activité la plus récente par questionnaire (`max(created_at, used_at)`), décroissant.
     */
    listQuestionnaireIdsFromInvitesForParticipant(participantId: number): Promise<string[]>;
    /** Liste des assignations campagne/questionnaire dérivées des invitations (plus récentes d'abord). */
    listInviteAssignmentsForParticipant(participantId: number): Promise<ParticipantInviteAssignment[]>;
    /** Campagnes où le participant a confirmé sa participation (`joined_at` renseigné). */
    listCampaignIdsWithConfirmedParticipation(participantId: number): Promise<number[]>;
    /** Dernière affectation issue des invitations: paire campagne/questionnaire. */
    getLatestInviteAssignmentForParticipant(participantId: number): Promise<ParticipantInviteAssignment | null>;
}

export interface IParticipantsCampaignParticipationWriterPort {
    /**
     * Crée ou met à jour la ligne `campaign_participants` avec `invited_at` (sans forcer `joined_at`).
     * Appelé lorsqu’une invitation de campagne est émise.
     */
    ensureCampaignParticipantInvited(campaignId: number, participantId: number): Promise<void>;
    /** Marque la participation comme confirmée (`joined_at`) si ce n’est pas déjà le cas. */
    confirmCampaignParticipantParticipation(campaignId: number, participantId: number): Promise<void>;
}

export interface IParticipantsCampaignStateReaderPort {
    getCampaignParticipantInviteState(
        campaignId: number,
        participantId: number
    ): Promise<CampaignParticipantInviteState | null>;
    /** Progression métier du participant pour une campagne donnée, si initialisée. */
    findProgressForCampaignParticipant(
        campaignId: number,
        participantId: number
    ): Promise<ParticipantProgressRecord | null>;
    /**
     * Participants ayant confirmé leur participation (`joined_at`) à la campagne,
     * hors `exceptParticipantId`, triés par nom.
     */
    listJoinedCampaignPeerChoices(
        campaignId: number,
        exceptParticipantId: number
    ): Promise<CampaignPeerChoiceItemDto[]>;
}

export interface IParticipantsWriterPort {
    create(command: CreateParticipantCommand): Promise<ParticipantRecord>;
    updateCompanyId(participantId: number, companyId: number | null): Promise<void>;
    updateProfile(participantId: number, command: UpdateParticipantProfileCommand): Promise<void>;
    setPasswordHash(participantId: number, passwordHash: string): Promise<void>;
    deleteById(id: number): Promise<boolean>;
    /**
     * Effacement RGPD : supprime réponses (+ scores), jetons, puis participant.
     * Retourne les compteurs ou `null` si le participant n’existait pas.
     */
    eraseParticipantRgpd(id: number): Promise<{ responsesRemoved: number; inviteTokensRemoved: number } | null>;
}

export interface IParticipantsAdminReadPort {
    listWithCompany(params: ListParticipantsParams): Promise<Paginated<ParticipantAdminListItem>>;
    listByCompanyId(companyId: number): Promise<ParticipantRecord[]>;
    listCampaignParticipantProgress(campaignId: number): Promise<CampaignParticipantProgressItem[]>;
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
