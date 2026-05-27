// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Divider, Stack, Typography } from '@mui/material';
import { ClipboardList, UserRound } from 'lucide-react';
import * as React from 'react';

import { AdminCoachDrawerForm } from '@/components/admin/AdminCoachDrawerForm';
import { KpiCard } from '@/components/common/cards';
import { SearchField } from '@/components/common/forms/SearchField';
import { AdminPageHeader, KpiGrid, ListPanel } from '@/components/common/layout';
import { useBreadcrumbs } from '@/components/layout/AppShellChromeContext';
import { CoachListViews } from '@/components/scoped/coaches-list/CoachListViews';
import { useAdminCampaigns, useCoaches, useCreateCoach } from '@/hooks/admin';
import { useTablePagination } from '@/lib/useTablePagination';

export function CoachesListPage() {
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
        return [...base].sort((a, b) => Number(b.isAdmin) - Number(a.isAdmin));
    }, [coaches, search]);

    const { page, rowsPerPage, paged, setPage, setRowsPerPage } = useTablePagination({
        items: filtered,
        resetWhen: [search],
    });

    const activeCount = coaches.filter(c => c.isActive).length;
    const emptyMessage = search ? 'Aucun coach ne correspond à la recherche.' : 'Aucun coach pour le moment.';

    const displayFrom = filtered.length === 0 ? 0 : page * rowsPerPage + 1;
    const displayTo = filtered.length === 0 ? 0 : Math.min((page + 1) * rowsPerPage, filtered.length);

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

            <AdminPageHeader
                title="Coachs"
                subtitle="Référentiel des coachs et des campagnes qui leur sont associées."
                action={{ label: 'Ajouter un coach', onClick: () => setCreateOpen(true), icon: UserRound }}
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
                headerBorder
                headerActions={
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                        <SearchField value={search} onChange={setSearch} placeholder="Rechercher un coach…" />
                        {filtered.length > 0 ? (
                            <>
                                <Divider
                                    orientation="vertical"
                                    flexItem
                                    sx={{ display: { xs: 'none', md: 'block' }, borderColor: 'surface.lavenderGrey' }}
                                />
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ display: { xs: 'none', md: 'block' }, whiteSpace: 'nowrap' }}
                                >
                                    Affichage {displayFrom}–{displayTo} sur {filtered.length}
                                </Typography>
                            </>
                        ) : null}
                    </Stack>
                }
            >
                <CoachListViews
                    coaches={paged}
                    campaignCountByCoach={campaignCountByCoach}
                    isLoading={isLoading}
                    isEmpty={filtered.length === 0}
                    emptyMessage={emptyMessage}
                    detailPathPrefix="/admin/coaches"
                    page={page}
                    rowsPerPage={rowsPerPage}
                    totalCount={filtered.length}
                    onPageChange={setPage}
                    onRowsPerPageChange={setRowsPerPage}
                />
            </ListPanel>
        </Stack>
    );
}
