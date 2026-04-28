// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { ParticipantQuestionnaireMatrix } from '@/components/matrix/ParticipantQuestionnaireMatrix';
import { Box, Button, Stack, Typography } from '@mui/material';
import { Link, createFileRoute } from '@tanstack/react-router';
import { ArrowLeft, LayoutPanelLeft } from 'lucide-react';

/**
 * Matrice des scores d'un participant côté coach.
 *
 * Réplique de `routes/admin/participants/$participantId.matrix.tsx` adaptée :
 * - bouton « Retour » pointe vers `/coach/participants` (la liste cross-campagnes du coach) ;
 * - le composant `<ParticipantQuestionnaireMatrix>` est partagé avec l'espace admin et
 *   consomme l'endpoint `/admin/participants/:id/matrix` qui n'est pas filtré par
 *   `coachId` à ce jour (limite V1.5 documentée dans avancement-2026-04-28.md §5.2 —
 *   la sécurité repose sur le fait que le coach n'accède à ces IDs que via la liste
 *   filtrée des participants de ses campagnes).
 */
type MatrixSearch = { qid: string };

export const Route = createFileRoute('/coach/participants/$participantId/matrix')({
    validateSearch: (search: Record<string, unknown>): MatrixSearch => {
        const raw = search.qid;
        if (typeof raw === 'string' && raw.trim().length > 0) {
            return { qid: raw.trim().toUpperCase() };
        }
        return { qid: 'B' };
    },
    component: CoachParticipantMatrixPage,
});

function CoachParticipantMatrixPage() {
    const { participantId } = Route.useParams();
    const { qid } = Route.useSearch();
    const navigate = Route.useNavigate();
    const id = Number(participantId);

    return (
        <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            <Button
                component={Link}
                to="/coach/participants"
                startIcon={<ArrowLeft size={18} />}
                sx={{
                    mb: 3,
                    fontWeight: 600,
                    color: 'text.secondary',
                    '&:hover': { bgcolor: 'transparent', color: 'primary.main' },
                }}
                disableRipple
            >
                Retour aux participants
            </Button>

            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                justifyContent="space-between"
                mb={4}
            >
                <Box>
                    <Typography
                        variant="h4"
                        fontWeight={800}
                        sx={{ color: 'primary.main', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1.5 }}
                    >
                        <LayoutPanelLeft size={28} />
                        Matrice des scores
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Participant #{participantId} — Comparaison détaillée entre l'auto-évaluation, les retours pairs
                        et l'analyse scientifique.
                    </Typography>
                </Box>
            </Stack>

            <ParticipantQuestionnaireMatrix
                participantId={id}
                qid={qid}
                onQidChange={next => {
                    void navigate({ search: { qid: next } });
                }}
            />
        </Box>
    );
}
