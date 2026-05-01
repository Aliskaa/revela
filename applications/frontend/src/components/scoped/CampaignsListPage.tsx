// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

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
    TextField,
    Typography,
} from '@mui/material';
import { ChevronRight, ClipboardList, Plus, Sparkles, Target, Users } from 'lucide-react';
import * as React from 'react';

import { AdminCampaignDrawerForm } from '@/components/admin/AdminCampaignDrawerForm';
import { SectionTitle } from '@/components/common/SectionTitle';
import { SkeletonCards, SkeletonTableRows } from '@/components/common/SkeletonRows';
import { StatCard } from '@/components/common/cards';
import { CampaignStatusChip } from '@/components/common/chips';
import { EmptyTableRow, StandardTablePagination } from '@/components/common/data-table';
import { KpiGrid, PageHeroCard } from '@/components/common/layout';
import { useAdminCampaigns, useAdminDashboard, useCoaches, useCompanies, useCreateAdminCampaign } from '@/hooks/admin';
import { parseAdminJwtClaims } from '@/lib/auth';
import { questionnaireLabel } from '@/lib/labels';
import { useTablePagination } from '@/lib/useTablePagination';

export type CampaignsListScope = 'admin' | 'coach';

export type CampaignsListPageProps = {
    scope: CampaignsListScope;
};

const SCOPE_LABELS: Record<
    CampaignsListScope,
    { eyebrow: string; title: string; subtitle: string; statsLabel: string; statsHelper: string }
> = {
    admin: {
        eyebrow: 'Campagnes',
        title: 'Campagnes',
        subtitle: 'Visualisez les campagnes existantes, leur statut et leur progression.',
        statsLabel: 'Campagnes',
        statsHelper: 'dans le système',
    },
    coach: {
        eyebrow: 'Mes campagnes',
        title: 'Campagnes attribuées',
        subtitle:
            'Toutes les campagnes que vous accompagnez. Cliquez sur « Détail » pour ouvrir leur cockpit (participants, soumissions, statut).',
        statsLabel: 'Mes campagnes',
        statsHelper: 'dans mon périmètre',
    },
};

/**
 * Liste de campagnes — unifie `admin/campaigns` et `coach/campaigns`. Le scope contrôle :
 *  - les libellés (eyebrow, titre, sous-titre, stats) ;
 *  - le préfixe de lien vers le détail (`/admin/campaigns/$id` vs `/coach/campaigns/$id`) ;
 *  - l'affichage de la colonne « Coach » (admin uniquement) ;
 *  - le pré-remplissage `lockedCoachId` côté coach via les claims JWT (le backend force déjà
 *    `coach_id = req.user.coachId` mais on aligne l'UI pour ne pas afficher un Select inutile) ;
 *  - le KPI « Participants » (admin only — repose sur `useAdminDashboard`) vs « Entreprises » (coach).
 */
export function CampaignsListPage({ scope }: CampaignsListPageProps) {
    const isAdmin = scope === 'admin';
    const labels = SCOPE_LABELS[scope];
    const detailPathPrefix = isAdmin ? '/admin/campaigns' : '/coach/campaigns';

    const [search, setSearch] = React.useState('');
    const [drawerOpen, setDrawerOpen] = React.useState(false);

    const { data: campaigns = [], isLoading: campaignsLoading } = useAdminCampaigns();
    const { data: coaches = [], isLoading: coachesLoading } = useCoaches();
    const { data: companies = [] } = useCompanies();
    const { data: dashboard, isLoading: dashboardLoading } = useAdminDashboard();
    const createCampaign = useCreateAdminCampaign();

    // Côté coach : on lit l'id depuis le JWT pour pré-remplir et masquer le champ « Coach » du form.
    const claims = parseAdminJwtClaims();
    const lockedCoachId = !isAdmin && claims?.scope === 'coach' ? claims.coachId : undefined;

    const isLoading = campaignsLoading || (isAdmin && coachesLoading);

    const companyName = (id: number) => companies.find(c => c.id === id)?.name ?? '–';
    const coachName = (id: number) => coaches.find(c => c.id === id)?.displayName ?? '–';
    const questionnairesUsed = new Set(campaigns.map(c => c.questionnaireId).filter(Boolean)).size;

    const filtered = React.useMemo(() => {
        const q = search.toLowerCase();
        return campaigns.filter(c => {
            const company = companies.find(co => co.id === c.companyId)?.name ?? '';
            const coach = coaches.find(co => co.id === c.coachId)?.displayName ?? '';
            const matchesScope = isAdmin
                ? company.toLowerCase().includes(q) || coach.toLowerCase().includes(q)
                : company.toLowerCase().includes(q);
            return c.name.toLowerCase().includes(q) || matchesScope;
        });
    }, [campaigns, coaches, companies, isAdmin, search]);

    const { page, rowsPerPage, paged, setPage, setRowsPerPage } = useTablePagination({
        items: filtered,
        resetWhen: [search],
    });

    const desktopColumns = isAdmin ? 7 : 6;

    return (
        <Stack spacing={3}>
            <AdminCampaignDrawerForm
                open={drawerOpen}
                mode="create"
                lockedCoachId={lockedCoachId}
                onClose={() => {
                    setDrawerOpen(false);
                    createCampaign.reset();
                }}
                onSubmit={async values => {
                    try {
                        await createCampaign.mutateAsync({
                            name: values.name,
                            companyId: values.companyId,
                            coachId: values.coachId,
                            questionnaireId: values.questionnaireId,
                            startsAt: values.startDate ? new Date(values.startDate).toISOString() : null,
                            endsAt: values.endDate ? new Date(values.endDate).toISOString() : null,
                            allowTestWithoutManualInputs: values.allowTestWithoutManualInputs,
                            status: values.status,
                        });
                        setDrawerOpen(false);
                    } catch {
                        // Le toast d'erreur est émis par le hook ; on garde le drawer ouvert.
                    }
                }}
                isSubmitting={createCampaign.isPending}
            />

            <PageHeroCard
                eyebrow={labels.eyebrow}
                title={labels.title}
                subtitle={labels.subtitle}
                actions={
                    <Button
                        variant="contained"
                        disableElevation
                        startIcon={<Plus size={16} />}
                        onClick={() => setDrawerOpen(true)}
                        sx={{ borderRadius: 3, bgcolor: 'primary.main' }}
                    >
                        Nouvelle campagne
                    </Button>
                }
            />

            <KpiGrid columns={4}>
                <StatCard
                    label={labels.statsLabel}
                    value={campaigns.length}
                    helper={labels.statsHelper}
                    icon={ClipboardList}
                    loading={campaignsLoading}
                />
                <StatCard
                    label="Actives"
                    value={campaigns.filter(c => c.status === 'active').length}
                    helper="en cours"
                    icon={Target}
                    loading={campaignsLoading}
                />
                {isAdmin ? (
                    <StatCard
                        label="Participants"
                        value={dashboard?.total_participants ?? '–'}
                        helper="rattachés"
                        icon={Users}
                        loading={dashboardLoading}
                    />
                ) : (
                    <StatCard
                        label="Entreprises"
                        value={new Set(campaigns.map(c => c.companyId)).size}
                        helper="rattachées"
                        icon={Users}
                        loading={campaignsLoading}
                    />
                )}
                <StatCard
                    label="Questionnaires"
                    value={questionnairesUsed}
                    helper="B / F / S"
                    icon={Sparkles}
                    loading={campaignsLoading}
                />
            </KpiGrid>

            <Card variant="outlined">
                <CardContent sx={{ p: 2.5 }}>
                    <SectionTitle
                        title="Liste des campagnes"
                        subtitle={
                            isAdmin
                                ? "La table permet de comparer rapidement les campagnes et d'ouvrir leur détail."
                                : "La table permet de comparer rapidement vos campagnes et d'ouvrir leur détail."
                        }
                        action={
                            <TextField
                                size="small"
                                placeholder="Rechercher…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                sx={{ minWidth: 260 }}
                            />
                        }
                    />

                    {/* Desktop table */}
                    <Box sx={{ display: { xs: 'none', lg: 'block' }, overflowX: 'auto' }}>
                        <Table sx={{ minWidth: isAdmin ? 1000 : 900 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Campagne</TableCell>
                                    <TableCell>Entreprise</TableCell>
                                    {isAdmin ? <TableCell>Coach</TableCell> : null}
                                    <TableCell>Questionnaire</TableCell>
                                    <TableCell>Statut</TableCell>
                                    <TableCell>Créée le</TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isLoading ? (
                                    <SkeletonTableRows rows={4} columns={desktopColumns} />
                                ) : (
                                    paged.map(campaign => (
                                        <TableRow hover key={campaign.id}>
                                            <TableCell>
                                                <Typography fontWeight={700} color="text.primary">
                                                    {campaign.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{companyName(campaign.companyId)}</TableCell>
                                            {isAdmin ? <TableCell>{coachName(campaign.coachId)}</TableCell> : null}
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
                                                    href={`${detailPathPrefix}/${campaign.id}`}
                                                    variant="text"
                                                    endIcon={<ChevronRight size={16} />}
                                                >
                                                    Détail
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                                {!isLoading && filtered.length === 0 && (
                                    <EmptyTableRow
                                        colSpan={desktopColumns}
                                        message={
                                            search
                                                ? 'Aucune campagne ne correspond à la recherche.'
                                                : 'Aucune campagne pour le moment.'
                                        }
                                    />
                                )}
                            </TableBody>
                        </Table>
                        {filtered.length > 0 && (
                            <StandardTablePagination
                                count={filtered.length}
                                page={page}
                                rowsPerPage={rowsPerPage}
                                onPageChange={setPage}
                                onRowsPerPageChange={setRowsPerPage}
                            />
                        )}
                    </Box>

                    {/* Mobile cards */}
                    <Stack spacing={2} sx={{ display: { xs: 'flex', lg: 'none' }, mt: 2 }}>
                        {isLoading ? (
                            <SkeletonCards count={3} height={160} />
                        ) : (
                            filtered.map(campaign => (
                                <Card variant="outlined" key={campaign.id}>
                                    <CardContent sx={{ p: 2.5 }}>
                                        <Stack spacing={2}>
                                            <Stack
                                                direction="row"
                                                justifyContent="space-between"
                                                alignItems="start"
                                                spacing={2}
                                            >
                                                <Box>
                                                    <Typography variant="h6" fontWeight={800} color="text.primary">
                                                        {campaign.name}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{ mt: 0.5, lineHeight: 1.7 }}
                                                    >
                                                        {companyName(campaign.companyId)}
                                                        {isAdmin ? ` · Coach ${coachName(campaign.coachId)}` : ''}
                                                    </Typography>
                                                </Box>
                                                <CampaignStatusChip status={campaign.status} />
                                            </Stack>

                                            <Box
                                                sx={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                                    gap: 1.2,
                                                }}
                                            >
                                                <StatCard
                                                    variant="mini"
                                                    label="Questionnaire"
                                                    value={questionnaireLabel(campaign.questionnaireId)}
                                                />
                                                <StatCard
                                                    variant="mini"
                                                    label="Créée le"
                                                    value={
                                                        campaign.createdAt
                                                            ? new Date(campaign.createdAt).toLocaleDateString('fr-FR')
                                                            : '–'
                                                    }
                                                />
                                            </Box>

                                            <Button
                                                variant="contained"
                                                disableElevation
                                                href={`${detailPathPrefix}/${campaign.id}`}
                                                endIcon={<ChevronRight size={16} />}
                                                sx={{ borderRadius: 3, bgcolor: 'primary.main', width: 'fit-content' }}
                                            >
                                                Ouvrir
                                            </Button>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                        {!isLoading && filtered.length === 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                {search
                                    ? 'Aucune campagne ne correspond à la recherche.'
                                    : 'Aucune campagne pour le moment.'}
                            </Typography>
                        )}
                    </Stack>
                </CardContent>
            </Card>
        </Stack>
    );
}
