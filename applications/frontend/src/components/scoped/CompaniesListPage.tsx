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
    TableSortLabel,
    TextField,
    Typography,
} from '@mui/material';
import { Building2, ClipboardList, Plus, Users } from 'lucide-react';
import * as React from 'react';

import { AdminCompanyDrawerForm } from '@/components/admin/AdminCompanyDrawerForm';
import { SectionTitle } from '@/components/common/SectionTitle';
import { SkeletonCards, SkeletonTableRows } from '@/components/common/SkeletonRows';
import { StatCard } from '@/components/common/cards';
import { EmptyTableRow, OpenDetailButton, StandardTablePagination } from '@/components/common/data-table';
import { KpiGrid, PageHeroCard } from '@/components/common/layout';
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
        subtitle: 'Référentiel des entreprises clientes, avec leurs campagnes, leurs participants et leurs contacts.',
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

/**
 * Liste d'entreprises — unifie `admin/companies` et `coach/companies`. Le filtrage par
 * coach est appliqué côté backend via `useCompanies` (cf. avancement-2026-04-28.md §1.b),
 * donc ce composant reste agnostique du scope sauf pour les libellés et les liens de détail.
 */
export function CompaniesListPage({ scope }: CompaniesListPageProps) {
    const labels = SCOPE_LABELS[scope];
    const detailPathPrefix = scope === 'admin' ? '/admin/companies' : '/coach/companies';

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

    return (
        <Stack spacing={3}>
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

            <PageHeroCard
                eyebrow={labels.eyebrow}
                title={labels.title}
                subtitle={labels.subtitle}
                actions={
                    <Button
                        onClick={() => setDrawerOpen(true)}
                        variant="contained"
                        disableElevation
                        startIcon={<Plus size={16} />}
                        sx={{ borderRadius: 3, bgcolor: 'primary.main' }}
                    >
                        Ajouter une entreprise
                    </Button>
                }
            />

            <KpiGrid columns={3}>
                <StatCard
                    label="Entreprises"
                    value={companies.length}
                    helper={labels.statsHelper}
                    icon={Building2}
                    loading={companiesLoading}
                />
                <StatCard
                    label="Participants"
                    value={totalParticipants}
                    helper="rattachés"
                    icon={Users}
                    loading={companiesLoading}
                />
                <StatCard
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

                    {/* Desktop table */}
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

                    {/* Mobile cards */}
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
                                            <OpenDetailButton
                                                to={`${detailPathPrefix}/${company.id}`}
                                                variant="card"
                                            />
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
