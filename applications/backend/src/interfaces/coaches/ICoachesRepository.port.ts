// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { Coach } from '@src/domain/coaches';

export const COACHES_REPOSITORY_PORT_SYMBOL = Symbol('COACHES_REPOSITORY_PORT_SYMBOL');

export interface ICoachesReadPort {
    listAll(): Promise<Coach[]>;
    findById(id: number): Promise<Coach | null>;
    findByUsername(username: string): Promise<Coach | null>;
}

export interface ICoachesWritePort {
    create(coach: Coach): Promise<Coach>;
    save(coach: Coach): Promise<Coach | null>;
    deleteById(id: number): Promise<void>;
}

export interface ICoachesRepositoryPort extends ICoachesReadPort, ICoachesWritePort {}
