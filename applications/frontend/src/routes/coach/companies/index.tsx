// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { AdminCompanyDrawerForm } from '@/components/admin/AdminCompanyDrawerForm';
import { MiniStat } from '@/components/common/MiniStat';
import { SectionTitle } from '@/components/common/SectionTitle';
import { SkeletonCards, SkeletonTableRows } from '@/components/common/SkeletonRows';
import { StatCard } from '@/components/common/StatCard';
import { useAdminCampaigns, useCompanies, useCreateCompany } from '@/hooks/admin';
import { usePageResetEffect } from '@/lib/usePageResetEffect';
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
    TablePagination,
    TableRow,
    TableSortLabel,
    TextField,
    Typography,
} from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import { ArrowRight, Building2, ClipboardList, Plus, Users } from 'lucide-react';
import * as React from 'react';

/**
 * Liste des entreprises du coach (filtrée backend par scope=coach via `useCompanies`,
 * cf. avancement-2026-04-28.md §1.b — sous-select sur `campaigns.coach_id`).
 * Réplique fidèle de `routes/admin/companies/index.tsx` avec liens vers `/coach/companies/$id`.
 */
export const Route = createFileRoute('/coach/companies/')({
    component: CoachCompaniesRoute,
});

type SortKey = 'name' | 'contact_name' | 'participant_count';
type SortOrder = 'asc' | 'desc';

function CoachCompaniesRoute() {
    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const [sortKey, setSortKey] = React.useState<SortKey>('name');
    const [sortOrder, setSortOrder] = React.useState<SortOrder>('asc');
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

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
        const sorted = [...base].sort((a, b) => {
            if (sortKey === 'participant_count') {
                return (a.participant_count - b.participant_count) * direction;
            }
            const av = (sortKey === 'name' ? a.name : (a.contact_name ?? '')).toLowerCase();
            const bv = (sortKey === 'name' ? b.name : (b.contact_name ?? '')).toLowerCase();
            return av.localeCompare(bv) * direction;
        });
        return sorted;
    }, [companies, search, sortKey, sortOrder]);

    const paged = React.useMemo(
        () => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [filtered, page, rowsPerPage]
    );

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortOrder('asc');
        }
    };

    usePageResetEffect(setPage, [search]);

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
                                label="Mes entreprises"
                                sx={{ borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main', mb: 1.5 }}
                            />
                            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                                Entreprises rattachées
                            </Typography>
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}
                            >
                                Référentiel des entreprises ayant au moins une de vos campagnes attribuées, avec leurs
                                participants et leurs contacts.
                            </Typography>
                        </Box>
                        <Button
                            onClick={() => setDrawerOpen(true)}
                            variant="contained"
                            disableElevation
                            startIcon={<Plus size={16} />}
                            sx={{ borderRadius: 3, bgcolor: 'primary.main' }}
                        >
                            Ajouter une entreprise
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
                <StatCard
                    label="Entreprises"
                    value={companies.length}
                    helper="rattachées"
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
            </Box>

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
                                                <Button
                                                    href={`/coach/companies/${company.id}`}
                                                    variant="text"
                                                    endIcon={<ArrowRight size={16} />}
                                                >
                                                    Ouvrir
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                                {!companiesLoading && filtered.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {search
                                                    ? 'Aucune entreprise ne correspond à la recherche.'
                                                    : 'Aucune entreprise rattachée à vos campagnes pour le moment.'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        {filtered.length > 0 && (
                            <TablePagination
                                component="div"
                                count={filtered.length}
                                page={page}
                                onPageChange={(_, newPage) => setPage(newPage)}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={e => {
                                    setRowsPerPage(Number(e.target.value));
                                    setPage(0);
                                }}
                                rowsPerPageOptions={[10, 25, 50]}
                                labelRowsPerPage="Lignes par page"
                                labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
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
                                                <MiniStat
                                                    label="Participants"
                                                    value={String(company.participant_count)}
                                                />
                                            </Box>
                                            <Button
                                                variant="contained"
                                                disableElevation
                                                href={`/coach/companies/${company.id}`}
                                                endIcon={<ArrowRight size={16} />}
                                                sx={{
                                                    borderRadius: 3,
                                                    bgcolor: 'primary.main',
                                                    width: 'fit-content',
                                                }}
                                            >
                                                Ouvrir
                                            </Button>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                        {!companiesLoading && filtered.length === 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                {search
                                    ? 'Aucune entreprise ne correspond à la recherche.'
                                    : 'Aucune entreprise rattachée à vos campagnes pour le moment.'}
                            </Typography>
                        )}
                    </Stack>
                </CardContent>
            </Card>
        </Stack>
    );
}
