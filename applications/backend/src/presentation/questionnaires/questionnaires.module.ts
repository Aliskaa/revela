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

import { GetQuestionnaireDetailUseCase } from '@src/application/questionnaires/get-questionnaire-detail.usecase';
import { ListQuestionnairesUseCase } from '@src/application/questionnaires/list-questionnaires.usecase';
import { AdminOrParticipantJwtAuthGuard } from '@src/presentation/admin-or-participant-jwt-auth.guard';

import { QuestionnairesController } from './questionnaires.controller';
import { GET_QUESTIONNAIRE_DETAIL_USE_CASE_SYMBOL, LIST_QUESTIONNAIRES_USE_CASE_SYMBOL } from './questionnaires.tokens';

@Module({
    controllers: [QuestionnairesController],
    providers: [
        AdminOrParticipantJwtAuthGuard,
        {
            provide: LIST_QUESTIONNAIRES_USE_CASE_SYMBOL,
            useFactory: () => new ListQuestionnairesUseCase(),
        },
        {
            provide: GET_QUESTIONNAIRE_DETAIL_USE_CASE_SYMBOL,
            useFactory: () => new GetQuestionnaireDetailUseCase(),
        },
    ],
})
export class QuestionnairesModule {}
