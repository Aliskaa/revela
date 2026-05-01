import {
    Box,
    Button,
    Card,
    CardContent,
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

import { SectionTitle } from '@/components/common/SectionTitle';
import { SkeletonTableRows } from '@/components/common/SkeletonRows';
import { StatCard } from '@/components/common/cards';
import { CampaignStatusChip } from '@/components/common/chips';
import { EmptyTableRow } from '@/components/common/data-table';
import { KpiGrid, PageHeroCard } from '@/components/common/layout';
import { useAdminCampaigns, useAdminDashboard, useCoaches, useCompanies } from '@/hooks/admin';
import { questionnaireLabel } from '@/lib/labels';

export const Route = createFileRoute('/admin/')({
    component: AdminDashboardRoute,
});

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
            <PageHeroCard
                eyebrow="Administration"
                title="Bienvenue sur Révéla !"
                subtitle="Le tableau de bord centralisé vous permet de visualiser rapidement l'état des campagnes, des participants, des coachs et des questionnaires."
                actions={
                    <>
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
                    </>
                }
            />

            <KpiGrid columns={4}>
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
            </KpiGrid>

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
                                            <TableCell>{questionnaireLabel(campaign.questionnaireId)}</TableCell>
                                            <TableCell>
                                                <CampaignStatusChip status={campaign.status} />
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
                                    <EmptyTableRow colSpan={7} message="Aucune campagne pour le moment." />
                                )}
                            </TableBody>
                        </Table>
                    </Box>
                </CardContent>
            </Card>
        </Stack>
    );
}
