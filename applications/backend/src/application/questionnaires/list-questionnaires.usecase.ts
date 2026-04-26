// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { listQuestionnairesSummaryForUserApp } from '@aor/questionnaires';

export class ListQuestionnairesUseCase {
    public execute(): ReturnType<typeof listQuestionnairesSummaryForUserApp> {
        return listQuestionnairesSummaryForUserApp();
    }
}
