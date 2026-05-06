// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    useActivateCampaignParticipantTransparency,
    useAdminCampaignParticipantTransparency,
} from '@/hooks/transparency';
import { Button, CircularProgress, Tooltip } from '@mui/material';
import { ScanEye } from 'lucide-react';

export type CampaignParticipantTransparencyButtonProps = {
    campaignId: number;
    participantId: number;
};

/**
 * Bouton « Lancer le calcul / Recalculer le repère » par participant dans la table des
 * participants d'une campagne (P23). Affiche le score actuel s'il est déjà activé, et permet
 * une re-activation (re-calcul) à tout moment — la valeur snapshot est figée jusqu'au prochain
 * clic.
 */
export function CampaignParticipantTransparencyButton({
    campaignId,
    participantId,
}: CampaignParticipantTransparencyButtonProps) {
    const { data: envelope, isLoading } = useAdminCampaignParticipantTransparency(campaignId, participantId);
    const activate = useActivateCampaignParticipantTransparency();

    const snapshot = envelope?.snapshot ?? null;
    const hasSnapshot = snapshot !== null;

    const label = hasSnapshot ? `Repère ${String(snapshot.value)}% — recalculer` : 'Lancer le calcul du repère';
    const tooltip = hasSnapshot
        ? `Activé le ${new Date(snapshot.activated_at).toLocaleDateString()} — basé sur ${String(
              snapshot.peer_count
          )} feedback(s) pair(s). Cliquez pour recalculer.`
        : 'Calcule le score de transparence à partir des feedbacks reçus et le partage avec le participant.';

    const isPending = activate.isPending;

    return (
        <Tooltip title={tooltip}>
            <span>
                <Button
                    size="small"
                    variant={hasSnapshot ? 'contained' : 'outlined'}
                    color={hasSnapshot ? 'primary' : 'inherit'}
                    startIcon={isPending ? <CircularProgress size={14} color="inherit" /> : <ScanEye size={14} />}
                    onClick={() => activate.mutate({ campaignId, participantId })}
                    disabled={isPending || isLoading}
                    sx={{ borderRadius: 99 }}
                >
                    {label}
                </Button>
            </span>
        </Tooltip>
    );
}
