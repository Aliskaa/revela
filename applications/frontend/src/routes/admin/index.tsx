import { SectionTitle } from '@/components/common/SectionTitle';
import { SkeletonTableRows } from '@/components/common/SkeletonRows';
import { StatCard } from '@/components/common/StatCard';
import { useAdminCampaigns, useAdminDashboard, useCoaches, useCompanies } from '@/hooks/admin';
import type { CampaignStatus } from '@aor/types';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { Link, createFileRoute } from '@tanstack/react-router';
import { ArrowRight, Building2, FileText, Plus, Target, UserRound, Users } from 'lucide-react';

export const Route = createFileRoute('/admin/')({
    component: AdminDashboardRoute,
});

const QUESTIONNAIRE_LABELS: Record<string, string> = {
    B: 'B — Comportement',
    F: 'F — Ressentis',
    S: 'S — Soi',
};

function StatusChip({ status }: { status: CampaignStatus }) {
    if (status === 'active') {
        return (
            <Chip
                label="Active"
                size="small"
                sx={{ borderRadius: 99, bgcolor: 'rgba(16,185,129,0.12)', color: 'rgb(4,120,87)' }}
            />
        );
    }
    if (status === 'closed' || status === 'archived') {
        return (
            <Chip
                label="Archivée"
                size="small"
                sx={{ borderRadius: 99, bgcolor: 'rgba(148,163,184,0.16)', color: 'rgb(100,116,139)' }}
            />
        );
    }
    return (
        <Chip
            label="Brouillon"
            size="small"
            sx={{ borderRadius: 99, bgcolor: 'rgba(255,204,0,0.16)', color: 'rgb(180,120,0)' }}
        />
    );
}

function AdminDashboardRoute() {
    const { data: dashboard, isLoading: dashboardLoading } = useAdminDashboard();
    const { data: campaigns = [], isLoading: campaignsLoading } = useAdminCampaigns();
    const { data: coaches = [], isLoading: coachesLoading } = useCoaches();
    const { data: companies = [] } = useCompanies();

    const isLoading = dashboardLoading || campaignsLoading || coachesLoading;

    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

    const companyName = (id: number) => companies.find(c => c.id === id)?.name ?? '–';
    const coachName = (id: number) => coaches.find(c => c.id === id)?.displayName ?? '–';

    const recentCampaigns = [...campaigns]
        .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
        .slice(0, 5);

    return (
        <Stack spacing={3}>
            <Card variant="outlined">
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Stack
                        spacing={2.5}
                        direction={{ xs: 'column', lg: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'start', lg: 'start' }}
                    >
                        <Box>
                            <Chip
                                label="Administration"
                                sx={{ borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main', mb: 1.5 }}
                            />
                            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                                Bienvenue sur Révéla !
                            </Typography>
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}
                            >
                                Le tableau de bord centralisé vous permet de visualiser rapidement l'état des campagnes,
                                des participants, des coachs et des questionnaires.
                            </Typography>
                        </Box>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
                            <Button
                                variant="contained"
                                disableElevation
                                component={Link}
                                to="/admin/campaigns"
                                startIcon={<Plus size={16} />}
                                sx={{ borderRadius: 3, bgcolor: 'primary.main' }}
                            >
                                Nouvelle campagne
                            </Button>
                            <Button variant="outlined" startIcon={<FileText size={16} />} sx={{ borderRadius: 3 }}>
                                Exporter
                            </Button>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                        xs: '1fr',
                        md: 'repeat(2, minmax(0, 1fr))',
                        xl: 'repeat(4, minmax(0, 1fr))',
                    },
                    gap: 2,
                }}
            >
                <StatCard
                    label="Campagnes actives"
                    value={activeCampaigns}
                    helper={`sur ${campaigns.length} campagne${campaigns.length !== 1 ? 's' : ''}`}
                    icon={Target}
                    loading={campaignsLoading}
                />
                <StatCard
                    label="Participants"
                    value={dashboard?.total_participants ?? '-'}
                    helper="accès ouverts"
                    icon={Users}
                    loading={dashboardLoading}
                />
                <StatCard
                    label="Entreprises"
                    value={dashboard?.total_companies ?? '-'}
                    helper="clients suivis"
                    icon={Building2}
                    loading={dashboardLoading}
                />
                <StatCard
                    label="Coachs"
                    value={coaches.length}
                    helper="utilisateurs actifs"
                    icon={UserRound}
                    loading={coachesLoading}
                />
            </Box>

            <Card variant="outlined">
                <CardContent sx={{ p: 2.5 }}>
                    <SectionTitle
                        title="Suivi des campagnes"
                        subtitle="Vue rapide des campagnes récentes et de leur état opérationnel."
                        action={
                            <Button component={Link} to="/admin/campaigns" variant="outlined" sx={{ borderRadius: 3 }}>
                                Voir toutes
                            </Button>
                        }
                    />

                    <Box sx={{ overflowX: 'auto' }}>
                        <Table sx={{ minWidth: 800 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Campagne</TableCell>
                                    <TableCell>Entreprise</TableCell>
                                    <TableCell>Coach</TableCell>
                                    <TableCell>Questionnaire</TableCell>
                                    <TableCell>Statut</TableCell>
                                    <TableCell>Créée le</TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isLoading ? (
                                    <SkeletonTableRows rows={3} columns={7} />
                                ) : (
                                    recentCampaigns.map(campaign => (
                                        <TableRow hover key={campaign.id}>
                                            <TableCell>
                                                <Typography fontWeight={700} color="text.primary">
                                                    {campaign.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{companyName(campaign.companyId)}</TableCell>
                                            <TableCell>{coachName(campaign.coachId)}</TableCell>
                                            <TableCell>
                                                {campaign.questionnaireId
                                                    ? (QUESTIONNAIRE_LABELS[campaign.questionnaireId] ??
                                                      campaign.questionnaireId)
                                                    : '–'}
                                            </TableCell>
                                            <TableCell>
                                                <StatusChip status={campaign.status} />
                                            </TableCell>
                                            <TableCell>
                                                {campaign.createdAt
                                                    ? new Date(campaign.createdAt).toLocaleDateString('fr-FR')
                                                    : '–'}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Button
                                                    href={`/admin/campaigns/${campaign.id}`}
                                                    variant="text"
                                                    endIcon={<ArrowRight size={16} />}
                                                >
                                                    Ouvrir
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                                {!isLoading && recentCampaigns.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                Aucune campagne pour le moment.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Box>
                </CardContent>
            </Card>
        </Stack>
    );
}
