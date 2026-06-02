// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { getQuestionnaireEntry } from '@aor/questionnaires';
import type {
    ParticipantQuestionnaireMatrix,
    ParticipantQuestionnaireMatrixPeerColumn,
    ParticipantQuestionnaireMatrixRow,
    ResultDim,
} from '@aor/types';

import { displayPeerRatingStoredLabel, parsePeerRatingTargetParticipantId } from '@aor/domain';
import { AdminInvalidQuestionnaireError, AdminResourceNotFoundError } from '@src/domain/admin/admin.errors';
import type {
    IParticipantsAdminReadPort,
    IParticipantsIdentityReaderPort,
} from '@src/interfaces/participants/IParticipantsRepository.port';
import type {
    IResponsesSubmissionReaderPort,
    ResponseRecord,
    SubmissionKind,
} from '@src/interfaces/responses/IResponsesRepository.port';

const LIKERT_MAX = 9;

const scoresToMap = (record: ResponseRecord | null): Map<number, number> => {
    const map = new Map<number, number>();
    if (!record) {
        return map;
    }
    for (const s of record.scores) {
        map.set(s.scoreKey, s.value);
    }
    return map;
};

const commentsToMap = (record: ResponseRecord | null): Map<number, string> => {
    const map = new Map<number, string>();
    if (!record) {
        return map;
    }
    for (const s of record.scores) {
        const c = s.comment?.trim();
        if (c && c.length > 0) {
            map.set(s.scoreKey, c);
        }
    }
    return map;
};

const latestBySubmittedAt = (records: ResponseRecord[]): ResponseRecord | null => {
    if (records.length === 0) {
        return null;
    }
    return records.reduce((best, cur) => {
        const tb = best.submittedAt?.getTime() ?? 0;
        const tc = cur.submittedAt?.getTime() ?? 0;
        return tc >= tb ? cur : best;
    });
};

const byKind = (records: ResponseRecord[], kind: SubmissionKind): ResponseRecord[] =>
    records.filter(r => r.submissionKind === kind);

export type PeerColumnPerspective = 'given' | 'received';

export class GetParticipantQuestionnaireMatrixUseCase {
    public constructor(
        private readonly ports: {
            readonly participants: IParticipantsIdentityReaderPort & IParticipantsAdminReadPort;
            readonly responses: IResponsesSubmissionReaderPort;
        }
    ) {}

    /**
     * Filtrage scope=coach (G5 RGPD) : si `params.coachId` est fourni, on vérifie via
     * `findByIdEnriched` que le participant appartient à au moins une campagne du coach.
     * Sinon → 404 (`AdminResourceNotFoundError`), pour ne pas leak l'existence de la
     * ressource. Les appels participant-side passent `coachId: undefined` (le participant
     * consulte sa propre matrix, pas de filtrage à appliquer).
     */
    public async execute(params: {
        participantId: number;
        qid: string;
        campaignId?: number;
        coachId?: number;
        /**
         * `given` : colonnes = feedbacks émis par le sujet vers ses pairs (saisie feedback).
         * `received` : colonnes = feedbacks reçus par le sujet (résultats, vue coach/admin).
         */
        peerColumnPerspective?: PeerColumnPerspective;
        /**
         * Uniquement avec `received` : masquer noms / IDs pairs côté participant (P14/P16).
         * Toujours `false` sur l'API admin (y compris super-admin).
         */
        anonymizeReceivedPeerLabels?: boolean;
    }): Promise<ParticipantQuestionnaireMatrix> {
        if (params.coachId !== undefined) {
            const allowed = await this.ports.participants.findByIdEnriched(params.participantId, {
                coachId: params.coachId,
            });
            if (!allowed) {
                throw new AdminResourceNotFoundError('Participant introuvable.');
            }
        }
        const participant = await this.ports.participants.findById(params.participantId);
        if (!participant) {
            throw new AdminResourceNotFoundError('Participant introuvable.');
        }
        const qid = params.qid;
        const catalog = getQuestionnaireEntry(qid);
        if (!catalog) {
            throw new AdminInvalidQuestionnaireError('Questionnaire invalide.');
        }

        const responses = await this.ports.responses.listForSubjectQuestionnaireMatrix(
            params.participantId,
            qid,
            params.campaignId
        );

        const selfRecord = latestBySubmittedAt(byKind(responses, 'self_rating'));
        const scientificRecord = latestBySubmittedAt(byKind(responses, 'element_humain'));

        const perspective = params.peerColumnPerspective ?? 'given';
        const peerCandidatesAll = byKind(responses, 'peer_rating');
        const peerCandidates =
            perspective === 'given'
                ? peerCandidatesAll.filter(r => r.subjectParticipantId === participant.id)
                : peerCandidatesAll.filter(r => r.ratedParticipantId === participant.id);
        peerCandidates.sort((a, b) => (b.submittedAt?.getTime() ?? 0) - (a.submittedAt?.getTime() ?? 0));
        const peerRecords = peerCandidates.slice(0, 5).reverse();

        const anonymizeReceivedPeers = perspective === 'received' && (params.anonymizeReceivedPeerLabels ?? false);

        const raterDisplayNames = new Map<number, string>();
        const avatarUrlByParticipantId = new Map<number, string | null>();

        const loadParticipantDisplay = async (id: number): Promise<void> => {
            const enriched = await this.ports.participants.findByIdEnriched(id, {
                coachId: params.coachId,
            });
            if (!enriched) {
                return;
            }
            raterDisplayNames.set(id, `${enriched.firstName} ${enriched.lastName}`.trim());
            avatarUrlByParticipantId.set(id, enriched.avatar_url);
        };

        const avatarParticipantIds = new Set<number>();
        for (const r of peerRecords) {
            if (perspective === 'given') {
                const rawName = r.name.trim() || `Pair #${String(r.id)}`;
                const ratedId = r.ratedParticipantId ?? parsePeerRatingTargetParticipantId(rawName);
                if (ratedId !== null) {
                    avatarParticipantIds.add(ratedId);
                }
            } else if (!anonymizeReceivedPeers && r.subjectParticipantId !== null && r.subjectParticipantId !== undefined) {
                avatarParticipantIds.add(r.subjectParticipantId);
            }
        }

        for (const id of avatarParticipantIds) {
            await loadParticipantDisplay(id);
        }

        const peer_columns: ParticipantQuestionnaireMatrixPeerColumn[] = peerRecords.map((r, index) => {
            if (perspective === 'given') {
                const rawName = r.name.trim() || `Pair #${String(r.id)}`;
                const ratedId = r.ratedParticipantId ?? parsePeerRatingTargetParticipantId(rawName);
                return {
                    response_id: r.id,
                    label: displayPeerRatingStoredLabel(rawName),
                    rater_participant_id: r.raterParticipantId,
                    rated_participant_id: ratedId,
                    avatar_url:
                        ratedId !== null ? (avatarUrlByParticipantId.get(ratedId) ?? null) : null,
                };
            }
            const raterId = r.subjectParticipantId;
            const label = anonymizeReceivedPeers
                ? `Pair #${String(index + 1)}`
                : (raterId !== null && raterId !== undefined
                      ? (raterDisplayNames.get(raterId) ?? r.name.trim())
                      : r.name.trim()) || `Pair #${String(index + 1)}`;
            return {
                response_id: r.id,
                label,
                rater_participant_id: anonymizeReceivedPeers ? null : raterId,
                rated_participant_id: anonymizeReceivedPeers ? null : r.ratedParticipantId,
                avatar_url:
                    anonymizeReceivedPeers || raterId === null || raterId === undefined
                        ? null
                        : (avatarUrlByParticipantId.get(raterId) ?? null),
            };
        });

        const scoreKeys = Object.keys(catalog.short_labels)
            .map(k => Number(k))
            .filter(n => Number.isFinite(n))
            .sort((a, b) => a - b);

        const selfMap = scoresToMap(selfRecord);
        const scientificMap = scoresToMap(scientificRecord);
        const peerMaps = peerRecords.map(r => scoresToMap(r));
        const peerCommentMaps = peerRecords.map(r => commentsToMap(r));

        const rows: ParticipantQuestionnaireMatrixRow[] = scoreKeys.map(score_key => ({
            score_key,
            label: catalog.short_labels[String(score_key)] ?? String(score_key),
            self: selfMap.get(score_key) ?? null,
            peers: peerMaps.map(m => m.get(score_key) ?? null),
            peer_comments: peerCommentMaps.map(m => m.get(score_key) ?? null),
            scientific: scientificMap.get(score_key) ?? null,
        }));

        const scientificValues = rows.map(r => r.scientific).filter((v): v is number => v !== null);
        const scientific_value_max =
            scientificValues.length > 0 ? Math.max(LIKERT_MAX, ...scientificValues) : LIKERT_MAX;

        return {
            subject_id: participant.id,
            questionnaire_id: catalog.id,
            questionnaire_title: catalog.title,
            likert_max: LIKERT_MAX,
            scientific_value_max,
            peer_columns,
            self_response_id: selfRecord?.id ?? null,
            scientific_response_id: scientificRecord?.id ?? null,
            rows,
            result_dims: catalog.result_dims as ResultDim[],
            short_labels: catalog.short_labels,
        };
    }
}
