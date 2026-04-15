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

export const RESPONSES_REPOSITORY_PORT_SYMBOL = Symbol('RESPONSES_REPOSITORY_PORT_SYMBOL');
export type SubmissionKind = 'self_rating' | 'peer_rating' | 'element_humain';

export type ResponseScoreRecord = {
    scoreKey: number;
    value: number;
};

export type ResponseRecord = {
    id: number;
    participantId: number | null;
    inviteTokenId: number | null;
    questionnaireId: string;
    campaignId: number | null;
    submissionKind: SubmissionKind;
    subjectParticipantId: number | null;
    raterParticipantId: number | null;
    name: string;
    email: string;
    organisation: string | null;
    submittedAt: Date | null;
    scores: ResponseScoreRecord[];
};

export type CreateResponseCommand = {
    participantId?: number;
    inviteTokenId?: number;
    questionnaireId: string;
    campaignId?: number;
    submissionKind?: SubmissionKind;
    subjectParticipantId?: number | null;
    raterParticipantId?: number | null;
    name: string;
    email: string;
    organisation?: string;
    scores: ResponseScoreRecord[];
    /** Si défini, met à jour `used_at` du jeton dans la même transaction que la réponse. */
    markInviteTokenUsedId?: number;
};

export type UpdateResponseCommand = {
    id: number;
    name: string;
    email: string;
    organisation?: string;
    scores: ResponseScoreRecord[];
};

export type ListResponsesParams = {
    questionnaireId?: string;
    campaignId?: number;
    page: number;
    perPage: number;
};

export interface IResponsesRecordReaderPort {
    findById(id: number): Promise<ResponseRecord | null>;
}

export interface IResponsesWriterPort {
    create(command: CreateResponseCommand): Promise<ResponseRecord>;
    update(command: UpdateResponseCommand): Promise<ResponseRecord | null>;
    deleteById(id: number): Promise<boolean>;
}

export interface IResponsesSubmissionReaderPort {
    /** Responses for a subject on one questionnaire (optionally scoped to one campaign), newest first. */
    listForSubjectQuestionnaireMatrix(
        subjectParticipantId: number,
        questionnaireId: string,
        campaignId?: number
    ): Promise<ResponseRecord[]>;
}

export interface IResponsesAdminListPort {
    list(params: ListResponsesParams): Promise<Paginated<ResponseRecord>>;
}

export interface IResponsesExportPort {
    listAllForQuestionnaire(questionnaireId: string): Promise<ResponseRecord[]>;
    listAnonymizedForCompany(questionnaireId: string, companyId: number): Promise<ResponseRecord[]>;
}

export interface IResponsesMetricsPort {
    countAll(): Promise<number>;
    countByQuestionnaire(questionnaireId: string): Promise<number>;
    findLatestSubmittedAt(questionnaireId: string): Promise<Date | null>;
}

export interface IResponsesRepositoryPort
    extends IResponsesRecordReaderPort,
        IResponsesWriterPort,
        IResponsesSubmissionReaderPort,
        IResponsesAdminListPort,
        IResponsesExportPort,
        IResponsesMetricsPort {}
