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

import type { IScorePersistencePort, SaveScoringResultCommand } from '@aor/ports';

export class NoopScorePersistenceAdapter implements IScorePersistencePort {
    public save(_command: SaveScoringResultCommand): void {
        // Adapter no-op temporaire en attendant la persistance complète response+scores.
    }
}
