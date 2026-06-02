// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { type CanActivate, type ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

import type { GetAdminCampaignDetailUseCase } from '@src/application/admin/campaigns/get-admin-campaign-detail.usecase';
import type { JwtValidatedUser } from '@src/presentation/jwt-validated-user';

import { GET_ADMIN_CAMPAIGN_DETAIL_USE_CASE_SYMBOL } from './admin.tokens';

/**
 * Vérifie qu'un coach ne touche qu'aux campagnes de son périmètre, de façon
 * déclarative. Remplace les trois copies de `ensureCampaignAccess()` jusque-là
 * dupliquées dans les controllers campaigns / responses / ai-restitutions
 * (cf. ADR-009 §2).
 *
 * Logique (identique aux ex-copies privées) :
 * - super-admin (ou tout acteur non `coach`) → accès non restreint ;
 * - coach → la campagne ciblée doit être visible dans son périmètre, sinon `401`.
 *
 * L'identifiant de campagne est lu sur le param de route `:campaignId` puis, à
 * défaut, sur la query `campaign_id` (cas de `GET /admin/responses?campaign_id=`).
 * Aucune campagne ciblée → rien à restreindre (ex. listes globales) : on laisse
 * passer, le use case appliquant déjà le filtrage par `coachId`.
 */
@Injectable()
export class CampaignAccessGuard implements CanActivate {
    public constructor(
        @Inject(GET_ADMIN_CAMPAIGN_DETAIL_USE_CASE_SYMBOL)
        private readonly getAdminCampaignDetail: GetAdminCampaignDetailUseCase
    ) {}

    public async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest<Request & { user?: JwtValidatedUser }>();
        const user = req.user;
        if (!user || user.scope !== 'coach') {
            return true;
        }
        const raw = req.params?.campaignId ?? (req.query?.campaign_id as string | undefined);
        const campaignId = Number(raw);
        if (!Number.isFinite(campaignId) || campaignId <= 0) {
            return true;
        }
        const detail = await this.getAdminCampaignDetail.execute(campaignId, { coachId: user.coachId });
        if (!detail) {
            throw new UnauthorizedException();
        }
        return true;
    }
}
