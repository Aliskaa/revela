// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Module } from '@nestjs/common';

import { GetPublicResponseUseCase } from '@src/application/responses/get-public-response.usecase';
import {
    type IResponsesRecordReaderPort,
    RESPONSES_REPOSITORY_PORT_SYMBOL,
} from '@src/interfaces/responses/IResponsesRepository.port';

import { GET_PUBLIC_RESPONSE_USE_CASE_SYMBOL } from './responses.tokens';

@Module({
    providers: [
        {
            provide: GET_PUBLIC_RESPONSE_USE_CASE_SYMBOL,
            useFactory: (responses: IResponsesRecordReaderPort) => new GetPublicResponseUseCase({ responses }),
            inject: [RESPONSES_REPOSITORY_PORT_SYMBOL],
        },
    ],
    exports: [GET_PUBLIC_RESPONSE_USE_CASE_SYMBOL],
})
export class ResponsesModule {}
