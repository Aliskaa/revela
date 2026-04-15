import { AssignedQuestionnaireCard } from '@/components/home/AssignedQuestionnaireCard';
import { ParticipantLayout } from '@/components/layout/ParticipantLayout';
import { QuestionnaireMatrixDisplay } from '@/components/matrix/QuestionnaireMatrixDisplay';
import { useParticipantSession, useParticipantSessionMatrix } from '@/hooks/participantSession';
import { userParticipant } from '@/lib/auth';
import { Alert, Box, Card, Container, FormControl, InputLabel, MenuItem, Select, Skeleton, Typography } from '@mui/material';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/')({
    beforeLoad: () => {
        if (!userParticipant.isAuthenticated()) {
            throw redirect({ to: '/login' });
        }
    },
    component: HomePage,
});


function HomePage() {
    const { data: session, isLoading: meLoading, error: meError } = useParticipantSession();
    const assignments = session?.assignments ?? [];
    const idList = Array.from(new Set(assignments.map(assignment => assignment.questionnaire_id)));
    const [matrixSelection, setMatrixSelection] = useState<{ qid: string; campaignId: number | null } | null>(null);

    useEffect(() => {
        if (assignments.length === 0) return;
        setMatrixSelection(prev => {
            if (!prev) return { qid: assignments[0].questionnaire_id, campaignId: assignments[0].campaign_id };
            const match = assignments.find(
                a => a.questionnaire_id === prev.qid && (a.campaign_id ?? null) === (prev.campaignId ?? null)
            );
            return match ? prev : { qid: assignments[0].questionnaire_id, campaignId: assignments[0].campaign_id };
        });
    }, [assignments]);

    const matrixEnabled = idList.length > 0 && !meLoading && !meError && !!matrixSelection?.qid;
    const {
        data: matrix,
        isLoading: matrixLoading,
        error: matrixError,
    } = useParticipantSessionMatrix(matrixEnabled, matrixSelection?.qid ?? '', matrixSelection?.campaignId ?? null);

    const showQuestionnaireBlock = idList.length > 0;
    const firstName = session?.first_name?.trim() || 'Participant';

    return (
        <ParticipantLayout
            activeNav="journey"
            headerTitle={`Bienvenue, ${firstName} !`}
            headerSubtitle="Coaching comportemental — suivez votre parcours d'évaluation pas à pas."
        >
            <Container maxWidth="lg" disableGutters>
                <Box
                    sx={{
                        mb: 3,
                        px: { xs: 2, md: 3 },
                        py: { xs: 2, md: 2.5 },
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'primary.light',
                        bgcolor: 'rgba(21, 21, 176, 0.04)',
                    }}
                >
                    <Typography variant="h6" fontWeight={800} color="primary.main" sx={{ mb: 0.5 }}>
                        Bonjour {firstName}, heureux de vous revoir.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Retrouvez ici vos étapes en cours, vos questionnaires et la synthèse de vos résultats.
                    </Typography>
                </Box>

                {meError && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                        Impossible de charger votre profil.
                    </Alert>
                )}
                {!meLoading && session && idList.length === 0 && (
                    <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
                        Aucun questionnaire n'est associé à votre compte. Contactez votre administrateur.
                    </Alert>
                )}

                <Box sx={{ mb: 6 }}>
                    {meLoading ? (
                        <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} />
                    ) : showQuestionnaireBlock ? (
                        assignments.map(assignment => (
                            <AssignedQuestionnaireCard
                                key={`${String(assignment.campaign_id)}:${assignment.questionnaire_id}`}
                                qid={assignment.questionnaire_id}
                                campaignId={assignment.campaign_id}
                                campaignStatus={assignment.campaign_status ?? null}
                                invitationConfirmed={assignment.invitation_confirmed}
                                progression={assignment.progression}
                            />
                        ))
                    ) : null}
                </Box>

                <Box id="synthese" sx={{ scrollMarginTop: 96, pt: 2 }}>
                    <Typography variant="h5" sx={{ color: 'text.primary', fontWeight: 800, mb: 1 }}>
                        Synthèse de vos résultats
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, maxWidth: 720 }}>
                        Vue consolidée : auto-évaluation, retours pairs et test scientifique.
                    </Typography>

                    {assignments.length > 1 && matrixSelection?.qid && (
                        <FormControl
                            size="small"
                            sx={{ minWidth: 280, mb: 4, bgcolor: 'background.paper', borderRadius: 1 }}
                        >
                            <InputLabel id="home-matrix-qid-label">Évaluation à afficher</InputLabel>
                            <Select
                                labelId="home-matrix-qid-label"
                                label="Évaluation à afficher"
                                value={`${String(matrixSelection.campaignId)}:${matrixSelection.qid}`}
                                onChange={e => {
                                    const value = String(e.target.value);
                                    const [campaignPart, qid] = value.split(':');
                                    setMatrixSelection({
                                        campaignId: campaignPart === 'null' ? null : Number(campaignPart),
                                        qid,
                                    });
                                }}
                            >
                                {assignments.map(assignment => (
                                    <MenuItem
                                        key={`${String(assignment.campaign_id)}:${assignment.questionnaire_id}`}
                                        value={`${String(assignment.campaign_id)}:${assignment.questionnaire_id}`}
                                    >
                                        {`Campagne ${assignment.campaign_id ?? 'n/a'} - Type ${assignment.questionnaire_id}`}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    {!matrixEnabled ? null : matrixLoading ? (
                        <Skeleton variant="rounded" height={400} sx={{ borderRadius: 3 }} />
                    ) : matrixError ? (
                        <Alert severity="error" sx={{ borderRadius: 2 }}>
                            Impossible de charger la synthèse.
                        </Alert>
                    ) : matrix ? (
                        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', p: 3 }}>
                            <QuestionnaireMatrixDisplay matrix={matrix} />
                        </Card>
                    ) : null}
                </Box>
            </Container>
        </ParticipantLayout>
    );
}
