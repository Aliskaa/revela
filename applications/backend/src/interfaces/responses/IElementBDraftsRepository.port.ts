// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

export const ELEMENT_B_DRAFTS_REPOSITORY_PORT_SYMBOL = Symbol('ELEMENT_B_DRAFTS_REPOSITORY_PORT_SYMBOL');

export type ElementBDraftRecord = {
    participantId: number;
    campaignId: number;
    questionnaireId: string;
    series0: number[] | null;
    series1: number[] | null;
    lastSavedAt: Date;
};

export type UpsertElementBDraftInput = {
    participantId: number;
    campaignId: number;
    questionnaireId: string;
    /** `undefined` = ne pas toucher la valeur stockée. `null` ou tableau = écrire. */
    series0?: number[] | null;
    series1?: number[] | null;
};

export interface IElementBDraftsRepositoryPort {
    findByKey(participantId: number, campaignId: number, questionnaireId: string): Promise<ElementBDraftRecord | null>;
    upsert(input: UpsertElementBDraftInput): Promise<ElementBDraftRecord>;
    deleteByKey(participantId: number, campaignId: number, questionnaireId: string): Promise<boolean>;
}
