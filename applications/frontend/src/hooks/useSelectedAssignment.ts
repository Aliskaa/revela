import { useCampaignStore } from '@/stores/campaignStore';
import type { ParticipantSession } from '@aor/types';
import { useMemo } from 'react';

export type ParticipantAssignment = ParticipantSession['assignments'][number];

/**
 * Resolves the currently selected assignment from the participant session.
 *
 * Priority:
 * 1. The campaign selected in the Zustand store (if it exists in the session)
 * 2. The first active campaign
 * 3. The first campaign in the list
 */
export function useSelectedAssignment(session: ParticipantSession | undefined) {
    const selectedCampaignId = useCampaignStore(s => s.selectedCampaignId);

    return useMemo(() => {
        const assignments = session?.assignments ?? [];
        if (assignments.length === 0) return { assignment: undefined, index: 0, assignments };

        // 1. From store
        if (selectedCampaignId !== null) {
            const idx = assignments.findIndex(a => a.campaign_id === selectedCampaignId);
            if (idx >= 0) return { assignment: assignments[idx], index: idx, assignments };
        }

        // 2. First active
        const activeIdx = assignments.findIndex(a => a.campaign_status === 'active');
        if (activeIdx >= 0) return { assignment: assignments[activeIdx], index: activeIdx, assignments };

        // 3. First
        return { assignment: assignments[0], index: 0, assignments };
    }, [session, selectedCampaignId]);
}
