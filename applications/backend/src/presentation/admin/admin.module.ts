// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Module } from '@nestjs/common';

import { AdminAuthModule } from './admin-auth.module';
import { AdminCampaignsModule } from './admin-campaigns.module';
import { AdminCoachesModule } from './admin-coaches.module';
import { AdminCompaniesModule } from './admin-companies.module';
import { AdminManagementModule } from './admin-management.module';
import { AdminParticipantsModule } from './admin-participants.module';
import { AdminResponsesModule } from './admin-responses.module';

/**
 * Point d'entrée admin : composeur des sous-modules par feature.
 * Ne déclare aucun provider ni contrôleur — toute la plomberie vit dans les sous-modules.
 */
@Module({
    imports: [
        AdminAuthModule,
        AdminManagementModule,
        AdminCampaignsModule,
        AdminCoachesModule,
        AdminCompaniesModule,
        AdminParticipantsModule,
        AdminResponsesModule,
    ],
})
export class AdminModule {}
