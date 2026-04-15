export const COACHES_REPOSITORY_PORT_SYMBOL = Symbol('COACHES_REPOSITORY_PORT_SYMBOL');

export type CoachRecord = {
    id: number;
    username: string;
    password: string;
    displayName: string;
    isActive: boolean;
    createdAt: Date | null;
};

export type UpdateCoachCommand = {
    username?: string;
    password?: string;
    displayName?: string;
    isActive?: boolean;
};

export interface ICoachesReadPort {
    listAll(): Promise<CoachRecord[]>;
    findById(id: number): Promise<CoachRecord | null>;
    findByUsername(username: string): Promise<CoachRecord | null>;
}

export interface ICoachesWritePort {
    create(input: { username: string; password: string; displayName: string }): Promise<CoachRecord>;
    update(id: number, command: UpdateCoachCommand): Promise<CoachRecord | null>;
    deleteById(id: number): Promise<void>;
}

export interface ICoachesRepositoryPort extends ICoachesReadPort, ICoachesWritePort {}
