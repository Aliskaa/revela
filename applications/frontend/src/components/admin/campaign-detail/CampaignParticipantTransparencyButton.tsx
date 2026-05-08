// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { useAdminCampaignParticipantTransparency } from '@/hooks/transparency';
import { Button, Tooltip } from '@mui/material';
import { ScanEye } from 'lucide-react';

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
 * transparence. Affiche le score actuel s'il est déjà activé. Le calcul / recalcul se fait
 * désormais depuis la vue détaillée elle-même (route `.../transparency`), ce qui permet à
 * l'admin/coach de voir le détail (F, écarts pairs, conversions F→P) avant et après calcul.
 */
export function CampaignParticipantTransparencyButton({
    campaignId,
    participantId,
    transparencyUrlPrefix,
}: CampaignParticipantTransparencyButtonProps) {
    const { data: envelope, isLoading } = useAdminCampaignParticipantTransparency(campaignId, participantId);

    const snapshot = envelope?.snapshot ?? null;
    const hasSnapshot = snapshot !== null;

    const label = hasSnapshot ? `Transparence ${String(snapshot.value)} %` : 'Voir la transparence';
    const tooltip = hasSnapshot
        ? `Activé le ${new Date(snapshot.activated_at).toLocaleDateString()} — basé sur ${String(
              snapshot.peer_count
          )} feedback(s) pair(s). Cliquez pour ouvrir le détail et recalculer.`
        : 'Ouvrir la matrice de transparence pour lancer le calcul à partir des feedbacks reçus.';

    const href = `${transparencyUrlPrefix}/${String(campaignId)}/participants/${String(participantId)}/transparency`;

    return (
        <Tooltip title={tooltip}>
            <span>
                <Button
                    size="small"
                    variant={hasSnapshot ? 'contained' : 'outlined'}
                    color={hasSnapshot ? 'primary' : 'inherit'}
                    startIcon={<ScanEye size={14} />}
                    href={href}
                    disabled={isLoading}
                    sx={{ borderRadius: 99 }}
                >
                    {label}
                </Button>
            </span>
        </Tooltip>
    );
}
