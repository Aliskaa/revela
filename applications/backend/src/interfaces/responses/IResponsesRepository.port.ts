// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { Response } from '@src/domain/responses';
import type { Paginated } from '@src/shared/pagination';

import type { ResponseSubmissionKind as SubmissionKind } from '@aor/types';
export type { SubmissionKind };
/** @deprecated Préférer `ResponseScore` importé depuis `@src/domain/responses`. */
export type { ResponseScore as ResponseScoreRecord } from '@src/domain/responses';

export const RESPONSES_REPOSITORY_PORT_SYMBOL = Symbol('RESPONSES_REPOSITORY_PORT_SYMBOL');

/** Paramètres cross-entité de `create` : marquage atomique d'un jeton d'invite comme utilisé. */
export type CreateResponseOptions = {
    /** Si défini, met à jour `used_at` du jeton dans la même transaction que la réponse. */
    markInviteTokenUsedId?: number;
};

export type ListResponsesParams = {
    questionnaireId?: string;
    campaignId?: number;
    page: number;
    perPage: number;
};

export interface IResponsesRecordReaderPort {
    findById(id: number): Promise<Response | null>;
}

export interface IResponsesWriterPort {
    /** Persiste une nouvelle réponse. Les réponses étant immuables par nature métier, il n'y a pas de `save`. */
    create(response: Response, options?: CreateResponseOptions): Promise<Response>;
    deleteById(id: number): Promise<boolean>;
}

export interface IResponsesSubmissionReaderPort {
    /** Réponses d'un sujet sur un questionnaire (optionnellement filtrées par campagne), plus récent d'abord. */
    listForSubjectQuestionnaireMatrix(
        subjectParticipantId: number,
        questionnaireId: string,
        campaignId?: number
    ): Promise<Response[]>;
}

export interface IResponsesAdminListPort {
    list(params: ListResponsesParams): Promise<Paginated<Response>>;
}

export interface IResponsesExportPort {
    listAllForQuestionnaire(questionnaireId: string): Promise<Response[]>;
    listAnonymizedForCompany(questionnaireId: string, companyId: number): Promise<Response[]>;
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

/** @deprecated Préférer l'entité `Response` importée depuis `@src/domain/responses`. */
export type { Response as ResponseRecord } from '@src/domain/responses';
