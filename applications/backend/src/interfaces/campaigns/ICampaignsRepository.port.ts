// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { Campaign } from '@src/domain/campaigns';

export type { CampaignStatus } from '@src/domain/campaigns';

export const CAMPAIGNS_REPOSITORY_PORT_SYMBOL = Symbol('CAMPAIGNS_REPOSITORY_PORT_SYMBOL');

export interface ICampaignsReadPort {
    listAll(params?: { coachId?: number }): Promise<Campaign[]>;
    findById(id: number, params?: { coachId?: number }): Promise<Campaign | null>;
    findByCompanyAndName(companyId: number, name: string): Promise<Campaign | null>;
}

export interface ICampaignsWritePort {
    /** Persiste une nouvelle entité et retourne l'entité hydratée avec id + createdAt. */
    create(campaign: Campaign): Promise<Campaign>;
    /** Persiste les changements d'une entité existante. Retourne `null` si l'id n'existe pas. */
    save(campaign: Campaign): Promise<Campaign | null>;
    /**
     * Bulk-réassigne toutes les campagnes d'un coach vers un autre coach. Retourne le nombre de
     * campagnes affectées. Utilisé lors de la suppression d'un coach pour basculer ses
     * campagnes vers le compte admin sentinelle.
     */
    reassignAllByCoach(fromCoachId: number, toCoachId: number): Promise<number>;
}

export interface ICampaignsRepositoryPort extends ICampaignsReadPort, ICampaignsWritePort {}
