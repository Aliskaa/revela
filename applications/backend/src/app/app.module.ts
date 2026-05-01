// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule, seconds } from '@nestjs/throttler';

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
 *
 * Le `ThrottlerModule` (G8 RGPD — protection brute-force) est enregistré globalement avec
 * trois niveaux nommés que les controllers peuvent invoquer via `@Throttle({ name: ... })` :
 *  - `auth-strict` : 5 requêtes / 60s — pour les endpoints `login` et `invite/activate`
 *    (objectifs habituels du brute-force credentials).
 *  - `auth-refresh` : 30 requêtes / 60s — pour `auth/refresh`, qui peut être appelé en
 *    chaîne par plusieurs onglets ouverts simultanément.
 *  - `default` : 60 requêtes / 60s — fallback large (pour ne pas pénaliser le reste).
 *
 * Le `ThrottlerGuard` est enregistré comme `APP_GUARD` global : chaque endpoint hérite
 * du throttle `default` sauf override explicite via `@Throttle()`.
 */
@Module({
    imports: [
        ThrottlerModule.forRoot({
            throttlers: [
                { name: 'default', limit: 60, ttl: seconds(60) },
                { name: 'auth-strict', limit: 5, ttl: seconds(60) },
                { name: 'auth-refresh', limit: 30, ttl: seconds(60) },
            ],
        }),
        DatabaseModule,
        AdminModule,
        ParticipantModule,
        QuestionnairesModule,
        ResponsesModule,
        InvitationsPublicModule,
        ScoringModule,
    ],
    controllers: [AppController],
    providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
