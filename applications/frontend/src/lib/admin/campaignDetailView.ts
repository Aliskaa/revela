// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { CampaignParticipantProgress, CampaignStatus } from '@aor/types';

/**
 * Vue-modèle pure pour le détail de campagne (admin/coach). Sortie de la route pour
 * pouvoir tester la logique sans dépendance React/MUI. Les libellés des questionnaires
 * sont centralisés dans `@/lib/labels/questionnaires` — ne pas les réintroduire ici.
 */

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
