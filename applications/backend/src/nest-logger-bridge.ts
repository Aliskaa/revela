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

import type { Logger } from '@aor/logger';
import type { LoggerService } from '@nestjs/common';

function joinNestParts(message: unknown, optionalParams: unknown[]): string {
    const chunks = [message, ...optionalParams].map(part => {
        if (typeof part === 'string') {
            return part;
        }
        if (part instanceof Error) {
            return part.stack ?? part.message;
        }
        try {
            return JSON.stringify(part);
        } catch {
            return String(part);
        }
    });
    return chunks.join(' ');
}

/** Adapte le {@link Logger} partagé à l'interface {@link LoggerService} de NestJS. */
export class NestLoggerBridge implements LoggerService {
    public constructor(private readonly logger: Logger) {}

    public log(message: unknown, ...optionalParams: unknown[]): void {
        this.logger.info(joinNestParts(message, optionalParams));
    }

    public error(message: unknown, ...optionalParams: unknown[]): void {
        this.logger.error(joinNestParts(message, optionalParams));
    }

    public warn(message: unknown, ...optionalParams: unknown[]): void {
        this.logger.warn(joinNestParts(message, optionalParams));
    }

    public debug(message: unknown, ...optionalParams: unknown[]): void {
        this.logger.debug(joinNestParts(message, optionalParams));
    }

    public verbose(message: unknown, ...optionalParams: unknown[]): void {
        this.logger.debug(joinNestParts(message, optionalParams));
    }
}
