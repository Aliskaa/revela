// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { ResponseSubmissionKind as SubmissionKind } from '@aor/types';

import { ResponseQuestionnaireIdRequiredError } from './responses.errors';

export type { SubmissionKind };

export type ResponseScore = {
    scoreKey: number;
    value: number;
};

/**
 * Entité Response.
 *
 * **Immutable par nature métier** : une réponse soumise est un événement figé — pas de méthode
 * de mutation, pas de transition. Seule l'administration peut la supprimer (cascade via port).
 * Les scores sont gelés dans un tableau également figé via `Object.freeze`.
 */
export class Response {
    private constructor(
        public readonly id: number,
        public readonly participantId: number | null,
        public readonly inviteTokenId: number | null,
        public readonly questionnaireId: string,
        public readonly campaignId: number | null,
        public readonly submissionKind: SubmissionKind,
        public readonly subjectParticipantId: number | null,
        public readonly raterParticipantId: number | null,
        public readonly ratedParticipantId: number | null,
        public readonly name: string,
        public readonly email: string,
        public readonly organisation: string | null,
        public readonly submittedAt: Date | null,
        public readonly scores: readonly ResponseScore[]
    ) {
        Object.freeze(this.scores);
        Object.freeze(this);
    }

    public static create(props: {
        participantId?: number | null;
        inviteTokenId?: number | null;
        questionnaireId: string;
        campaignId?: number | null;
        submissionKind?: SubmissionKind;
        subjectParticipantId?: number | null;
        raterParticipantId?: number | null;
        ratedParticipantId?: number | null;
        name: string;
        email: string;
        organisation?: string | null;
        scores: ResponseScore[];
    }): Response {
        const qid = props.questionnaireId.trim();
        if (qid.length === 0) {
            throw new ResponseQuestionnaireIdRequiredError();
        }
        return new Response(
            0,
            props.participantId ?? null,
            props.inviteTokenId ?? null,
            qid,
            props.campaignId ?? null,
            props.submissionKind ?? 'element_humain',
            props.subjectParticipantId ?? null,
            props.raterParticipantId ?? null,
            props.ratedParticipantId ?? null,
            props.name,
            props.email,
            props.organisation ?? null,
            null,
            [...props.scores]
        );
    }

    public static hydrate(props: {
        id: number;
        participantId: number | null;
        inviteTokenId: number | null;
        questionnaireId: string;
        campaignId: number | null;
        submissionKind: SubmissionKind;
        subjectParticipantId: number | null;
        raterParticipantId: number | null;
        ratedParticipantId: number | null;
        name: string;
        email: string;
        organisation: string | null;
        submittedAt: Date | null;
        scores: ResponseScore[];
    }): Response {
        return new Response(
            props.id,
            props.participantId,
            props.inviteTokenId,
            props.questionnaireId,
            props.campaignId,
            props.submissionKind,
            props.subjectParticipantId,
            props.raterParticipantId,
            props.ratedParticipantId,
            props.name,
            props.email,
            props.organisation,
            props.submittedAt,
            [...props.scores]
        );
    }

    public isPersisted(): boolean {
        return this.id > 0;
    }

    public persistenceSnapshot(): {
        id: number;
        participantId: number | null;
        inviteTokenId: number | null;
        questionnaireId: string;
        campaignId: number | null;
        submissionKind: SubmissionKind;
        subjectParticipantId: number | null;
        raterParticipantId: number | null;
        ratedParticipantId: number | null;
        name: string;
        email: string;
        organisation: string | null;
        submittedAt: Date | null;
        scores: ResponseScore[];
    } {
        return {
            id: this.id,
            participantId: this.participantId,
            inviteTokenId: this.inviteTokenId,
            questionnaireId: this.questionnaireId,
            campaignId: this.campaignId,
            submissionKind: this.submissionKind,
            subjectParticipantId: this.subjectParticipantId,
            raterParticipantId: this.raterParticipantId,
            ratedParticipantId: this.ratedParticipantId,
            name: this.name,
            email: this.email,
            organisation: this.organisation,
            submittedAt: this.submittedAt,
            scores: [...this.scores],
        };
    }
}
