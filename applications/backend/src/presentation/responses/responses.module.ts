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
