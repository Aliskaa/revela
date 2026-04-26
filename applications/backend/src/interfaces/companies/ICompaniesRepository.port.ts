// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { Company } from '@src/domain/companies';

export const COMPANIES_REPOSITORY_PORT_SYMBOL = Symbol('COMPANIES_REPOSITORY_PORT_SYMBOL');

/**
 * Projection CQRS read-side : `Company` + aggregation `participantCount`. Ce n'est pas une
 * entité de domaine (pas de comportement métier) — c'est un modèle de lecture destiné aux
 * listes/détails enrichis.
 */
export type CompanyWithParticipantCountReadModel = {
    id: number;
    name: string;
    contactName: string | null;
    contactEmail: string | null;
    createdAt: Date | null;
    participantCount: number;
};

export interface ICompaniesReadPort {
    findByName(name: string): Promise<Company | null>;
    findById(id: number): Promise<Company | null>;
    findByIdWithParticipantCount(id: number): Promise<CompanyWithParticipantCountReadModel | null>;
    listOrderedWithParticipantCount(): Promise<CompanyWithParticipantCountReadModel[]>;
}

export interface ICompaniesWritePort {
    /** Persiste une nouvelle entité et retourne l'entité hydratée avec id + createdAt issus de la DB. */
    create(company: Company): Promise<Company>;
    /** Persiste les changements d'une entité existante. Retourne `null` si l'id n'existe pas. */
    save(company: Company): Promise<Company | null>;
    deleteById(id: number): Promise<void>;
}

export interface ICompaniesRepositoryPort extends ICompaniesReadPort, ICompaniesWritePort {}
