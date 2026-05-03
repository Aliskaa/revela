// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Module } from '@nestjs/common';

import { type IPasswordHasherPort, PASSWORD_HASHER_PORT_SYMBOL } from '@aor/ports';
import { CreateAdminCoachUseCase } from '@src/application/admin/coaches/create-admin-coach.usecase';
import { DeleteAdminCoachUseCase } from '@src/application/admin/coaches/delete-admin-coach.usecase';
import { EnsureAdminCoachService } from '@src/application/admin/coaches/ensure-admin-coach.service';
import { GetAdminCoachDetailUseCase } from '@src/application/admin/coaches/get-admin-coach-detail.usecase';
import { ListAdminCoachesUseCase } from '@src/application/admin/coaches/list-admin-coaches.usecase';
import { UpdateAdminCoachUseCase } from '@src/application/admin/coaches/update-admin-coach.usecase';
import { ADMIN_AUTH_CONFIG_PORT_SYMBOL, type IAdminAuthConfigPort } from '@src/interfaces/admin/IAdminAuthConfig.port';
import {
    CAMPAIGNS_REPOSITORY_PORT_SYMBOL,
    type ICampaignsReadPort,
    type ICampaignsWritePort,
} from '@src/interfaces/campaigns/ICampaignsRepository.port';
import {
    COACHES_REPOSITORY_PORT_SYMBOL,
    type ICoachesReadPort,
    type ICoachesWritePort,
} from '@src/interfaces/coaches/ICoachesRepository.port';

import { AdminCoachesController } from './admin-coaches.controller';
import { AdminSharedModule } from './admin-shared.module';
import {
    CREATE_ADMIN_COACH_USE_CASE_SYMBOL,
    DELETE_ADMIN_COACH_USE_CASE_SYMBOL,
    GET_ADMIN_COACH_DETAIL_USE_CASE_SYMBOL,
    LIST_ADMIN_COACHES_USE_CASE_SYMBOL,
    UPDATE_ADMIN_COACH_USE_CASE_SYMBOL,
} from './admin.tokens';

@Module({
    imports: [AdminSharedModule],
    controllers: [AdminCoachesController],
    providers: [
        EnsureAdminCoachService,
        {
            provide: LIST_ADMIN_COACHES_USE_CASE_SYMBOL,
            useFactory: (coaches: ICoachesReadPort) => new ListAdminCoachesUseCase({ coaches }),
            inject: [COACHES_REPOSITORY_PORT_SYMBOL],
        },
        {
            provide: CREATE_ADMIN_COACH_USE_CASE_SYMBOL,
            useFactory: (
                coaches: ICoachesReadPort & ICoachesWritePort,
                passwordHasher: IPasswordHasherPort,
                authConfig: IAdminAuthConfigPort
            ) => new CreateAdminCoachUseCase({ coaches, passwordHasher, authConfig }),
            inject: [COACHES_REPOSITORY_PORT_SYMBOL, PASSWORD_HASHER_PORT_SYMBOL, ADMIN_AUTH_CONFIG_PORT_SYMBOL],
        },
        {
            provide: GET_ADMIN_COACH_DETAIL_USE_CASE_SYMBOL,
            useFactory: (coaches: ICoachesReadPort, campaigns: ICampaignsReadPort) =>
                new GetAdminCoachDetailUseCase({ coaches, campaigns }),
            inject: [COACHES_REPOSITORY_PORT_SYMBOL, CAMPAIGNS_REPOSITORY_PORT_SYMBOL],
        },
        {
            provide: UPDATE_ADMIN_COACH_USE_CASE_SYMBOL,
            useFactory: (
                coaches: ICoachesReadPort & ICoachesWritePort,
                passwordHasher: IPasswordHasherPort,
                authConfig: IAdminAuthConfigPort
            ) => new UpdateAdminCoachUseCase({ coaches, passwordHasher, authConfig }),
            inject: [COACHES_REPOSITORY_PORT_SYMBOL, PASSWORD_HASHER_PORT_SYMBOL, ADMIN_AUTH_CONFIG_PORT_SYMBOL],
        },
        {
            provide: DELETE_ADMIN_COACH_USE_CASE_SYMBOL,
            useFactory: (
                coaches: ICoachesReadPort & ICoachesWritePort,
                campaigns: ICampaignsWritePort,
                authConfig: IAdminAuthConfigPort
            ) => new DeleteAdminCoachUseCase({ coaches, campaigns, authConfig }),
            inject: [COACHES_REPOSITORY_PORT_SYMBOL, CAMPAIGNS_REPOSITORY_PORT_SYMBOL, ADMIN_AUTH_CONFIG_PORT_SYMBOL],
        },
    ],
})
export class AdminCoachesModule {}
