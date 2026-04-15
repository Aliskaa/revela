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

import { Inject, Injectable, type OnApplicationShutdown } from '@nestjs/common';

import { DATABASE_POOL_SYMBOL, type DatabasePool } from '@aor/drizzle';

@Injectable()
export class DatabaseLifecycle implements OnApplicationShutdown {
    public constructor(@Inject(DATABASE_POOL_SYMBOL) private readonly pool: DatabasePool) {}

    public async onApplicationShutdown(): Promise<void> {
        await this.pool.end();
    }
}
