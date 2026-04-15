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

import { AdminConfirmationRequiredError, AdminResourceNotFoundError } from '@src/domain/admin/admin.errors';
import type { IResponsesWriterPort } from '@src/interfaces/responses/IResponsesRepository.port';

export class DeleteAdminResponseUseCase {
    public constructor(private readonly ports: { readonly responses: IResponsesWriterPort }) {}

    public async execute(
        responseId: number,
        confirm: boolean | undefined
    ): Promise<{
        message: string;
        deleted_response_id: number;
    }> {
        if (confirm !== true) {
            throw new AdminConfirmationRequiredError();
        }
        const ok = await this.ports.responses.deleteById(responseId);
        if (!ok) {
            throw new AdminResourceNotFoundError();
        }
        return {
            message: 'Réponse et scores associés supprimés définitivement.',
            deleted_response_id: responseId,
        };
    }
}
