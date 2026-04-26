// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import './load-env';
import 'reflect-metadata';

import { createConsoleLogger, resolveLogLevelFromEnv } from '@aor/logger';
import { RequestMethod } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

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

    const swaggerConfig = new DocumentBuilder()
        .setTitle('Révéla — Questionnaire Platform API')
        .setDescription(
            'API NestJS de la plateforme Révéla : authentification admin et participant, ' +
                'campagnes, coachs, entreprises, participants, invitations, réponses et scoring.'
        )
        .setVersion('0.1.0')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'JWT admin (super-admin/coach) ou participant.',
            },
            'jwt'
        )
        .addTag('admin-auth', 'Authentification admin (super-admin et coachs)')
        .addTag('admin-management', 'Tableau de bord et statut des intégrations admin')
        .addTag('admin-campaigns', 'CRUD des campagnes admin')
        .addTag('admin-coaches', 'CRUD des coachs admin')
        .addTag('admin-companies', 'CRUD des entreprises admin')
        .addTag('admin-participants', 'Gestion des participants depuis l’admin')
        .addTag('admin-responses', 'Liste, suppression et exports des réponses admin')
        .addTag('participant', 'Endpoints du parcours participant authentifié')
        .addTag('invitations', 'Activation et soumission via lien d’invitation public')
        .addTag('questionnaires', 'Catalogue des questionnaires')
        .addTag('scoring', 'Calcul de scores')
        .addTag('health', 'Healthcheck')
        .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, swaggerDocument, {
        swaggerOptions: { persistAuthorization: true },
    });

    const parsedPort = Number.parseInt(process.env.PORT ?? '', 10);
    const listenPort = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : DEFAULT_PORT;

    log.info('Écoute HTTP', { port: listenPort, healthPath: `http://127.0.0.1:${listenPort}/health` });

    await app.listen(listenPort);

    log.info('API prête', {
        baseUrl: `http://127.0.0.1:${listenPort}/api`,
        globalPrefix: 'api',
        swaggerDocsUrl: `http://127.0.0.1:${listenPort}/api/docs`,
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
