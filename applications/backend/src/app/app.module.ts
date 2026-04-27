// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Module } from '@nestjs/common';

import { DatabaseModule } from '@src/infrastructure/database/database.module';
import { AdminModule } from '@src/presentation/admin/admin.module';
import { InvitationsPublicModule } from '@src/presentation/invitations/Invitations-public.module';
import { ParticipantModule } from '@src/presentation/participant-session/participant.module';
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
