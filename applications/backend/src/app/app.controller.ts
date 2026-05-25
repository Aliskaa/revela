// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Controller, Get, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

/**
 * Expose un endpoint de sante minimal pour valider le runtime.
 */
@ApiTags('health')
@Controller()
export class AppController {
    @Get('health')
    @ApiOperation({ summary: 'Healthcheck — retourne `{ status: "ok" }` si le runtime répond.' })
    public getHealth(): { status: 'ok' } {
        return { status: 'ok' };
    }

    /**
     * Endpoint TEMPORAIRE de debug pour vérifier que `trust proxy` est bien configuré.
     * Retourne l'IP que Express considère comme l'IP client (req.ip), la chaîne complète
     * détectée (req.ips), et les en-têtes bruts. À supprimer une fois la config validée.
     */
    @Get('debug/ip')
    @ApiOperation({ summary: 'TEMP — debug trust proxy (req.ip + headers).' })
    public getDebugIp(@Req() req: Request): {
        ip: string;
        ips: readonly string[];
        xForwardedFor: string | string[] | undefined;
        socketRemoteAddress: string | undefined;
    } {
        return {
            ip: req.ip ?? 'unknown',
            ips: req.ips,
            xForwardedFor: req.headers['x-forwarded-for'],
            socketRemoteAddress: req.socket.remoteAddress,
        };
    }
}
