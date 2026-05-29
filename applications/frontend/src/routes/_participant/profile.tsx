import { AddParticipantToCampaignDrawerForm } from '@/components/admin/AddParticipantToCampaignDrawerForm';
import { ParticipantCampaignsTable } from '@/components/admin/participant-detail/ParticipantCampaignsTable';
import { ParticipantInfoCard } from '@/components/admin/participant-detail/ParticipantInfoCard';
import { Button } from '@/components/common/Button';
import { KpiCard } from '@/components/common/cards';
import { KpiGrid } from '@/components/common/layout';
import { surfaceCardSx } from '@/components/common/styles/listSurfaces';
import { useBreadcrumbs } from '@/components/layout/AppShellChromeContext';
import {
    useFetchParticipantSelfDataExport,
    useParticipantSession,
    useUpdateParticipantProfile,
} from '@/hooks/participantSession';
import { downloadParticipantExportJson, downloadParticipantExportPdf } from '@/lib/exportParticipantData';
import { useToast } from '@/lib/toast';
import type { Participant, ParticipantSession, UpdateParticipantProfileBody } from '@aor/types';
import {
    Alert,
    Box,
    Card,
    CardContent,
    Link as MuiLink,
    Skeleton,
    Stack,
    Typography,
} from '@mui/material';
import { Link, createFileRoute } from '@tanstack/react-router';
import { CheckCircle2, ClipboardList, FileJson, FileText, ShieldCheck, Target } from 'lucide-react';
import * as React from 'react';

export const Route = createFileRoute('/_participant/profile')({
    component: ParticipantProfileRoute,
});

const SKELETON_KEYS = ['stat-1', 'stat-2', 'stat-3'] as const;

const SUBTITLE =
    'Profil organisationnel, indicateurs d’activité et campagnes rattachées à votre espace participant.';

function participantFromSession(session: ParticipantSession): Participant {
    const activeAssignment =
        session.assignments.find(a => a.campaign_status === 'active') ?? session.assignments[0];
    const company =
        activeAssignment?.company_id && activeAssignment.company_name
            ? { id: activeAssignment.company_id, name: activeAssignment.company_name }
            : null;

    return {
        id: session.participant_id,
        first_name: session.first_name,
        last_name: session.last_name,
        full_name: `${session.first_name} ${session.last_name}`.trim() || 'Participant',
        email: session.email,
        company,
        organisation: session.organisation,
        direction: session.direction,
        service: session.service,
        function_level: session.function_level,
        created_at: null,
        created_by_coach_id: null,
        invite_status: {},
        response_count: 0,
    };
}

function ParticipantProfileRoute() {
    useBreadcrumbs([{ label: 'Mon profil' }]);

    const { data: session, isLoading, isError } = useParticipantSession();
    const updateProfile = useUpdateParticipantProfile();
    const fetchExport = useFetchParticipantSelfDataExport();
    const toast = useToast();

    const [editDrawerOpen, setEditDrawerOpen] = React.useState(false);

    const handleDownloadExport = async (format: 'json' | 'pdf') => {
        try {
            const data = await fetchExport.mutateAsync();
            if (format === 'json') {
                downloadParticipantExportJson(data);
            } else {
                downloadParticipantExportPdf(data);
            }
            toast.success(format === 'json' ? 'Export JSON téléchargé.' : 'Export PDF téléchargé.');
        } catch {
            toast.error('Impossible de générer l’export pour le moment. Réessayez plus tard.');
        }
    };

    if (isLoading) {
        return (
            <Stack
                spacing={3}
                role="status"
                aria-live="polite"
                aria-busy="true"
                aria-label="Chargement du profil"
            >
                <Skeleton variant="text" width={280} height={28} />
                <Skeleton variant="text" width="60%" height={48} />
                <KpiGrid columns={3}>
                    {SKELETON_KEYS.map(k => (
                        <Skeleton key={k} variant="rounded" height={140} />
                    ))}
                </KpiGrid>
                <Skeleton variant="rounded" height={400} />
            </Stack>
        );
    }

    if (isError || !session) {
        return <Alert severity="error">Impossible de charger votre profil pour le moment.</Alert>;
    }

    const participant = participantFromSession(session);
    const fullName = participant.full_name;
    const activeAssignment =
        session.assignments.find(a => a.campaign_status === 'active') ?? session.assignments[0];
    const companyName = activeAssignment?.company_name ?? null;

    const subtitleParts = [participant.email];
    if (companyName) {
        subtitleParts.push(companyName);
    }

    const activeCount = session.assignments.filter(a => a.campaign_status === 'active').length;
    const completedQuestionnaires = session.assignments.filter(
        a => a.progression?.element_humain_status === 'completed'
    ).length;

    const campaigns = session.assignments
        .filter((a): a is typeof a & { campaign_id: number } => typeof a.campaign_id === 'number')
        .map(a => ({
            campaign_id: a.campaign_id,
            campaign_name: a.campaign_name ?? 'Campagne',
            company_name: a.company_name,
            status: a.campaign_status ?? 'draft',
            joined_at: null,
        }));

    return (
        <Stack spacing={3} sx={{ minWidth: 0 }}>
            <AddParticipantToCampaignDrawerForm
                open={editDrawerOpen}
                mode="edit"
                title="Modifier mon profil"
                subtitle="Mettez à jour votre profil organisationnel."
                isSubmitting={updateProfile.isPending}
                initialValues={{
                    firstName: session.first_name,
                    lastName: session.last_name,
                    email: session.email,
                    organisation: session.organisation ?? '',
                    direction: session.direction ?? '',
                    service: session.service ?? '',
                    functionLevel: session.function_level ?? '',
                }}
                onClose={() => {
                    setEditDrawerOpen(false);
                    updateProfile.reset();
                }}
                onSubmit={async values => {
                    const body: UpdateParticipantProfileBody = {
                        organisation: values.organisation.trim() === '' ? null : values.organisation.trim(),
                        direction: values.direction.trim() === '' ? null : values.direction.trim(),
                        service: values.service.trim() === '' ? null : values.service.trim(),
                        function_level: values.functionLevel === '' ? null : values.functionLevel,
                    };
                    try {
                        await updateProfile.mutateAsync(body);
                        setEditDrawerOpen(false);
                    } catch {
                        // Toast émis par le hook ; on garde le drawer ouvert.
                    }
                }}
            />

            <Box>
                <Typography
                    variant="h3"
                    sx={{
                        color: 'primary.main',
                        fontWeight: 900,
                        letterSpacing: -0.03,
                        lineHeight: 1.1,
                        mb: 1,
                    }}
                >
                    {fullName}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720, lineHeight: 1.7 }}>
                    {subtitleParts.join(' — ')}. {SUBTITLE}
                </Typography>
            </Box>

            <KpiGrid columns={3}>
                <KpiCard
                    label="Campagnes"
                    value={session.assignments.length}
                    helper="rattachées"
                    icon={ClipboardList}
                />
                <KpiCard label="En cours" value={activeCount} helper="parcours actifs" icon={Target} />
                <KpiCard
                    label="Questionnaires complétés"
                    value={completedQuestionnaires}
                    helper="tests terminés"
                    icon={CheckCircle2}
                />
            </KpiGrid>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 0.85fr) minmax(0, 1.15fr)' },
                    gap: 3,
                    alignItems: 'start',
                }}
            >
                <ParticipantInfoCard participant={participant} onEdit={() => setEditDrawerOpen(true)} />

                <ParticipantCampaignsTable
                    campaigns={campaigns}
                    getDetailTo={campaignId => `/campaigns/${campaignId}`}
                    subtitle="Campagnes auxquelles vous êtes rattaché."
                />
            </Box>

            <Card variant="outlined" sx={{ ...surfaceCardSx, overflow: 'hidden' }}>
                <CardContent sx={{ p: 0 }}>
                    <Box
                        sx={{
                            px: { xs: 2.5, md: 3 },
                            pt: 3,
                            pb: 2,
                            borderBottom: '1px solid',
                            borderColor: 'surface.lavenderGrey',
                        }}
                    >
                        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 0.5 }}>
                            <Box
                                component="span"
                                sx={{ color: 'primary.main', display: 'inline-flex', flexShrink: 0 }}
                            >
                                <ShieldCheck size={20} strokeWidth={1.75} aria-hidden />
                            </Box>
                            <Typography variant="h6" fontWeight={700} color="primary.main">
                                Mes données (RGPD)
                            </Typography>
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                            Téléchargez l’ensemble des données que nous traitons à votre sujet.
                        </Typography>
                    </Box>

                    <Box sx={{ px: { xs: 2.5, md: 3 }, py: 2.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 2 }}>
                            Conformément aux articles 15 et 20 du RGPD, vous pouvez télécharger l'ensemble des données
                            que nous traitons à votre sujet : profil, métadonnées professionnelles, campagnes
                            auxquelles vous êtes rattaché·e et historique de vos réponses. Choisissez le format qui
                            vous convient : JSON (lisible par un autre service) ou PDF (lisible humain).
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 2.5 }}>
                            Pour le détail des finalités, durées de conservation et autres droits (rectification,
                            effacement), consultez la{' '}
                            <MuiLink component={Link} to="/confidentiality" underline="always">
                                politique de confidentialité
                            </MuiLink>
                            .
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                            <Button
                                appearance="primary"
                                startIcon={<FileJson size={16} />}
                                onClick={() => handleDownloadExport('json')}
                                disabled={fetchExport.isPending}
                                sx={{ width: { xs: '100%', sm: 'auto' } }}
                            >
                                {fetchExport.isPending ? 'Préparation…' : 'Télécharger en JSON'}
                            </Button>
                            <Button
                                appearance="secondary"
                                startIcon={<FileText size={16} />}
                                onClick={() => handleDownloadExport('pdf')}
                                disabled={fetchExport.isPending}
                                sx={{ width: { xs: '100%', sm: 'auto' } }}
                            >
                                {fetchExport.isPending ? 'Préparation…' : 'Télécharger en PDF'}
                            </Button>
                        </Stack>
                    </Box>
                </CardContent>
            </Card>
        </Stack>
    );
}
