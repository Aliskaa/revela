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

export type AdminDashboardQuestionnaireSlice = {
    readonly title: string;
    readonly count: number;
    readonly lastSubmittedAt: Date | null;
};

export class AdminDashboardSnapshot {
    private constructor(
        public readonly totalResponses: number,
        public readonly totalParticipants: number,
        public readonly totalCompanies: number,
        public readonly byQuestionnaire: Readonly<Record<string, AdminDashboardQuestionnaireSlice>>
    ) {
        Object.freeze(this.byQuestionnaire);
        Object.freeze(this);
    }

    public static create(params: {
        readonly totalResponses: number;
        readonly totalParticipants: number;
        readonly totalCompanies: number;
        readonly byQuestionnaire: Readonly<Record<string, AdminDashboardQuestionnaireSlice>>;
    }): AdminDashboardSnapshot {
        const byQuestionnaire: Record<string, AdminDashboardQuestionnaireSlice> = {};
        for (const [qid, slice] of Object.entries(params.byQuestionnaire)) {
            byQuestionnaire[qid] = Object.freeze({
                title: slice.title,
                count: slice.count,
                lastSubmittedAt: slice.lastSubmittedAt,
            });
        }
        Object.freeze(byQuestionnaire);
        return new AdminDashboardSnapshot(
            params.totalResponses,
            params.totalParticipants,
            params.totalCompanies,
            byQuestionnaire
        );
    }
}
