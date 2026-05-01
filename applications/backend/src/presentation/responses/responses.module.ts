// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Module } from '@nestjs/common';

import { GetPublicResponseUseCase } from '@src/application/responses/get-public-response.usecase';
import {
    CAMPAIGNS_REPOSITORY_PORT_SYMBOL,
    type ICampaignsReadPort,
} from '@src/interfaces/campaigns/ICampaignsRepository.port';
import {
    type IResponsesRecordReaderPort,
    RESPONSES_REPOSITORY_PORT_SYMBOL,
} from '@src/interfaces/responses/IResponsesRepository.port';

import { GET_PUBLIC_RESPONSE_USE_CASE_SYMBOL } from './responses.tokens';

@Module({
    providers: [
        {
            provide: GET_PUBLIC_RESPONSE_USE_CASE_SYMBOL,
            useFactory: (responses: IResponsesRecordReaderPort, campaigns: ICampaignsReadPort) =>
                new GetPublicResponseUseCase({ responses, campaigns }),
            inject: [RESPONSES_REPOSITORY_PORT_SYMBOL, CAMPAIGNS_REPOSITORY_PORT_SYMBOL],
        },
    ],
    exports: [GET_PUBLIC_RESPONSE_USE_CASE_SYMBOL],
})
export class ResponsesModule {}
