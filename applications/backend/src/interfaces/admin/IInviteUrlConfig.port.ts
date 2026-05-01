// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

export const INVITE_URL_CONFIG_PORT_SYMBOL = Symbol('INVITE_URL_CONFIG_PORT_SYMBOL');

export interface IInviteUrlConfigPort {
    readonly frontendBaseUrl: string;
}
