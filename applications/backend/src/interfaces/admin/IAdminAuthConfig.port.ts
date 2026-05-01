// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

export const ADMIN_AUTH_CONFIG_PORT_SYMBOL = Symbol('ADMIN_AUTH_CONFIG_PORT_SYMBOL');

export interface IAdminAuthConfigPort {
    readonly superAdminUsername: string;
    readonly superAdminPassword: string;
}
