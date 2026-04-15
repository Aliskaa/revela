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

import { Controller, Get, Inject, Param, UseFilters, UseGuards } from '@nestjs/common';

import type { GetQuestionnaireDetailUseCase } from '@src/application/questionnaires/get-questionnaire-detail.usecase';
import type { ListQuestionnairesUseCase } from '@src/application/questionnaires/list-questionnaires.usecase';

import { AdminOrParticipantJwtAuthGuard } from '@src/presentation/admin-or-participant-jwt-auth.guard';

import { QuestionnairesExceptionFilter } from './questionnaires-exception.filter';
import { GET_QUESTIONNAIRE_DETAIL_USE_CASE_SYMBOL, LIST_QUESTIONNAIRES_USE_CASE_SYMBOL } from './questionnaires.tokens';

@Controller('questionnaires')
@UseFilters(QuestionnairesExceptionFilter)
export class QuestionnairesController {
    public constructor(
        @Inject(LIST_QUESTIONNAIRES_USE_CASE_SYMBOL)
        private readonly listQuestionnaires: ListQuestionnairesUseCase,
        @Inject(GET_QUESTIONNAIRE_DETAIL_USE_CASE_SYMBOL)
        private readonly getQuestionnaireDetail: GetQuestionnaireDetailUseCase
    ) {}

    @Get()
    @UseGuards(AdminOrParticipantJwtAuthGuard)
    public list() {
        return this.listQuestionnaires.execute();
    }

    @Get(':qid')
    public getOne(@Param('qid') qid: string) {
        return this.getQuestionnaireDetail.execute(qid);
    }
}
