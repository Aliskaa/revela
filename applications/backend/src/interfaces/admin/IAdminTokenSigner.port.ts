// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

export const ADMIN_TOKEN_SIGNER_PORT_SYMBOL = Symbol('ADMIN_TOKEN_SIGNER_PORT_SYMBOL');

export interface IAdminTokenSignerPort {
    sign(payload: { sub: string; role: 'admin'; scope: 'super-admin' | 'coach'; coachId?: number }): string;
}
