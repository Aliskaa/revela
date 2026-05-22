// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    InputAdornment,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TableSortLabel,
    TextField,
    Typography,
} from '@mui/material';
import { Link } from '@tanstack/react-router';
import { Building2, ChevronRight, ClipboardList, Plus, Search, Users } from 'lucide-react';
import * as React from 'react';

import type { AdminCampaign } from '@aor/types';

import { AdminCompanyDrawerForm } from '@/components/admin/AdminCompanyDrawerForm';
import {
    HARMONIZED_LAVENDER_GREY,
    harmonizedListPanelSx,
    harmonizedListTableHeadCellSx,
} from '@/components/admin/campaign-detail/campaignDetailHarmonizedStyles';
import { SectionTitle } from '@/components/common/SectionTitle';
import { SkeletonCards, SkeletonTableRows } from '@/components/common/SkeletonRows';
import { KpiCard, StatCard } from '@/components/common/cards';
import { EmptyTableRow, OpenDetailButton, StandardTablePagination } from '@/components/common/data-table';
import { KpiGrid, PageHeroCard } from '@/components/common/layout';
import { useHarmonizedBreadcrumbs } from '@/components/layout/HarmonizedChromeContext';
import { useAdminCampaigns, useCompanies, useCreateCompany } from '@/hooks/admin';
import { useTablePagination } from '@/lib/useTablePagination';

export type CompaniesListScope = 'admin' | 'coach';

export type CompaniesListPageProps = {
    scope: CompaniesListScope;
};

type SortKey = 'name' | 'contact_name' | 'participant_count';
type SortOrder = 'asc' | 'desc';

const SCOPE_LABELS: Record<
    CompaniesListScope,
    { eyebrow: string; title: string; subtitle: string; statsHelper: string; emptyMessage: string }
> = {
    admin: {
        eyebrow: 'Entreprises',
        title: 'Entreprises',
        subtitle:
            'Référentiel des entreprises clientes, avec leurs campagnes actives, leurs participants rattachés et leurs points de contact privilégiés.',
        statsHelper: 'référencées',
        emptyMessage: 'Aucune entreprise pour le moment.',
    },
    coach: {
        eyebrow: 'Mes entreprises',
        title: 'Entreprises rattachées',
        subtitle:
            'Référentiel des entreprises ayant au moins une de vos campagnes attribuées, avec leurs participants et leurs contacts.',
        statsHelper: 'rattachées',
        emptyMessage: 'Aucune entreprise rattachée à vos campagnes pour le moment.',
    },
};

function companyInitial(name: string): string {
    const trimmed = name.trim();
    return trimmed ? trimmed[0].toUpperCase() : '?';
}

type CompanyListStatus = 'active' | 'pause' | 'inactive';

function resolveCompanyListStatus(companyId: number, campaigns: AdminCampaign[]): CompanyListStatus {
    const companyCampaigns = campaigns.filter(c => c.companyId === companyId);
    if (companyCampaigns.length === 0) return 'inactive';
    if (companyCampaigns.some(c => c.status === 'active')) return 'active';
    return 'pause';
}

const COMPANY_STATUS_PILL: Record<CompanyListStatus, { label: string; bg: string; color: string }> = {
    active: { label: 'Actif', bg: 'rgba(16, 185, 129, 0.12)', color: 'rgb(4, 120, 87)' },
    pause: { label: 'Pause', bg: HARMONIZED_LAVENDER_GREY, color: 'rgba(69, 70, 83, 0.85)' },
    inactive: { label: 'Inactif', bg: 'rgba(148, 163, 184, 0.16)', color: 'rgb(100, 116, 139)' },
};

function CompanyListStatusPill({ status }: { status: CompanyListStatus }) {
    const tone = COMPANY_STATUS_PILL[status];

    return (
        <Box
            component="span"
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: 1.5,
                py: 0.5,
                borderRadius: 99,
                bgcolor: tone.bg,
                color: tone.color,
                fontWeight: 700,
                fontSize: '0.6875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
            }}
        >
            {tone.label}
        </Box>
    );
}

/**
 * Liste d'entreprises — unifie `admin/companies` et `coach/companies`. Le filtrage par
 * coach est appliqué côté backend via `useCompanies` (cf. avancement-2026-04-28.md §1.b),
 * donc ce composant reste agnostique du scope sauf pour les libellés et les liens de détail.
 */
export function CompaniesListPage({ scope }: CompaniesListPageProps) {
    const isAdmin = scope === 'admin';
    useHarmonizedBreadcrumbs(isAdmin ? [{ label: 'Administration' }, { label: 'Entreprises' }] : []);
    const labels = SCOPE_LABELS[scope];
    const detailPathPrefix = isAdmin ? '/admin/companies' : '/coach/companies';

    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const [sortKey, setSortKey] = React.useState<SortKey>('name');
    const [sortOrder, setSortOrder] = React.useState<SortOrder>('asc');

    const { data: companies = [], isLoading: companiesLoading } = useCompanies();
    const { data: campaigns = [], isLoading: campaignsLoading } = useAdminCampaigns();
    const createCompany = useCreateCompany();

    const totalParticipants = React.useMemo(
        () => companies.reduce((sum, c) => sum + c.participant_count, 0),
        [companies]
    );
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;

    const filtered = React.useMemo(() => {
        const base = search.trim()
            ? companies.filter(
                  c =>
                      c.name.toLowerCase().includes(search.toLowerCase()) ||
                      (c.contact_name ?? '').toLowerCase().includes(search.toLowerCase())
              )
            : companies;
        const direction = sortOrder === 'asc' ? 1 : -1;
        return [...base].sort((a, b) => {
            if (sortKey === 'participant_count') {
                return (a.participant_count - b.participant_count) * direction;
            }
            const av = (sortKey === 'name' ? a.name : (a.contact_name ?? '')).toLowerCase();
            const bv = (sortKey === 'name' ? b.name : (b.contact_name ?? '')).toLowerCase();
            return av.localeCompare(bv) * direction;
        });
    }, [companies, search, sortKey, sortOrder]);

    const { page, rowsPerPage, paged, setPage, setRowsPerPage } = useTablePagination({
        items: filtered,
        resetWhen: [search],
    });

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortOrder('asc');
        }
    };

    const drawer = isAdmin ? (
        <AdminCompanyDrawerForm
            open={drawerOpen}
            mode="create"
            onClose={() => {
                setDrawerOpen(false);
                createCompany.reset();
            }}
            onSubmit={async values => {
                try {
                    await createCompany.mutateAsync({
                        name: values.name,
                        contactName: values.contactName || null,
                        contactEmail: values.contactEmail || null,
                    });
                    setDrawerOpen(false);
                } catch {
                    // Le toast d'erreur est émis par le hook ; on garde le drawer ouvert.
                }
            }}
        />
    ) : null;

    const paginationLabel =
        filtered.length > 0
            ? `${page * rowsPerPage + 1}–${Math.min((page + 1) * rowsPerPage, filtered.length)} sur ${filtered.length}`
            : '0 sur 0';

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
                        Ajouter une entreprise
                    </Button>
                </Box>

                <KpiGrid columns={3}>
                    <KpiCard
                        label="Entreprises"
                        value={companies.length}
                        helper={labels.statsHelper}
                        icon={Building2}
                        loading={companiesLoading}
                    />
                    <KpiCard
                        label="Participants"
                        value={totalParticipants}
                        helper="rattachés aux campagnes"
                        icon={Users}
                        loading={companiesLoading}
                    />
                    <KpiCard
                        label="Campagnes"
                        value={activeCampaigns}
                        helper="projets de coaching en cours"
                        icon={ClipboardList}
                        loading={campaignsLoading}
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
                            borderBottom: `1px solid ${HARMONIZED_LAVENDER_GREY}`,
                        }}
                    >
                        <Typography variant="h6" fontWeight={800} color="primary.main">
                            Liste des entreprises
                        </Typography>
                        <Stack
                            direction="row"
                            alignItems="center"
                            spacing={2}
                            sx={{ width: { xs: '100%', sm: 'auto' } }}
                        >
                            <TextField
                                size="small"
                                placeholder="Rechercher une entreprise…"
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
                                    flex: 1,
                                    minWidth: { sm: 280 },
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
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: { xs: 'none', md: 'block' }, whiteSpace: 'nowrap', fontWeight: 600 }}
                            >
                                Affichage {paginationLabel}
                            </Typography>
                        </Stack>
                    </Box>

                    <Box sx={{ display: { xs: 'none', lg: 'block' }, overflowX: 'auto' }}>
                        <Table sx={{ minWidth: 900 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ ...harmonizedListTableHeadCellSx, pl: 4 }}>
                                        <TableSortLabel
                                            active={sortKey === 'name'}
                                            direction={sortKey === 'name' ? sortOrder : 'asc'}
                                            onClick={() => handleSort('name')}
                                        >
                                            Entreprise
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell sx={harmonizedListTableHeadCellSx}>
                                        <TableSortLabel
                                            active={sortKey === 'contact_name'}
                                            direction={sortKey === 'contact_name' ? sortOrder : 'asc'}
                                            onClick={() => handleSort('contact_name')}
                                        >
                                            Contact principal
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell sx={harmonizedListTableHeadCellSx}>
                                        <TableSortLabel
                                            active={sortKey === 'participant_count'}
                                            direction={sortKey === 'participant_count' ? sortOrder : 'asc'}
                                            onClick={() => handleSort('participant_count')}
                                        >
                                            Participants
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell sx={harmonizedListTableHeadCellSx}>Statut</TableCell>
                                    <TableCell align="right" sx={{ ...harmonizedListTableHeadCellSx, pr: 4 }} />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {companiesLoading ? (
                                    <SkeletonTableRows rows={4} columns={5} />
                                ) : (
                                    paged.map(company => {
                                        const status = resolveCompanyListStatus(company.id, campaigns);

                                        return (
                                            <TableRow
                                                hover
                                                key={company.id}
                                                sx={{
                                                    '&:hover': { bgcolor: 'rgba(245, 245, 251, 0.8)' },
                                                    '& td': { borderColor: 'rgba(245, 245, 251, 0.8)' },
                                                }}
                                            >
                                                <TableCell sx={{ pl: 4, py: 2.5 }}>
                                                    <Stack direction="row" spacing={2} alignItems="center">
                                                        <Box
                                                            sx={{
                                                                width: 48,
                                                                height: 48,
                                                                borderRadius: 2,
                                                                bgcolor: 'tint.primaryBg',
                                                                color: 'primary.main',
                                                                display: 'grid',
                                                                placeItems: 'center',
                                                                fontWeight: 800,
                                                                fontSize: '1.125rem',
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            {companyInitial(company.name)}
                                                        </Box>
                                                        <Typography
                                                            fontWeight={700}
                                                            color="primary.main"
                                                            lineHeight={1.2}
                                                        >
                                                            {company.name}
                                                        </Typography>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell sx={{ py: 2.5 }}>
                                                    <Typography fontWeight={700} color="text.primary" lineHeight={1.2}>
                                                        {company.contact_name ?? '–'}
                                                    </Typography>
                                                    {company.contact_email ? (
                                                        <Typography variant="caption" color="text.secondary">
                                                            {company.contact_email}
                                                        </Typography>
                                                    ) : null}
                                                </TableCell>
                                                <TableCell sx={{ py: 2.5 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                                                        <Typography fontWeight={800} color="primary.main">
                                                            {company.participant_count}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            participants
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell sx={{ py: 2.5 }}>
                                                    <CompanyListStatusPill status={status} />
                                                </TableCell>
                                                <TableCell align="right" sx={{ pr: 4, py: 2.5 }}>
                                                    <Typography
                                                        component={Link}
                                                        to={`${detailPathPrefix}/${company.id}`}
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
                                {!companiesLoading && filtered.length === 0 && (
                                    <EmptyTableRow
                                        colSpan={5}
                                        message={
                                            search
                                                ? 'Aucune entreprise ne correspond à la recherche.'
                                                : labels.emptyMessage
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
                        {companiesLoading ? (
                            <SkeletonCards count={3} height={140} />
                        ) : (
                            filtered.map(company => {
                                const status = resolveCompanyListStatus(company.id, campaigns);

                                return (
                                    <Card variant="outlined" key={company.id} sx={{ borderRadius: 3 }}>
                                        <CardContent sx={{ p: 2.5 }}>
                                            <Stack spacing={2}>
                                                <Stack
                                                    direction="row"
                                                    justifyContent="space-between"
                                                    alignItems="start"
                                                    spacing={2}
                                                >
                                                    <Stack direction="row" spacing={2} alignItems="center">
                                                        <Box
                                                            sx={{
                                                                width: 40,
                                                                height: 40,
                                                                borderRadius: 2,
                                                                bgcolor: 'tint.primaryBg',
                                                                color: 'primary.main',
                                                                display: 'grid',
                                                                placeItems: 'center',
                                                                fontWeight: 800,
                                                            }}
                                                        >
                                                            {companyInitial(company.name)}
                                                        </Box>
                                                        <Box>
                                                            <Typography
                                                                variant="h6"
                                                                fontWeight={800}
                                                                color="primary.main"
                                                            >
                                                                {company.name}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {company.contact_name ?? '–'}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                    <CompanyListStatusPill status={status} />
                                                </Stack>
                                                <Typography variant="caption" color="text.secondary">
                                                    {company.participant_count} participants
                                                </Typography>
                                                <OpenDetailButton
                                                    to={`${detailPathPrefix}/${company.id}`}
                                                    variant="card"
                                                />
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        )}
                        {!companiesLoading && filtered.length === 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                {search ? 'Aucune entreprise ne correspond à la recherche.' : labels.emptyMessage}
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

            <KpiGrid columns={3}>
                <KpiCard
                    label="Entreprises"
                    value={companies.length}
                    helper={labels.statsHelper}
                    icon={Building2}
                    loading={companiesLoading}
                />
                <KpiCard
                    label="Participants"
                    value={totalParticipants}
                    helper="rattachés"
                    icon={Users}
                    loading={companiesLoading}
                />
                <KpiCard
                    label="Campagnes"
                    value={campaigns.length}
                    helper="rattachées"
                    icon={ClipboardList}
                    loading={campaignsLoading}
                />
            </KpiGrid>

            <Card variant="outlined">
                <CardContent sx={{ p: 2.5 }}>
                    <SectionTitle
                        title="Liste des entreprises"
                        subtitle="Recherche rapide et accès au détail des campagnes associées."
                        action={
                            <TextField
                                size="small"
                                placeholder="Rechercher une entreprise…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                sx={{ minWidth: 300 }}
                            />
                        }
                    />

                    <Box sx={{ display: { xs: 'none', lg: 'block' }, overflowX: 'auto' }}>
                        <Table sx={{ minWidth: 800 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        <TableSortLabel
                                            active={sortKey === 'name'}
                                            direction={sortKey === 'name' ? sortOrder : 'asc'}
                                            onClick={() => handleSort('name')}
                                        >
                                            Entreprise
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={sortKey === 'contact_name'}
                                            direction={sortKey === 'contact_name' ? sortOrder : 'asc'}
                                            onClick={() => handleSort('contact_name')}
                                        >
                                            Contact
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={sortKey === 'participant_count'}
                                            direction={sortKey === 'participant_count' ? sortOrder : 'asc'}
                                            onClick={() => handleSort('participant_count')}
                                        >
                                            Participants
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {companiesLoading ? (
                                    <SkeletonTableRows rows={4} columns={4} />
                                ) : (
                                    paged.map(company => (
                                        <TableRow hover key={company.id}>
                                            <TableCell>
                                                <Typography fontWeight={700} color="text.primary">
                                                    {company.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography fontWeight={600} color="text.primary">
                                                    {company.contact_name ?? '–'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {company.contact_email ?? ''}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{company.participant_count}</TableCell>
                                            <TableCell align="right">
                                                <OpenDetailButton to={`${detailPathPrefix}/${company.id}`} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                                {!companiesLoading && filtered.length === 0 && (
                                    <EmptyTableRow
                                        colSpan={4}
                                        message={
                                            search
                                                ? 'Aucune entreprise ne correspond à la recherche.'
                                                : labels.emptyMessage
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
                        {companiesLoading ? (
                            <SkeletonCards count={3} height={140} />
                        ) : (
                            filtered.map(company => (
                                <Card variant="outlined" key={company.id}>
                                    <CardContent sx={{ p: 2.5 }}>
                                        <Stack spacing={1.8}>
                                            <Box>
                                                <Typography variant="h6" fontWeight={800} color="text.primary">
                                                    {company.name}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                                                    {company.contact_name ?? '–'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {company.contact_email ?? ''}
                                                </Typography>
                                            </Box>
                                            <Box
                                                sx={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                                    gap: 1.2,
                                                }}
                                            >
                                                <StatCard
                                                    variant="mini"
                                                    label="Participants"
                                                    value={String(company.participant_count)}
                                                />
                                            </Box>
                                            <OpenDetailButton to={`${detailPathPrefix}/${company.id}`} variant="card" />
                                        </Stack>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                        {!companiesLoading && filtered.length === 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                {search ? 'Aucune entreprise ne correspond à la recherche.' : labels.emptyMessage}
                            </Typography>
                        )}
                    </Stack>
                </CardContent>
            </Card>
        </Stack>
    );
}
