// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Box,
    Button,
    Card,
    CardContent,
    InputAdornment,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { Link } from '@tanstack/react-router';
import { ChevronRight, ClipboardList, Plus, Search, Sparkles, Target, Users } from 'lucide-react';
import * as React from 'react';

import { AdminCampaignDrawerForm } from '@/components/admin/AdminCampaignDrawerForm';
import {
    HARMONIZED_LAVENDER_GREY,
    harmonizedListPanelSx,
    harmonizedListTableHeadCellSx,
} from '@/components/admin/campaign-detail/campaignDetailHarmonizedStyles';
import { SectionTitle } from '@/components/common/SectionTitle';
import { SkeletonCards, SkeletonTableRows } from '@/components/common/SkeletonRows';
import { KpiCard, StatCard } from '@/components/common/cards';
import { CampaignStatusChip } from '@/components/common/chips';
import { EmptyTableRow, OpenDetailButton, StandardTablePagination } from '@/components/common/data-table';
import { KpiGrid, PageHeroCard } from '@/components/common/layout';
import { useHarmonizedBreadcrumbs } from '@/components/layout/HarmonizedChromeContext';
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
        subtitle:
            'Visualisez les campagnes existantes, leur statut et leur progression en temps réel pour optimiser le coaching opérationnel.',
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

function companyInitial(name: string): string {
    const trimmed = name.trim();
    return trimmed ? trimmed[0].toUpperCase() : '?';
}

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
    useHarmonizedBreadcrumbs(isAdmin ? [{ label: 'Administration' }, { label: 'Campagnes' }] : []);
    const labels = SCOPE_LABELS[scope];
    const detailPathPrefix = isAdmin ? '/admin/campaigns' : '/coach/campaigns';
    const [search, setSearch] = React.useState('');
    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const { data: campaigns = [], isLoading: campaignsLoading } = useAdminCampaigns();
    const { data: coaches = [], isLoading: coachesLoading } = useCoaches();
    const { data: companies = [] } = useCompanies();
    const { data: dashboard, isLoading: dashboardLoading } = useAdminDashboard();
    const createCampaign = useCreateAdminCampaign();
    const claims = parseAdminJwtClaims();
    const lockedCoachId = !isAdmin && claims?.scope === 'coach' ? claims.coachId : undefined;
    const isLoading = campaignsLoading || (isAdmin && coachesLoading);
    const companyName = (id: number) => companies.find(c => c.id === id)?.name ?? '–';
    const coachName = (id: number) => coaches.find(c => c.id === id)?.displayName ?? '–';
    const questionnairesUsed = new Set(campaigns.map(c => c.questionnaireId).filter(Boolean)).size;
    const activeCount = campaigns.filter(c => c.status === 'active').length;
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
    const drawer = isAdmin ? (
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
    ) : null;
    if (isAdmin) {
        return (
            <Stack spacing={4}>
                {drawer}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        alignItems: { md: 'flex-end' },
                        justifyContent: 'space-between',
                        gap: 3,
                    }}
                >
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
                            {labels.title}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 560, lineHeight: 1.7 }}>
                            {labels.subtitle}
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        disableElevation
                        startIcon={<Plus size={18} />}
                        onClick={() => setDrawerOpen(true)}
                        sx={{
                            bgcolor: 'primary.main',
                            px: 4,
                            py: 1.75,
                            borderRadius: 3,
                            fontWeight: 700,
                            boxShadow: '0 10px 20px rgba(15, 24, 152, 0.2)',
                            alignSelf: { xs: 'flex-start', md: 'auto' },
                            '&:hover': {
                                bgcolor: 'primary.dark',
                                transform: 'translateY(-2px)',
                                boxShadow: theme => theme.palette.shadow.brandSubtle,
                            },
                        }}
                    >
                        Nouvelle campagne
                    </Button>
                </Box>
                <KpiGrid columns={4}>
                    <KpiCard
                        label={labels.statsLabel}
                        value={campaignsLoading ? '–' : campaigns.length}
                        helper={labels.statsHelper}
                        icon={ClipboardList}
                    />
                    <KpiCard
                        label="Actives"
                        value={campaignsLoading ? '–' : activeCount}
                        helper="en cours"
                        icon={Target}
                    />
                    <KpiCard
                        label="Participants"
                        value={dashboardLoading ? '–' : (dashboard?.total_participants ?? '–')}
                        helper="rattachés"
                        icon={Users}
                    />
                    <KpiCard
                        label="Questionnaires"
                        value={campaignsLoading ? '–' : questionnairesUsed}
                        helper="B / F / S"
                        icon={Sparkles}
                    />
                </KpiGrid>
                <Card variant="outlined" sx={harmonizedListPanelSx}>
                    <Box
                        sx={{
                            px: { xs: 2.5, md: 4 },
                            py: { xs: 3, md: 4 },
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: { sm: 'center' },
                            justifyContent: 'space-between',
                            gap: 3,
                        }}
                    >
                        <Box>
                            <Typography variant="h6" fontWeight={800} color="primary.main" sx={{ mb: 0.5 }}>
                                Liste des campagnes
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                Gérez et suivez le déploiement de vos sessions de coaching.
                            </Typography>
                        </Box>
                        <TextField
                            size="small"
                            placeholder="Rechercher une campagne…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search size={18} color="rgba(107, 114, 128, 0.7)" />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                            sx={{
                                width: { xs: '100%', sm: 320 },
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: HARMONIZED_LAVENDER_GREY,
                                    borderRadius: 3,
                                    py: 0.75,
                                    '& fieldset': { border: 'none' },
                                    '&:hover fieldset': { border: 'none' },
                                    '&.Mui-focused fieldset': {
                                        border: '2px solid rgba(15, 24, 152, 0.2)',
                                    },
                                },
                            }}
                        />
                    </Box>
                    <Box sx={{ display: { xs: 'none', lg: 'block' }, overflowX: 'auto' }}>
                        <Table sx={{ minWidth: 1000 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ ...harmonizedListTableHeadCellSx, pl: 4 }}>Statut</TableCell>
                                    <TableCell sx={harmonizedListTableHeadCellSx}>Campagne</TableCell>
                                    <TableCell sx={harmonizedListTableHeadCellSx}>Entreprise</TableCell>
                                    <TableCell sx={harmonizedListTableHeadCellSx}>Coach</TableCell>
                                    <TableCell sx={harmonizedListTableHeadCellSx}>Questionnaire</TableCell>
                                    <TableCell sx={harmonizedListTableHeadCellSx}>Créée le</TableCell>
                                    <TableCell align="right" sx={{ ...harmonizedListTableHeadCellSx, pr: 4 }}>
                                        Actions
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isLoading ? (
                                    <SkeletonTableRows rows={4} columns={7} />
                                ) : (
                                    paged.map(campaign => {
                                        const company = companyName(campaign.companyId);
                                        return (
                                            <TableRow
                                                hover
                                                key={campaign.id}
                                                sx={{
                                                    '&:hover': { bgcolor: 'rgba(245, 245, 251, 0.8)' },
                                                    '& td': { borderColor: 'rgba(245, 245, 251, 0.8)' },
                                                }}
                                            >
                                                <TableCell sx={{ pl: 4, py: 2.5 }}>
                                                    <CampaignStatusChip status={campaign.status} />
                                                </TableCell>
                                                <TableCell sx={{ py: 2.5 }}>
                                                    <Typography fontWeight={700} color="primary.main">
                                                        {campaign.name}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 2.5 }}>
                                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                                        <Box
                                                            sx={{
                                                                width: 32,
                                                                height: 32,
                                                                borderRadius: 2,
                                                                bgcolor: 'rgba(255, 152, 0, 0.12)',
                                                                color: 'rgb(234, 88, 12)',
                                                                display: 'grid',
                                                                placeItems: 'center',
                                                                fontWeight: 800,
                                                                fontSize: '0.75rem',
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            {companyInitial(company)}
                                                        </Box>
                                                        <Typography color="text.secondary" fontWeight={600}>
                                                            {company}
                                                        </Typography>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell sx={{ py: 2.5 }}>
                                                    <Typography color="text.secondary" fontWeight={600}>
                                                        {coachName(campaign.coachId)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 2.5 }}>
                                                    <Typography color="text.secondary" fontWeight={600}>
                                                        {questionnaireLabel(campaign.questionnaireId)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 2.5 }}>
                                                    <Typography color="text.secondary" sx={{ opacity: 0.85 }}>
                                                        {campaign.createdAt
                                                            ? new Date(campaign.createdAt).toLocaleDateString('fr-FR')
                                                            : '–'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right" sx={{ pr: 4, py: 2.5 }}>
                                                    <Typography
                                                        component={Link}
                                                        to={`${detailPathPrefix}/${campaign.id}`}
                                                        sx={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: 0.5,
                                                            color: 'primary.main',
                                                            fontWeight: 700,
                                                            fontSize: '0.875rem',
                                                            textDecoration: 'none',
                                                            transition: 'transform 0.2s ease',
                                                            '.MuiTableRow-root:hover &': {
                                                                transform: 'translateX(4px)',
                                                            },
                                                            '&:hover': { textDecoration: 'underline' },
                                                        }}
                                                    >
                                                        Ouvrir
                                                        <ChevronRight size={16} />
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                                {!isLoading && filtered.length === 0 && (
                                    <EmptyTableRow
                                        colSpan={7}
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
                            <Box sx={{ borderTop: `1px solid ${HARMONIZED_LAVENDER_GREY}`, px: 2 }}>
                                <StandardTablePagination
                                    count={filtered.length}
                                    page={page}
                                    rowsPerPage={rowsPerPage}
                                    onPageChange={setPage}
                                    onRowsPerPageChange={setRowsPerPage}
                                />
                            </Box>
                        )}
                    </Box>
                    <Stack spacing={2} sx={{ display: { xs: 'flex', lg: 'none' }, p: 2.5 }}>
                        {isLoading ? (
                            <SkeletonCards count={3} height={160} />
                        ) : (
                            filtered.map(campaign => (
                                <Card variant="outlined" key={campaign.id} sx={{ borderRadius: 3 }}>
                                    <CardContent sx={{ p: 2.5 }}>
                                        <Stack spacing={2}>
                                            <Stack
                                                direction="row"
                                                justifyContent="space-between"
                                                alignItems="start"
                                                spacing={2}
                                            >
                                                <Box>
                                                    <Typography variant="h6" fontWeight={800} color="primary.main">
                                                        {campaign.name}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                        {companyName(campaign.companyId)} · Coach{' '}
                                                        {coachName(campaign.coachId)}
                                                    </Typography>
                                                </Box>
                                                <CampaignStatusChip status={campaign.status} />
                                            </Stack>
                                            <OpenDetailButton
                                                to={`${detailPathPrefix}/${campaign.id}`}
                                                variant="card"
                                            />
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
                </Card>
            </Stack>
        );
    }
    return (
        <Stack spacing={3}>
            <PageHeroCard eyebrow={labels.eyebrow} title={labels.title} subtitle={labels.subtitle} />
            <KpiGrid columns={4}>
                <KpiCard
                    label={labels.statsLabel}
                    value={campaigns.length}
                    helper={labels.statsHelper}
                    icon={ClipboardList}
                    loading={campaignsLoading}
                />
                <KpiCard
                    label="Actives"
                    value={campaigns.filter(c => c.status === 'active').length}
                    helper="en cours"
                    icon={Target}
                    loading={campaignsLoading}
                />
                <KpiCard
                    label="Entreprises"
                    value={new Set(campaigns.map(c => c.companyId)).size}
                    helper="rattachées"
                    icon={Users}
                    loading={campaignsLoading}
                />
                <KpiCard
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
                        subtitle="La table permet de comparer rapidement vos campagnes et d'ouvrir leur détail."
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
                    <Box sx={{ display: { xs: 'none', lg: 'block' }, overflowX: 'auto' }}>
                        <Table sx={{ minWidth: 900 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell />
                                    <TableCell>Campagne</TableCell>
                                    <TableCell>Entreprise</TableCell>
                                    <TableCell>Questionnaire</TableCell>
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
                                                <CampaignStatusChip status={campaign.status} />
                                            </TableCell>
                                            <TableCell>
                                                <Typography fontWeight={700} color="text.primary">
                                                    {campaign.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{companyName(campaign.companyId)}</TableCell>
                                            <TableCell>{questionnaireLabel(campaign.questionnaireId)}</TableCell>
                                            <TableCell>
                                                {campaign.createdAt
                                                    ? new Date(campaign.createdAt).toLocaleDateString('fr-FR')
                                                    : '–'}
                                            </TableCell>
                                            <TableCell align="right">
                                                <OpenDetailButton to={`${detailPathPrefix}/${campaign.id}`} />
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
                                            <OpenDetailButton
                                                to={`${detailPathPrefix}/${campaign.id}`}
                                                variant="card"
                                            />
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
