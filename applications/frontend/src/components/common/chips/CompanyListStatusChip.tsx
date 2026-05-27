import type { AdminCampaign } from '@aor/types';
import { BaseStatusChip, StatusChipTone } from './BaseStatusChip';


export type CompanyListStatus = 'active' | 'inactive';

const PALETTE: Record<CompanyListStatus, StatusChipTone> = {
    active: { label: 'Actif', bg: 'tint.successBg', color: 'tint.successText', dot: 'tint.successText' },
    inactive: { label: 'Pause', bg: 'tint.mutedBg', color: 'tint.mutedText', dot: 'tint.mutedText' },
};

export function resolveCompanyListStatus(companyId: number, campaigns: AdminCampaign[]): CompanyListStatus {
    const companyCampaigns = campaigns.filter(c => c.companyId === companyId);
    if (companyCampaigns.length === 0) return 'inactive';
    if (companyCampaigns.some(c => c.status === 'active')) return 'active';
    return 'inactive';
}

export type CompanyListStatusChipProps = {
    status: CompanyListStatus;
    /** Pill compact sans point — aligné sur le tableau Stitch. */
    compact?: boolean;
};

/** Statut dérivé des campagnes rattachées à une entreprise (liste admin). */
export function CompanyStatusChip({ status, compact = false }: CompanyListStatusChipProps) {
    const tone = PALETTE[status];
    return <BaseStatusChip {...tone} showDot={!compact} />;
}
