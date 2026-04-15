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

import { Injectable } from '@nestjs/common';
import { createTransport } from 'nodemailer';

import type { IMailPort } from '@src/interfaces/invitations/IMail.port';

@Injectable()
export class NodemailerMailAdapter implements IMailPort {
    public isConfigured(): boolean {
        return Boolean(process.env.MAIL_SERVER && process.env.MAIL_FROM);
    }

    public async sendInviteEmail(params: {
        toEmail: string;
        inviteUrl: string;
        questionnaireTitle: string;
        participantName: string;
    }): Promise<void> {
        const serverHost = process.env.MAIL_SERVER;
        const fromAddr = process.env.MAIL_FROM;
        if (!serverHost || !fromAddr) {
            throw new Error('SMTP non configuré (MAIL_SERVER / MAIL_FROM manquants).');
        }

        const port = Number(process.env.MAIL_PORT ?? 587);
        const useTls = (process.env.MAIL_USE_TLS ?? 'true') !== 'false';
        const user = process.env.MAIL_USERNAME ?? '';
        const password = process.env.MAIL_PASSWORD ?? '';

        const transporter = createTransport({
            host: serverHost,
            port,
            secure: port === 465,
            requireTLS: useTls,
            auth: user ? { user, pass: password } : undefined,
        });

        const subject = `Invitation — ${params.questionnaireTitle}`;
        const textBody = `Bonjour ${params.participantName},\n\nVous êtes invité·e à répondre au questionnaire suivant : ${params.questionnaireTitle}.\n\nAccédez au formulaire via ce lien (unique) :\n${params.inviteUrl}\n\n— L'équipe`;

        const htmlBody = `<p>Bonjour ${params.participantName},</p><p>Vous êtes invité·e à répondre au questionnaire <strong>${params.questionnaireTitle}</strong>.</p><p><a href="${params.inviteUrl}">Ouvrir le questionnaire</a></p><p style="color:#666;font-size:0.9em">Si le lien ne fonctionne pas, copiez-collez cette adresse dans votre navigateur :<br/>${params.inviteUrl}</p>`;

        await transporter.sendMail({
            from: fromAddr,
            to: params.toEmail,
            subject,
            text: textBody,
            html: htmlBody,
        });
    }
}
