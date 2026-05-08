import { Card, CardContent, LinearProgress, Typography } from '@mui/material';

export type LoadingCardProps = {
    /** Titre annoncé en h6 (ex. "Chargement de votre espace"). */
    title: string;
    /** Description optionnelle sous le titre. */
    description?: string;
    /** Étiquette accessible pour la `LinearProgress` (sinon générée depuis le titre). */
    ariaLabel?: string;
};

/**
 * État de chargement standard : `Card` outlined + titre + `LinearProgress`.
 *
 * Avant cette factorisation, le pattern était dupliqué dans toutes les routes participant
 * (ParticipantDashboardRoute, ParticipantSelfRatingRoute, peer-feedback, results, etc.)
 * avec des variantes mineures : tailles de padding, présence ou non de `aria-busy`,
 * `fontWeight={700|800}`, `aria-label` parfois oublié sur la `LinearProgress`.
 *
 * `role="status" + aria-live="polite" + aria-busy="true"` annoncent l'état de chargement
 * aux lecteurs d'écran. Le pattern a été validé sur `_participant/index.tsx`.
 */
export function LoadingCard({ title, description, ariaLabel }: LoadingCardProps) {
    return (
        // biome-ignore lint/a11y/useSemanticElements: `Card` est un `<div>` MUI ; on ajoute `role="status"` pour annoncer le chargement aux lecteurs d'écran.
        <Card variant="outlined" role="status" aria-live="polite" aria-busy="true">
            <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} color="text.primary">
                    {title}
                </Typography>
                {description ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
                        {description}
                    </Typography>
                ) : null}
                <LinearProgress sx={{ mt: 2 }} aria-label={ariaLabel ?? title} />
            </CardContent>
        </Card>
    );
}
