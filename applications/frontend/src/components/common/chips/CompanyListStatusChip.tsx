import type { AdminCampaign } from '@aor/types';
import { BaseStatusChip, StatusChipTone } from './BaseStatusChip';


export type CompanyListStatus = 'active' | 'inactive';

const PALETTE: Record<CompanyListStatus, StatusChipTone> = {
    active: { label: 'Actif', bg: 'tint.successBg', color: 'tint.successText', dot: 'tint.successText', pulse: true },
    inactive: { label: 'Inactif', bg: 'tint.mutedBg', color: 'tint.mutedText', dot: 'tint.mutedText' },
};

export function resolveCompanyListStatus(companyId: number, campaigns: AdminCampaign[]): CompanyListStatus {
    const companyCampaigns = campaigns.filter(c => c.companyId === companyId);
    if (companyCampaigns.length === 0) return 'inactive';
    if (companyCampaigns.some(c => c.status === 'active')) return 'active';
    return 'inactive';
}

export type CompanyListStatusChipProps = {
    status: CompanyListStatus;
};

/** Statut dérivé des campagnes rattachées à une entreprise (liste admin). */
export function CompanyStatusChip({ status }: CompanyListStatusChipProps) {
    const tone = PALETTE[status];
    return <BaseStatusChip {...tone} />;
}
