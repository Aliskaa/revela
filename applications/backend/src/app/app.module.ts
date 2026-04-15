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

import { Module } from '@nestjs/common';

import { DatabaseModule } from '@src/infrastructure/database/database.module';
import { AdminModule } from '@src/presentation/admin/admin.module';
import { InvitationsPublicModule } from '@src/presentation/invitations/Invitations-public.module';
import { ParticipantModule } from '@src/presentation/participant/participant.module';
import { QuestionnairesModule } from '@src/presentation/questionnaires/questionnaires.module';
import { ResponsesModule } from '@src/presentation/responses/responses.module';
import { ScoringModule } from '@src/presentation/scoring/scoring.module';

import { AppController } from '@src/app/app.controller';

/**
 * Module racine de l'API backend NestJS.
 */
@Module({
    imports: [
        DatabaseModule,
        AdminModule,
        ParticipantModule,
        QuestionnairesModule,
        ResponsesModule,
        InvitationsPublicModule,
        ScoringModule,
    ],
    controllers: [AppController],
})
export class AppModule {}
