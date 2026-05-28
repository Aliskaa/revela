// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Button, Tooltip } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { ScanEye } from 'lucide-react';

import { harmonizedTableActionButtonSx } from '@/components/common/styles/listSurfaces';
import { useAdminCampaignParticipantTransparency } from '@/hooks/transparency';

export type CampaignParticipantTransparencyButtonProps = {
    campaignId: number;
    participantId: number;
    /**
     * Préfixe d'URL de la vue détaillée de la matrice de transparence (ex. `/admin/campaigns`
     * ou `/coach/campaigns`). L'URL finale est
     * `${prefix}/${campaignId}/participants/${participantId}/transparency`.
     */
    transparencyUrlPrefix: string;
};

/**
 * Bouton de la table des participants (P23) qui mène à la vue détaillée de la matrice de
 * transparence. Affiche le score actuel s'il est déjà activé.
 */
export function CampaignParticipantTransparencyButton({
    campaignId,
    participantId,
    transparencyUrlPrefix,
}: CampaignParticipantTransparencyButtonProps) {
    const { data: envelope, isLoading } = useAdminCampaignParticipantTransparency(campaignId, participantId);

    const snapshot = envelope?.snapshot ?? null;
    const hasSnapshot = snapshot !== null;

    const label = hasSnapshot ? `${snapshot.value} %` : 'Transparence';
    const tooltip = hasSnapshot
        ? `Activé le ${new Date(snapshot.activated_at).toLocaleDateString()} — basé sur ${String(
              snapshot.peer_count
          )} feedback(s) pair(s). Cliquez pour ouvrir le détail et recalculer.`
        : 'Ouvrir la matrice de transparence pour lancer le calcul à partir des feedbacks reçus.';

    const to = `${transparencyUrlPrefix}/${String(campaignId)}/participants/${String(participantId)}/transparency`;

    return (
        <Tooltip title={tooltip}>
            <span>
                <Button
                    component={Link}
                    to={to}
                    size="small"
                    variant="outlined"
                    color="primary"
                    disabled={isLoading}
                    startIcon={<ScanEye size={14} />}
                    sx={harmonizedTableActionButtonSx}
                >
                    {label}
                </Button>
            </span>
        </Tooltip>
    );
}
