import { AdminCoachDrawerForm } from '@/components/admin/AdminCoachDrawerForm';
import { SkeletonCards, SkeletonTableRows } from '@/components/common/SkeletonRows';
import { KpiCard, StatCard } from '@/components/common/cards';
import { ActiveStatusChip, AdminBadge } from '@/components/common/chips';
import {
    EmptyTableRow,
    ListTableHead,
    OpenDetailButton,
    StandardTablePagination,
    TablePaginationFooter,
    TableRowLink,
} from '@/components/common/data-table';
import { SearchField } from '@/components/common/forms/SearchField';
import {
    AdminPageHeader,
    KpiGrid,
    ListPanel,
    MobileListEmptyMessage,
    ResponsiveListViews,
} from '@/components/common/layout';
import { listRowSx } from '@/components/common/styles/listSurfaces';
import { useBreadcrumbs } from '@/components/layout/AppShellChromeContext';
import { useAdminCampaigns, useCoaches, useCreateCoach } from '@/hooks/admin';
import { useTablePagination } from '@/lib/useTablePagination';
import { Box, Card, CardContent, Stack, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import { ClipboardList, UserRound } from 'lucide-react';
import * as React from 'react';

export const Route = createFileRoute('/admin/coaches/')({
    component: AdminCoachesRoute,
});

const TABLE_COLUMNS = 6;

function formatCreatedAt(createdAt: string | null | undefined): string {
    return createdAt ? new Date(createdAt).toLocaleDateString('fr-FR') : '–';
}

function AdminCoachesRoute() {
    useBreadcrumbs([{ label: 'Administration' }, { label: 'Coachs' }]);

    const [createOpen, setCreateOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');

    const { data: coaches = [], isLoading } = useCoaches();
    const { data: campaigns = [], isLoading: campaignsLoading } = useAdminCampaigns();
    const createCoach = useCreateCoach();

    const campaignCountByCoach = React.useMemo(() => {
        const map = new Map<number, number>();
        for (const c of campaigns) {
            map.set(c.coachId, (map.get(c.coachId) ?? 0) + 1);
        }
        return map;
    }, [campaigns]);

    const filtered = React.useMemo(() => {
        const needle = search.trim().toLowerCase();
        const base = needle
            ? coaches.filter(
                  c => c.displayName.toLowerCase().includes(needle) || c.username.toLowerCase().includes(needle)
              )
            : coaches;
        // L'admin remonte en tête : c'est la cible d'assignation par défaut, on veut
        // qu'elle soit immédiatement repérable.
        return [...base].sort((a, b) => Number(b.isAdmin) - Number(a.isAdmin));
    }, [coaches, search]);

    const { page, rowsPerPage, paged, setPage, setRowsPerPage } = useTablePagination({
        items: filtered,
        resetWhen: [search],
    });

    const activeCount = coaches.filter(c => c.isActive).length;
    const isEmpty = !isLoading && filtered.length === 0;
    const emptyMessage = search ? 'Aucun coach ne correspond à la recherche.' : 'Aucun coach pour le moment.';

    const pagination =
        filtered.length > 0 ? (
            <StandardTablePagination
                count={filtered.length}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={setPage}
                onRowsPerPageChange={setRowsPerPage}
            />
        ) : null;

    return (
        <Stack spacing={4}>
            <AdminCoachDrawerForm
                open={createOpen}
                mode="create"
                isSubmitting={createCoach.isPending}
                onClose={() => {
                    setCreateOpen(false);
                    createCoach.reset();
                }}
                onSubmit={async values => {
                    try {
                        await createCoach.mutateAsync({
                            username: values.username,
                            password: values.password,
                            displayName: values.displayName,
                        });
                        setCreateOpen(false);
                    } catch {
                        // Le toast d'erreur est émis par le hook ; on garde le drawer ouvert.
                    }
                }}
            />

            <AdminPageHeader
                title="Coachs"
                subtitle="Référentiel des coachs et des campagnes qui leur sont associées."
                action={{ label: 'Ajouter un coach', onClick: () => setCreateOpen(true) }}
            />

            <KpiGrid columns={3}>
                <KpiCard
                    label="Coachs"
                    value={coaches.length}
                    helper="référencés"
                    icon={UserRound}
                    loading={isLoading}
                />
                <KpiCard label="Actifs" value={activeCount} helper="en activité" icon={UserRound} loading={isLoading} />
                <KpiCard
                    label="Campagnes"
                    value={campaigns.length}
                    helper="attribuées"
                    icon={ClipboardList}
                    loading={campaignsLoading}
                />
            </KpiGrid>

            <ListPanel
                title="Liste des coachs"
                subtitle="Recherche rapide et accès au détail des campagnes suivies."
                headerBorder
                headerActions={<SearchField value={search} onChange={setSearch} placeholder="Rechercher un coach…" />}
            >
                <ResponsiveListViews
                    desktop={
                        <>
                            <Table sx={{ minWidth: 900 }}>
                                <ListTableHead
                                    columns={[
                                        { key: 'status', label: 'Statut', sx: { pl: 4 } },
                                        { key: 'coach', label: 'Coach' },
                                        { key: 'username', label: 'Username' },
                                        { key: 'campaigns', label: 'Campagnes' },
                                        { key: 'createdAt', label: 'Créé le' },
                                        { key: 'action', align: 'right', sx: { pr: 4 } },
                                    ]}
                                />
                                <TableBody>
                                    {isLoading ? (
                                        <SkeletonTableRows rows={4} columns={TABLE_COLUMNS} />
                                    ) : (
                                        paged.map(coach => (
                                            <TableRow hover key={coach.id} sx={listRowSx}>
                                                <TableCell sx={{ pl: 4, py: 2.5 }}>
                                                    <ActiveStatusChip isActive={coach.isActive} />
                                                </TableCell>
                                                <TableCell sx={{ py: 2.5 }}>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Typography fontWeight={700} color="primary.main">
                                                            {coach.displayName}
                                                        </Typography>
                                                        {coach.isAdmin && <AdminBadge />}
                                                    </Stack>
                                                </TableCell>
                                                <TableCell sx={{ py: 2.5 }}>
                                                    <Typography color="text.secondary" fontWeight={600}>
                                                        {coach.username}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 2.5 }}>
                                                    <Typography color="text.secondary" fontWeight={600}>
                                                        {campaignCountByCoach.get(coach.id) ?? 0}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 2.5 }}>
                                                    <Typography color="text.secondary" sx={{ opacity: 0.85 }}>
                                                        {formatCreatedAt(coach.createdAt)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right" sx={{ pr: 4, py: 2.5 }}>
                                                    <TableRowLink to={`/admin/coaches/${coach.id}`} />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                    {isEmpty ? <EmptyTableRow colSpan={TABLE_COLUMNS} message={emptyMessage} /> : null}
                                </TableBody>
                            </Table>
                            {pagination ? <TablePaginationFooter>{pagination}</TablePaginationFooter> : null}
                        </>
                    }
                    mobile={
                        <>
                            {isLoading ? (
                                <SkeletonCards count={3} height={140} />
                            ) : (
                                paged.map(coach => (
                                    <Card variant="outlined" key={coach.id} sx={{ borderRadius: 3 }}>
                                        <CardContent sx={{ p: 2.5 }}>
                                            <Stack spacing={1.8}>
                                                <Stack
                                                    direction="row"
                                                    justifyContent="space-between"
                                                    alignItems="start"
                                                    spacing={2}
                                                >
                                                    <Box>
                                                        <Stack direction="row" spacing={1} alignItems="center">
                                                            <Typography
                                                                variant="h6"
                                                                fontWeight={800}
                                                                color="primary.main"
                                                            >
                                                                {coach.displayName}
                                                            </Typography>
                                                            {coach.isAdmin && <AdminBadge />}
                                                        </Stack>
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{ mt: 0.4 }}
                                                        >
                                                            {coach.username}
                                                        </Typography>
                                                    </Box>
                                                    <ActiveStatusChip isActive={coach.isActive} />
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
                                                        label="Campagnes"
                                                        value={String(campaignCountByCoach.get(coach.id) ?? 0)}
                                                    />
                                                    <StatCard
                                                        variant="mini"
                                                        label="Créé le"
                                                        value={formatCreatedAt(coach.createdAt)}
                                                    />
                                                </Box>
                                                <OpenDetailButton to={`/admin/coaches/${coach.id}`} variant="card" />
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                            {isEmpty ? <MobileListEmptyMessage message={emptyMessage} /> : null}
                        </>
                    }
                />
            </ListPanel>
        </Stack>
    );
}
