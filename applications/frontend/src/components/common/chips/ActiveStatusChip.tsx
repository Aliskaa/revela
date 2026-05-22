import { BaseStatusChip, type StatusChipTone } from './BaseStatusChip';

type ActiveStatus = 'active' | 'inactive';

export type ActiveStatusChipProps = {
    isActive: boolean;
    activeLabel?: string;
    inactiveLabel?: string;
};

const PALETTE: Record<ActiveStatus, StatusChipTone> = {
    active: {
        label: 'Actif',
        bg: 'tint.successBg',
        color: 'tint.successText',
        dot: 'tint.successText',
        pulse: true,
    },
    inactive: { label: 'Inactif', bg: 'tint.mutedBg', color: 'tint.mutedText', dot: 'tint.mutedText' },
};

export function ActiveStatusChip({
    isActive,
    activeLabel = 'Actif',
    inactiveLabel = 'Inactif',
}: ActiveStatusChipProps) {
    const key = isActive ? 'active' : 'inactive';
    const tone = {
        ...PALETTE[key],
        label: isActive ? activeLabel : inactiveLabel,
    };

    return <BaseStatusChip {...tone} />;
}
