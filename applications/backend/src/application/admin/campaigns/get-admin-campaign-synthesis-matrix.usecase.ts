// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { getQuestionnaireEntry } from '@aor/questionnaires';
import type {
    CampaignSynthesisDimension,
    CampaignSynthesisGapCell,
    CampaignSynthesisGapRow,
    CampaignSynthesisMatrix,
    CampaignSynthesisParticipantColumn,
    CampaignSynthesisScoreRow,
    ResultDim,
} from '@aor/types';

import { AdminInvalidQuestionnaireError } from '@src/domain/admin/admin.errors';
import type { ICampaignsReadPort } from '@src/interfaces/campaigns/ICampaignsRepository.port';
import type { IParticipantsAdminReadPort } from '@src/interfaces/participants/IParticipantsRepository.port';
import type { IResponsesSubmissionReaderPort } from '@src/interfaces/responses/IResponsesRepository.port';

/**
 * Seuil au-delà duquel un écart |e − w| est marqué `warning` côté DTO et coloré côté UI.
 * Décision produit (Nora, 2026-05-08) : strictement supérieur à 4.
 */
const GAP_WARNING_THRESHOLD = 4;

/** Questionnaire ciblé par défaut pour la synthèse de campagne (« test scientifique »). */
const DEFAULT_QID = 'B';

export class GetAdminCampaignSynthesisMatrixUseCase {
    public constructor(
        private readonly ports: {
            readonly campaigns: ICampaignsReadPort;
            readonly participants: IParticipantsAdminReadPort;
            readonly responses: IResponsesSubmissionReaderPort;
        }
    ) {}

    /**
     * Vue matrice agrégée des réponses Élément B pour tous les participants d'une campagne.
     * Filtrage scope=coach : si `params.coachId` est fourni, on appelle `campaigns.findById`
     * avec le coachId et on retourne `null` si la campagne n'est pas dans son périmètre
     * (pas d'erreur — la résolution `null` est traitée comme « hors périmètre » côté contrôleur).
     */
    public async execute(params: {
        campaignId: number;
        coachId?: number;
        qid?: string;
    }): Promise<CampaignSynthesisMatrix | null> {
        const qid = (params.qid ?? DEFAULT_QID).toUpperCase();
        const catalog = getQuestionnaireEntry(qid);
        if (!catalog) {
            throw new AdminInvalidQuestionnaireError('Questionnaire invalide.');
        }

        const campaign = await this.ports.campaigns.findById(params.campaignId, { coachId: params.coachId });
        if (!campaign) {
            return null;
        }

        const progress = await this.ports.participants.listCampaignParticipantProgress(params.campaignId);

        const participants: CampaignSynthesisParticipantColumn[] = [];
        const scoreMaps: Array<Map<number, number>> = [];

        // N+1 acceptable : campagne ≤ ~10 participants (cf. PDF AOR § parcours court).
        for (const p of progress) {
            const responses = await this.ports.responses.listForSubjectQuestionnaireMatrix(
                p.participantId,
                qid,
                params.campaignId
            );
            const elementB = responses
                .filter(r => r.submissionKind === 'element_humain')
                .reduce<(typeof responses)[number] | null>((best, cur) => {
                    if (!best) {
                        return cur;
                    }
                    const tb = best.submittedAt?.getTime() ?? 0;
                    const tc = cur.submittedAt?.getTime() ?? 0;
                    return tc >= tb ? cur : best;
                }, null);

            const scoreMap = new Map<number, number>();
            if (elementB) {
                for (const s of elementB.scores) {
                    scoreMap.set(s.scoreKey, s.value);
                }
            }
            scoreMaps.push(scoreMap);

            participants.push({
                participantId: p.participantId,
                fullName: p.fullName,
                email: p.email,
                hasResponse: elementB !== null,
            });
        }

        const resultDims = catalog.result_dims as ResultDim[];
        const dimensions: CampaignSynthesisDimension[] = resultDims.map(dim => {
            const rows: CampaignSynthesisScoreRow[] = dim.scores.map(scoreKey => ({
                scoreKey,
                label: catalog.short_labels[String(scoreKey)] ?? String(scoreKey),
                values: scoreMaps.map(m => m.get(scoreKey) ?? null),
            }));

            const gaps: CampaignSynthesisGapRow[] = (dim.diff_pairs ?? []).map(pair => {
                const cells: CampaignSynthesisGapCell[] = scoreMaps.map(m => {
                    const e = m.get(pair.e);
                    const w = m.get(pair.w);
                    if (e === undefined || w === undefined) {
                        return { value: null, warning: false };
                    }
                    const value = Math.abs(e - w);
                    return { value, warning: value > GAP_WARNING_THRESHOLD };
                });
                return {
                    eScoreKey: pair.e,
                    wScoreKey: pair.w,
                    label: 'Écart',
                    cells,
                };
            });

            return { name: dim.name, rows, gaps };
        });

        return {
            campaignId: campaign.id,
            campaignName: campaign.name,
            questionnaireId: catalog.id,
            questionnaireTitle: catalog.title,
            gapWarningThreshold: GAP_WARNING_THRESHOLD,
            participants,
            dimensions,
            resultDims,
        };
    }
}
