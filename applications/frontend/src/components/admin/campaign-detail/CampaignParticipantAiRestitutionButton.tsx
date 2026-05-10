// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { useAdminAiRestitution } from '@/hooks/aiRestitutions';
import { Button, Tooltip } from '@mui/material';
import { BadgeCheck, Bot, Pencil, Sparkles, XCircle } from 'lucide-react';
import type * as React from 'react';

export type CampaignParticipantAiRestitutionButtonProps = {
    campaignId: number;
    participantId: number;
    /**
     * Préfixe d'URL de la page complète : `/admin/campaigns` ou `/coach/campaigns`.
     * URL finale : `${prefix}/${campaignId}/participants/${participantId}/ai-restitution`.
     */
    aiRestitutionUrlPrefix: string;
};

const STATUS_VARIANT: Record<
    'none' | 'generated' | 'edited' | 'approved' | 'rejected',
    {
        label: string;
        icon: React.ReactNode;
        variant: 'outlined' | 'contained';
        color: 'inherit' | 'primary' | 'success' | 'warning' | 'info';
        tooltip: string;
    }
> = {
    none: {
        label: 'Lancer le retour IA',
        icon: <Sparkles size={14} />,
        variant: 'outlined',
        color: 'inherit',
        tooltip: 'Aucune restitution générée. Ouvre la page pour saisir les scores et lancer la génération.',
    },
    generated: {
        label: 'Restitution générée',
        icon: <Bot size={14} />,
        variant: 'contained',
        color: 'primary',
        tooltip: 'Restitution générée — à relire et approuver.',
    },
    edited: {
        label: 'Restitution éditée',
        icon: <Pencil size={14} />,
        variant: 'contained',
        color: 'info',
        tooltip: 'Édition coach en cours — à approuver.',
    },
    approved: {
        label: 'Restitution approuvée',
        icon: <BadgeCheck size={14} />,
        variant: 'contained',
        color: 'success',
        tooltip: 'Restitution approuvée et diffusée au participant.',
    },
    rejected: {
        label: 'Restitution rejetée',
        icon: <XCircle size={14} />,
        variant: 'outlined',
        color: 'warning',
        tooltip: 'Restitution rejetée — non diffusée. Ouvre pour régénérer.',
    },
};

/**
 * Bouton table participants pour ouvrir la page de restitution IA.
 * Affiche l'état actuel (généré, édité, approuvé, rejeté) ou « Lancer le retour IA »
 * si aucune restitution n'existe encore.
 */
export function CampaignParticipantAiRestitutionButton({
    campaignId,
    participantId,
    aiRestitutionUrlPrefix,
}: CampaignParticipantAiRestitutionButtonProps) {
    const { data: envelope, isLoading } = useAdminAiRestitution(campaignId, participantId);

    const status = envelope?.restitution?.status ?? 'none';
    const cfg = STATUS_VARIANT[status];

    const href = `${aiRestitutionUrlPrefix}/${String(campaignId)}/participants/${String(participantId)}/ai-restitution`;

    return (
        <Tooltip title={cfg.tooltip}>
            <span>
                <Button
                    size="small"
                    variant={cfg.variant}
                    color={cfg.color}
                    startIcon={cfg.icon}
                    href={href}
                    disabled={isLoading}
                    sx={{ borderRadius: 99 }}
                >
                    {cfg.label}
                </Button>
            </span>
        </Tooltip>
    );
}
