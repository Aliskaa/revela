// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Alert, Box, Link as MuiLink, Stack, Tooltip, Typography } from '@mui/material';
import { Link, createFileRoute } from '@tanstack/react-router';
import { Download, HelpCircle, Radar, Target, UserRound, Users } from 'lucide-react';
import * as React from 'react';

import { KpiCard } from '@/components/common/cards';
import { EmptyState } from '@/components/common/EmptyState';
import { PageHeader, KpiGrid, ListPanel } from '@/components/common/layout';
import { LoadingCard } from '@/components/common/LoadingCard';
import { useBreadcrumbs } from '@/components/layout/AppShellChromeContext';
import { QuestionnaireMatrixDisplay } from '@/components/matrix/QuestionnaireMatrixDisplay';
import { useParticipantSession, useParticipantSessionMatrix } from '@/hooks/participantSession';
import { exportResultsPdf } from '@/lib/exportResultsPdf';
import { buildDimensions } from '@/lib/results/buildDimensions';
import { useToast } from '@/lib/toast';

export const Route = createFileRoute('/_participant/campaigns/$campaignId/results')({
    component: ParticipantResultsRoute,
});

const RESULTS_SUBTITLE =
    'Comparaison détaillée entre le Regard sur soi, les retours pairs et l’analyse scientifique, avec écart absolu entre les paires « je suis / je veux ».';

const ELEMENT_HUMAIN_TOOLTIP =
    'Le test scientifique correspond à l’Élément Humain de Will Schutz : un instrument psychométique qui mesure vos besoins relationnels (Inclusion / Contrôle / Ouverture) et l’écart entre vos comportements actuels et souhaités.';

function ParticipantResultsRoute() {
    const { campaignId: campaignIdParam } = Route.useParams();
    const campaignId = Number(campaignIdParam);

    const { data: session, isLoading: sessionLoading, isError: sessionError } = useParticipantSession();
    const toast = useToast();

    const assignment = React.useMemo(() => {
        if (!session) return undefined;
        return session.assignments.find(a => a.campaign_id === campaignId);
    }, [session, campaignId]);

    const campaignName = assignment?.campaign_name ?? 'Campagne';
    const campaignPath = Number.isFinite(campaignId) ? `/campaigns/${campaignId}` : '/campaigns';

    useBreadcrumbs([
        { label: 'Mes campagnes', to: '/campaigns' },
        { label: campaignName, to: campaignPath },
        { label: 'Résultats' },
    ]);

    const qid = assignment?.questionnaire_id ?? '';

    const { data: matrix, isLoading: matrixLoading } = useParticipantSessionMatrix(
        qid.length > 0,
        qid,
        Number.isFinite(campaignId) ? campaignId : undefined,
        'received'
    );

    const hasResults =
        matrix != null &&
        (matrix.self_response_id != null || matrix.peer_columns.length > 0 || matrix.scientific_response_id != null);

    const isLoading = sessionLoading || matrixLoading;
    const coachName = assignment?.coach_name ?? '–';
    const peerCount = matrix?.peer_columns.length ?? 0;

    const dimensions = React.useMemo(() => (matrix ? buildDimensions(matrix) : []), [matrix]);
    const participantName = session ? `${session.first_name} ${session.last_name}` : '';

    const activeSourceCount = [
        matrix?.self_response_id != null,
        peerCount > 0,
        matrix?.scientific_response_id != null,
    ].filter(Boolean).length;

    const [pdfPending, setPdfPending] = React.useState(false);

    const handleExportPdf = async () => {
        if (pdfPending || !matrix || dimensions.length === 0) {
            return;
        }
        setPdfPending(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 0));
            exportResultsPdf({
                participantName,
                campaignName,
                coachName,
                questionnaireId: matrix.questionnaire_id,
                peerCount,
                likertMax: matrix.likert_max,
                dimensions,
            });
            toast.success('Synthèse PDF téléchargée.');
        } catch (err) {
            toast.error(err instanceof Error && err.message ? err.message : "Échec de l'export PDF.");
        } finally {
            setPdfPending(false);
        }
    };

    if (isLoading) {
        return <LoadingCard title="Chargement des résultats" />;
    }

    if (sessionError || !session) {
        return <Alert severity="error">Impossible de charger vos résultats pour le moment.</Alert>;
    }

    if (!assignment) {
        return (
            <Stack spacing={2} sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    Aucune campagne trouvée pour cet identifiant.
                </Typography>
                <MuiLink component={Link} to="/campaigns" underline="hover" sx={{ fontWeight: 600 }}>
                    Retour aux campagnes
                </MuiLink>
            </Stack>
        );
    }

    return (
        <Stack spacing={3} sx={{ minWidth: 0 }}>
            <Box>
                <PageHeader
                    title="Résultats"
                    subtitle={RESULTS_SUBTITLE}
                    action={
                        hasResults
                            ? {
                                  label: pdfPending ? 'Génération du PDF…' : 'Exporter en PDF',
                                  onClick: () => void handleExportPdf(),
                                  icon: Download,
                              }
                            : undefined
                    }
                />
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                        {campaignName} · Coach {coachName}
                    </Typography>
                    <Tooltip title={ELEMENT_HUMAIN_TOOLTIP} arrow>
                        <Box
                            component="span"
                            sx={{ display: 'inline-flex', color: 'text.secondary', cursor: 'help' }}
                            aria-label="Définition de l'Élément Humain"
                        >
                            <HelpCircle size={14} />
                        </Box>
                    </Tooltip>
                </Stack>
            </Box>

            <KpiGrid columns={4}>
                <KpiCard label="Feedbacks pairs" value={peerCount} helper="reçus" icon={Users} />
                <KpiCard
                    label="Dimensions"
                    value={dimensions.length}
                    helper="analysées"
                    icon={Radar}
                />
                <KpiCard label="Sources" value={activeSourceCount} helper="comparées" icon={Target} />
                <KpiCard label="Coach" value="Référent" helper={coachName} icon={UserRound} />
            </KpiGrid>

            <ListPanel
                title="Matrice comparée"
                subtitle="Regard sur soi, retours pairs et test scientifique côte à côte."
                headerBorder
            >
                {!hasResults ? (
                    <Box sx={{ px: { xs: 2.5, md: 4 }, py: 4 }}>
                        <EmptyState
                            icon={Radar}
                            variant="secondary"
                            title="Résultats indisponibles"
                            description="Complétez les étapes précédentes de votre parcours pour accéder à vos scores."
                        />
                    </Box>
                ) : (
                    <Box sx={{ px: { xs: 2, sm: 3 }, py: 3, overflow: 'visible' }}>
                        <QuestionnaireMatrixDisplay matrix={matrix} />
                    </Box>
                )}
            </ListPanel>
        </Stack>
    );
}
