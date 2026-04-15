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

import { Controller, Get } from '@nestjs/common';

/**
 * Expose un endpoint de sante minimal pour valider le runtime.
 */
@Controller('health')
export class AppController {
    /**
     * Retourne un statut simple de disponibilite.
     */
    @Get()
    public getHealth(): { status: 'ok' } {
        return { status: 'ok' };
    }
}
