// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { CampaignParticipantProgress, CampaignStatus } from '@aor/types';

/**
 * Vue-modèle pure pour `routes/admin/campaigns/$campaignId.tsx`. Sortie de la route
 * pour pouvoir tester la logique sans dépendance React/MUI.
 */

export const QUESTIONNAIRE_LABELS: Record<string, string> = {
    B: 'B — Comportement',
    F: 'F — Ressentis',
    S: 'S — Soi',
};

export const statusText = (status: CampaignStatus): string => {
    if (status === 'active') {
        return 'Active';
    }
    if (status === 'closed' || status === 'archived') {
        return 'Archivée';
    }
    return 'Brouillon';
};

export const computeProgress = (participants: CampaignParticipantProgress[]): number => {
    if (participants.length === 0) {
        return 0;
    }
    const totalSteps = participants.length * 4;
    let completed = 0;
    for (const p of participants) {
        if (p.selfRatingStatus === 'completed') {
            completed++;
        }
        if (p.peerFeedbackStatus === 'completed') {
            completed++;
        }
        if (p.elementHumainStatus === 'completed') {
            completed++;
        }
        if (p.resultsStatus === 'completed') {
            completed++;
        }
    }
    return Math.round((completed / totalSteps) * 100);
};
