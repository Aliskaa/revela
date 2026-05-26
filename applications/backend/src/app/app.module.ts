// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Module } from '@nestjs/common';
import { ThrottlerModule, seconds } from '@nestjs/throttler';

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
 * Le `ThrottlerModule` (G8 RGPD — protection brute-force) ne s'applique plus qu'aux
 * endpoints d'authentification, qui sont les seules cibles réalistes du brute-force.
 * Les endpoints métier (dashboard, campaigns, etc.) ne sont plus throttlés : un usage
 * intensif légitime (cliente qui clique vite, plusieurs onglets) générait sinon des 429.
 *
 *  - `auth-strict` : 5 requêtes / 60s — pour `login` et `invite/activate`.
 *  - `auth-refresh` : 30 requêtes / 60s — pour `auth/refresh`, appelé en chaîne par
 *    plusieurs onglets ouverts simultanément.
 *
 * Le `ThrottlerGuard` n'est plus enregistré comme `APP_GUARD` global ; il est appliqué
 * sélectivement via `@UseGuards(ThrottlerGuard)` sur les endpoints sensibles, avec
 * `@Throttle({ 'auth-strict': ... })` ou `@Throttle({ 'auth-refresh': ... })` pour
 * choisir le throttler nommé applicable.
 *
 * `skipIf` désactive entièrement le throttle hors production pour ne pas gêner le dev
 * et les tests locaux. La protection auth reste active dès que `NODE_ENV === 'production'`.
 */
@Module({
    imports: [
        ThrottlerModule.forRoot({
            throttlers: [
                { name: 'auth-strict', limit: 5, ttl: seconds(60) },
                { name: 'auth-refresh', limit: 30, ttl: seconds(60) },
            ],
            skipIf: () => process.env.NODE_ENV !== 'production',
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
})
export class AppModule {}
