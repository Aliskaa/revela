// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

/**
 * Expose un endpoint de sante minimal pour valider le runtime.
 */
@ApiTags('health')
@Controller('health')
export class AppController {
    @Get()
    @ApiOperation({ summary: 'Healthcheck — retourne `{ status: "ok" }` si le runtime répond.' })
    public getHealth(): { status: 'ok' } {
        return { status: 'ok' };
    }
}
