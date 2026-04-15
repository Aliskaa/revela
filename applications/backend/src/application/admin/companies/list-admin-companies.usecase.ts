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

import type { ICompaniesReadPort } from '@src/interfaces/companies/ICompaniesRepository.port';

export class ListAdminCompaniesUseCase {
    public constructor(private readonly ports: { readonly companies: ICompaniesReadPort }) {}

    public async execute() {
        return this.ports.companies.listOrderedWithParticipantCount();
    }
}
