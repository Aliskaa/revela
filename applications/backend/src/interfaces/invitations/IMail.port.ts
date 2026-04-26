// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

export const MAIL_PORT_SYMBOL = Symbol('MAIL_PORT_SYMBOL');

export interface IMailPort {
    isConfigured(): boolean;
    sendInviteEmail(params: {
        toEmail: string;
        inviteUrl: string;
        questionnaireTitle: string;
        participantName: string;
    }): Promise<void>;
}
