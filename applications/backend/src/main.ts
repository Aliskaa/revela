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

import 'reflect-metadata';

import { createConsoleLogger, resolveLogLevelFromEnv } from '@aor/logger';
import { RequestMethod } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from '@src/app/app.module';
import { NestLoggerBridge } from '@src/nest-logger-bridge';

/**
 * Port HTTP par défaut de l'API backend.
 */
const DEFAULT_PORT = 3000;

/**
 * Démarre l'application NestJS.
 */
const bootstrap = async (): Promise<void> => {
    const resolvedLevel = resolveLogLevelFromEnv();
    const log = createConsoleLogger({ context: 'Bootstrap', level: resolvedLevel });

    log.info('Démarrage de l’API backend', {
        nodeEnv: process.env.NODE_ENV ?? '(non défini)',
        logLevel: resolvedLevel,
        portEnv: process.env.PORT ?? `(défaut ${DEFAULT_PORT})`,
    });

    const app = await NestFactory.create(AppModule, { bufferLogs: true });
    app.useLogger(new NestLoggerBridge(createConsoleLogger({ context: 'Nest', level: resolvedLevel })));

    log.debug('Module racine chargé, configuration du préfixe HTTP');

    app.setGlobalPrefix('api', {
        exclude: [{ path: 'health', method: RequestMethod.GET }],
    });

    const parsedPort = Number.parseInt(process.env.PORT ?? '', 10);
    const listenPort = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : DEFAULT_PORT;

    log.info('Écoute HTTP', { port: listenPort, healthPath: `http://127.0.0.1:${listenPort}/health` });

    await app.listen(listenPort);

    log.info('API prête', {
        baseUrl: `http://127.0.0.1:${listenPort}/api`,
        globalPrefix: 'api',
    });
};

void bootstrap().catch((error: unknown) => {
    const log = createConsoleLogger({ context: 'Bootstrap' });
    const message = error instanceof Error ? error.message : String(error);
    log.error('Échec du démarrage', { message });
    if (error instanceof Error && error.stack) {
        log.debug('Stack', { stack: error.stack });
    }
    process.exitCode = 1;
});
