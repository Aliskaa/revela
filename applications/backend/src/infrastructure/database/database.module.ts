// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { DATABASE_POOL_SYMBOL, DRIZZLE_DB_SYMBOL, createDatabasePool, createDrizzleDb } from '@aor/drizzle';
import { Global, Module } from '@nestjs/common';

import { DatabaseLifecycle } from '@src/infrastructure/database/database.lifecycle';
import { DrizzleCampaignsRepository } from '@src/infrastructure/database/repositories/drizzle-campaigns.repository';
import { DrizzleCoachesRepository } from '@src/infrastructure/database/repositories/drizzle-coaches.repository';
import { DrizzleCompaniesRepository } from '@src/infrastructure/database/repositories/drizzle-companies.repository';
import { DrizzleInvitationsRepository } from '@src/infrastructure/database/repositories/drizzle-invitations.repository';
import { DrizzleInviteActivationRepository } from '@src/infrastructure/database/repositories/drizzle-invite-activation.repository';
import { DrizzleParticipantsRepository } from '@src/infrastructure/database/repositories/drizzle-participants.repository';
import { DrizzleResponsesRepository } from '@src/infrastructure/database/repositories/drizzle-responses.repository';
import { CAMPAIGNS_REPOSITORY_PORT_SYMBOL } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import { COACHES_REPOSITORY_PORT_SYMBOL } from '@src/interfaces/coaches/ICoachesRepository.port';
import { COMPANIES_REPOSITORY_PORT_SYMBOL } from '@src/interfaces/companies/ICompaniesRepository.port';
import { INVITATIONS_REPOSITORY_PORT_SYMBOL } from '@src/interfaces/invitations/IInvitationsRepository.port';
import { INVITE_ACTIVATION_WRITE_PORT_SYMBOL } from '@src/interfaces/invitations/IInviteActivationWrite.port';
import { PARTICIPANTS_REPOSITORY_PORT_SYMBOL } from '@src/interfaces/participants/IParticipantsRepository.port';
import { RESPONSES_REPOSITORY_PORT_SYMBOL } from '@src/interfaces/responses/IResponsesRepository.port';

@Global()
@Module({
    providers: [
        { provide: DATABASE_POOL_SYMBOL, useFactory: createDatabasePool },
        {
            provide: DRIZZLE_DB_SYMBOL,
            useFactory: createDrizzleDb,
            inject: [DATABASE_POOL_SYMBOL],
        },
        DatabaseLifecycle,
        DrizzleCompaniesRepository,
        DrizzleCampaignsRepository,
        DrizzleCoachesRepository,
        DrizzleInvitationsRepository,
        DrizzleInviteActivationRepository,
        DrizzleParticipantsRepository,
        DrizzleResponsesRepository,
        {
            provide: COMPANIES_REPOSITORY_PORT_SYMBOL,
            useExisting: DrizzleCompaniesRepository,
        },
        {
            provide: CAMPAIGNS_REPOSITORY_PORT_SYMBOL,
            useExisting: DrizzleCampaignsRepository,
        },
        {
            provide: COACHES_REPOSITORY_PORT_SYMBOL,
            useExisting: DrizzleCoachesRepository,
        },
        {
            provide: INVITATIONS_REPOSITORY_PORT_SYMBOL,
            useExisting: DrizzleInvitationsRepository,
        },
        {
            provide: INVITE_ACTIVATION_WRITE_PORT_SYMBOL,
            useExisting: DrizzleInviteActivationRepository,
        },
        {
            provide: PARTICIPANTS_REPOSITORY_PORT_SYMBOL,
            useExisting: DrizzleParticipantsRepository,
        },
        {
            provide: RESPONSES_REPOSITORY_PORT_SYMBOL,
            useExisting: DrizzleResponsesRepository,
        },
    ],
    exports: [
        DRIZZLE_DB_SYMBOL,
        DATABASE_POOL_SYMBOL,
        COMPANIES_REPOSITORY_PORT_SYMBOL,
        CAMPAIGNS_REPOSITORY_PORT_SYMBOL,
        COACHES_REPOSITORY_PORT_SYMBOL,
        INVITATIONS_REPOSITORY_PORT_SYMBOL,
        INVITE_ACTIVATION_WRITE_PORT_SYMBOL,
        PARTICIPANTS_REPOSITORY_PORT_SYMBOL,
        RESPONSES_REPOSITORY_PORT_SYMBOL,
        DrizzleCompaniesRepository,
        DrizzleCampaignsRepository,
        DrizzleCoachesRepository,
        DrizzleInvitationsRepository,
        DrizzleInviteActivationRepository,
        DrizzleParticipantsRepository,
        DrizzleResponsesRepository,
    ],
})
export class DatabaseModule {}
