import type { CampaignStatus } from '@aor/types';

/**
 * Libellés affichables des statuts de campagne. Utilisé dans les `<Select>`, les chips et les
 * tableaux. La source de vérité du type est `@aor/types` ; ici on ne définit que la traduction.
 */
export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
    draft: 'Brouillon',
    active: 'Active',
    closed: 'Clôturée',
    archived: 'Archivée',
};

export const CAMPAIGN_STATUS_OPTIONS: Array<{ value: CampaignStatus; label: string }> = [
    { value: 'draft', label: CAMPAIGN_STATUS_LABELS.draft },
    { value: 'active', label: CAMPAIGN_STATUS_LABELS.active },
    { value: 'closed', label: CAMPAIGN_STATUS_LABELS.closed },
    { value: 'archived', label: CAMPAIGN_STATUS_LABELS.archived },
];
