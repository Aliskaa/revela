// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { IMailPort } from '@src/interfaces/invitations/IMail.port';

export class GetAdminMailStatusUseCase {
    public constructor(private readonly ports: { readonly mail: IMailPort }) {}

    public execute(): { configured: boolean } {
        return Object.freeze({ configured: this.ports.mail.isConfigured() });
    }
}
