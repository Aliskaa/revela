import { AdminCoachDrawerForm } from '@/components/admin/AdminCoachDrawerForm';
import { SectionTitle } from '@/components/common/SectionTitle';
import { SkeletonCards, SkeletonTableRows } from '@/components/common/SkeletonRows';
import { StatCard } from '@/components/common/cards';
import { ActiveStatusChip } from '@/components/common/chips';
import { EmptyTableRow, OpenDetailButton, StandardTablePagination } from '@/components/common/data-table';
import { KpiGrid, PageHeroCard } from '@/components/common/layout';
import { useAdminCampaigns, useCoaches, useCreateCoach } from '@/hooks/admin';
import { useTablePagination } from '@/lib/useTablePagination';
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
import { createFileRoute } from '@tanstack/react-router';
import { ClipboardList, Plus, UserRound } from 'lucide-react';
import * as React from 'react';

export const Route = createFileRoute('/admin/coaches/')({
    component: AdminCoachesRoute,
});

function AdminCoachesRoute() {
    const [createOpen, setCreateOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');

    const { data: coaches = [], isLoading: coachesLoading } = useCoaches();
    const { data: campaigns = [], isLoading: campaignsLoading } = useAdminCampaigns();
    const createCoach = useCreateCoach();

    const isLoading = coachesLoading;

    const campaignCountByCoach = React.useMemo(() => {
        const map = new Map<number, number>();
        for (const c of campaigns) {
            map.set(c.coachId, (map.get(c.coachId) ?? 0) + 1);
        }
        return map;
    }, [campaigns]);

    const filtered = React.useMemo(
        () =>
            search.trim()
                ? coaches.filter(
                    c =>
                        c.displayName.toLowerCase().includes(search.toLowerCase()) ||
                        c.username.toLowerCase().includes(search.toLowerCase())
                )
                : coaches,
        [coaches, search]
    );

    const { page, rowsPerPage, paged, setPage, setRowsPerPage } = useTablePagination({
        items: filtered,
        resetWhen: [search],
    });

    const activeCount = coaches.filter(c => c.isActive).length;

    return (
        <Stack spacing={3}>
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

            <PageHeroCard
                eyebrow="Coachs"
                title="Coachs"
                subtitle="Référentiel des coachs et des campagnes qui leur sont associées."
                actions={
                    <Button
                        onClick={() => setCreateOpen(true)}
                        variant="contained"
                        disableElevation
                        startIcon={<Plus size={16} />}
                        sx={{ borderRadius: 3, bgcolor: 'primary.main' }}
                    >
                        Ajouter un coach
                    </Button>
                }
            />

            <KpiGrid columns={3}>
                <StatCard
                    label="Coachs"
                    value={coaches.length}
                    helper="référencés"
                    icon={UserRound}
                    loading={isLoading}
                />
                <StatCard
                    label="Actifs"
                    value={activeCount}
                    helper="en activité"
                    icon={UserRound}
                    loading={isLoading}
                />
                <StatCard
                    label="Campagnes"
                    value={campaigns.length}
                    helper="attribuées"
                    icon={ClipboardList}
                    loading={campaignsLoading}
                />
            </KpiGrid>

            <Card variant="outlined">
                <CardContent sx={{ p: 2.5 }}>
                    <SectionTitle
                        title="Liste des coachs"
                        subtitle="Recherche rapide et accès au détail des campagnes suivies."
                        action={
                            <TextField
                                size="small"
                                placeholder="Rechercher un coach…"
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
                                    <TableCell></TableCell>
                                    <TableCell>Coach</TableCell>
                                    <TableCell>Username</TableCell>
                                    <TableCell>Campagnes</TableCell>
                                    <TableCell>Créé le</TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isLoading ? (
                                    <SkeletonTableRows rows={4} columns={6} />
                                ) : (
                                    paged.map(coach => (
                                        <TableRow hover key={coach.id}>
                                            <TableCell>
                                                <ActiveStatusChip isActive={coach.isActive} />
                                            </TableCell>
                                            <TableCell>
                                                <Typography fontWeight={700} color="text.primary">
                                                    {coach.displayName}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="text.secondary">
                                                    {coach.username}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{campaignCountByCoach.get(coach.id) ?? 0}</TableCell>
                                            <TableCell>
                                                {coach.createdAt
                                                    ? new Date(coach.createdAt).toLocaleDateString('fr-FR')
                                                    : '–'}
                                            </TableCell>
                                            <TableCell align="right">
                                                <OpenDetailButton
                                                    to={`/admin/coaches/${coach.id}`}
                                                    ariaLabel={`Ouvrir ${coach.displayName}`}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                                {!isLoading && filtered.length === 0 && (
                                    <EmptyTableRow
                                        colSpan={6}
                                        message={
                                            search
                                                ? 'Aucun coach ne correspond à la recherche.'
                                                : 'Aucun coach pour le moment.'
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
                            <SkeletonCards count={3} height={140} />
                        ) : (
                            filtered.map(coach => (
                                <Card variant="outlined" key={coach.id}>
                                    <CardContent sx={{ p: 2.5 }}>
                                        <Stack spacing={1.8}>
                                            <Stack
                                                direction="row"
                                                justifyContent="space-between"
                                                alignItems="start"
                                                spacing={2}
                                            >
                                                <Box>
                                                    <Typography variant="h6" fontWeight={800} color="text.primary">
                                                        {coach.displayName}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
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
                                                    value={
                                                        coach.createdAt
                                                            ? new Date(coach.createdAt).toLocaleDateString('fr-FR')
                                                            : '–'
                                                    }
                                                />
                                            </Box>
                                            <OpenDetailButton to={`/admin/coaches/${coach.id}`} variant="card" />
                                        </Stack>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                        {!isLoading && filtered.length === 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                {search ? 'Aucun coach ne correspond à la recherche.' : 'Aucun coach pour le moment.'}
                            </Typography>
                        )}
                    </Stack>
                </CardContent>
            </Card>
        </Stack>
    );
}
