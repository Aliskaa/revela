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

export const COMPANIES_REPOSITORY_PORT_SYMBOL = Symbol('COMPANIES_REPOSITORY_PORT_SYMBOL');

export type CompanyRecord = {
    id: number;
    name: string;
    contactName: string | null;
    contactEmail: string | null;
    createdAt: Date | null;
};

export type CompanyWithParticipantCount = CompanyRecord & {
    participantCount: number;
};

export type CreateCompanyCommand = {
    name: string;
    contactName?: string;
    contactEmail?: string;
};

export type UpdateCompanyCommand = {
    name: string;
    contactName: string | null;
    contactEmail: string | null;
};

export interface ICompaniesReadPort {
    findByName(name: string): Promise<CompanyRecord | null>;
    findById(id: number): Promise<CompanyRecord | null>;
    findByIdWithParticipantCount(id: number): Promise<CompanyWithParticipantCount | null>;
    listOrderedWithParticipantCount(): Promise<CompanyWithParticipantCount[]>;
}

export interface ICompaniesWritePort {
    create(command: CreateCompanyCommand): Promise<CompanyRecord>;
    update(id: number, command: UpdateCompanyCommand): Promise<CompanyRecord | null>;
    deleteById(id: number): Promise<void>;
}

export interface ICompaniesRepositoryPort extends ICompaniesReadPort, ICompaniesWritePort {}
