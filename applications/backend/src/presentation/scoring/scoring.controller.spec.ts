// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { RequestMethod } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { expect, test } from 'vitest';

import { ScoringModule } from './scoring.module';

test('POST /scoring/calculate returns contract-compliant payload', async () => {
    const app = await NestFactory.create(ScoringModule, { logger: false });
    app.setGlobalPrefix('api', {
        exclude: [{ path: 'health', method: RequestMethod.GET }],
    });
    await app.listen(0);

    try {
        const address = app.getHttpServer().address();
        const port = typeof address === 'string' ? 0 : (address?.port ?? 0);
        expect(port).not.toBe(0);

        const response = await fetch(`http://127.0.0.1:${port}/api/scoring/calculate`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                questionnaireId: 'B',
                series0: Array.from({ length: 54 }, () => 3),
                series1: Array.from({ length: 54 }, () => 3),
            }),
        });

        expect(response.status).toBe(201);
        const payload = (await response.json()) as {
            questionnaireId: string;
            scores: Array<{ scoreKey: number; value: number }>;
        };

        expect(payload.questionnaireId).toBe('B');
        expect(payload.scores).toHaveLength(12);
        expect(payload.scores.every(score => Number.isInteger(score.scoreKey))).toBe(true);
        expect(payload.scores.every(score => Number.isInteger(score.value))).toBe(true);
    } finally {
        await app.close();
    }
});
