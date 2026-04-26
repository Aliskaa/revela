// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Inject, Injectable, type OnApplicationShutdown } from '@nestjs/common';

import { DATABASE_POOL_SYMBOL, type DatabasePool } from '@aor/drizzle';

@Injectable()
export class DatabaseLifecycle implements OnApplicationShutdown {
    public constructor(@Inject(DATABASE_POOL_SYMBOL) private readonly pool: DatabasePool) {}

    public async onApplicationShutdown(): Promise<void> {
        await this.pool.end();
    }
}
