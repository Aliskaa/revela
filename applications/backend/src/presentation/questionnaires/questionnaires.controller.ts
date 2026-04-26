// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Controller, Get, Inject, Param, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import type { GetQuestionnaireDetailUseCase } from '@src/application/questionnaires/get-questionnaire-detail.usecase';
import type { ListQuestionnairesUseCase } from '@src/application/questionnaires/list-questionnaires.usecase';

import { AdminOrParticipantJwtAuthGuard } from '@src/presentation/admin-or-participant-jwt-auth.guard';

import { QuestionnairesExceptionFilter } from './questionnaires-exception.filter';
import { GET_QUESTIONNAIRE_DETAIL_USE_CASE_SYMBOL, LIST_QUESTIONNAIRES_USE_CASE_SYMBOL } from './questionnaires.tokens';

@ApiTags('questionnaires')
@ApiBearerAuth('jwt')
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
