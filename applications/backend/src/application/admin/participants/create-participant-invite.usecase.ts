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

import { randomBytes } from 'node:crypto';

import { getQuestionnaireEntry, isQuestionnaireUserFacing } from '@aor/questionnaires';

import { invitationTokenAdminStatus } from '@aor/domain';
import { AdminInvalidQuestionnaireError, AdminResourceNotFoundError } from '@src/domain/admin/admin.errors';
import type { IInviteUrlConfigPort } from '@src/interfaces/admin/IInviteUrlConfig.port';
import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type { IInvitationsWritePort } from '@src/interfaces/invitations/IInvitationsRepository.port';
import type { IMailPort } from '@src/interfaces/invitations/IMail.port';
import type {
    IParticipantsCampaignParticipationWriterPort,
    IParticipantsIdentityReaderPort,
} from '@src/interfaces/participants/IParticipantsRepository.port';

export class CreateParticipantInviteUseCase {
    public constructor(
        private readonly ports: {
            readonly participants: IParticipantsIdentityReaderPort & IParticipantsCampaignParticipationWriterPort;
            readonly campaigns: ICampaignsReadPort;
            readonly invitations: IInvitationsWritePort;
            readonly mail: IMailPort;
            readonly inviteUrlConfig: IInviteUrlConfigPort;
        }
    ) {}

    public async execute(
        participantId: number,
        body: { campaign_id?: number; questionnaire_id?: string; send_email?: boolean }
    ): Promise<{
        id: number;
        token: string;
        campaign_id: number | null;
        questionnaire_id: string;
        status: string;
        created_at: string | undefined;
        expires_at: string | null;
        used_at: string | null;
        invite_url: string;
        mail_sent: boolean;
        mail_error: string | null;
        mail_configured: boolean;
    }> {
        const participant = await this.ports.participants.findById(participantId);
        if (!participant) {
            throw new AdminResourceNotFoundError('Participant introuvable.');
        }
        const campaignId = body.campaign_id;
        if (!Number.isFinite(campaignId)) {
            throw new AdminResourceNotFoundError('Campagne obligatoire pour creer une invitation.');
        }
        const campaign = await this.ports.campaigns.findById(campaignId as number);
        if (!campaign) {
            throw new AdminResourceNotFoundError('Campagne introuvable.');
        }
        const qid = (body.questionnaire_id ?? '').toUpperCase();
        if (!isQuestionnaireUserFacing(qid)) {
            throw new AdminInvalidQuestionnaireError('Questionnaire invalide ou non proposé pour les invitations.');
        }
        if (!campaign.questionnaireId) {
            throw new AdminInvalidQuestionnaireError('Cette campagne n’a pas de questionnaire défini.');
        }
        if (campaign.questionnaireId.toUpperCase() !== qid) {
            throw new AdminInvalidQuestionnaireError(
                'Le questionnaire demandé ne correspond pas au questionnaire de la campagne.'
            );
        }
        const qMeta = getQuestionnaireEntry(qid);
        if (!qMeta) {
            throw new AdminInvalidQuestionnaireError('Questionnaire introuvable.');
        }
        const sendEmail = Boolean(body.send_email);
        const tokenStr = randomBytes(32).toString('base64url');
        const invitation = await this.ports.invitations.create({
            token: tokenStr,
            participantId,
            campaignId: campaign.id,
            questionnaireId: qid,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        await this.ports.participants.ensureCampaignParticipantInvited(campaign.id, participantId);

        const inviteUrl = `${this.ports.inviteUrlConfig.frontendBaseUrl}/invite/${invitation.token}`;

        let mailSent = false;
        let mailError: string | null = null;
        if (sendEmail) {
            if (!this.ports.mail.isConfigured()) {
                mailError = 'SMTP non configuré (MAIL_SERVER / MAIL_FROM manquants).';
            } else {
                try {
                    await this.ports.mail.sendInviteEmail({
                        toEmail: participant.email,
                        inviteUrl,
                        questionnaireTitle: qMeta.title,
                        participantName: `${participant.firstName} ${participant.lastName}`,
                    });
                    mailSent = true;
                } catch (error) {
                    mailError = error instanceof Error ? error.message : String(error);
                }
            }
        }

        return {
            id: invitation.id,
            token: invitation.token,
            campaign_id: invitation.campaignId,
            questionnaire_id: invitation.questionnaireId,
            status: invitationTokenAdminStatus({
                isActive: invitation.isActive,
                usedAt: invitation.usedAt,
                expiresAt: invitation.expiresAt,
            }),
            created_at: invitation.createdAt?.toISOString(),
            expires_at: invitation.expiresAt?.toISOString() ?? null,
            used_at: invitation.usedAt?.toISOString() ?? null,
            invite_url: inviteUrl,
            mail_sent: mailSent,
            mail_error: mailError,
            mail_configured: this.ports.mail.isConfigured(),
        };
    }
}
