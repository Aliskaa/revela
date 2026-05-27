// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Divider, Stack, Typography } from '@mui/material';
import { LayoutGrid, Sparkles } from 'lucide-react';
import * as React from 'react';

import { KpiCard } from '@/components/common/cards';
import { SearchField } from '@/components/common/forms/SearchField';
import { AdminPageHeader, KpiGrid, ListPanel } from '@/components/common/layout';
import { useBreadcrumbs } from '@/components/layout/AppShellChromeContext';
import { QuestionnaireListViews } from '@/components/scoped/questionnaires-list/QuestionnaireListViews';
import { useAdminQuestionnaires } from '@/hooks/questionnaires';
import { useTablePagination } from '@/lib/useTablePagination';

export function QuestionnairesListPage() {
    useBreadcrumbs([{ label: 'Administration' }, { label: 'Questionnaires' }]);

    const [search, setSearch] = React.useState('');
    const { data: questionnaires = [], isLoading } = useAdminQuestionnaires();

    const uniqueDimensions = React.useMemo(() => {
        const set = new Set<string>();
        for (const q of questionnaires) {
            for (const d of q.dimensions) set.add(d.name);
        }
        return set.size;
    }, [questionnaires]);

    const filtered = React.useMemo(() => {
        const needle = search.trim().toLowerCase();
        return needle
            ? questionnaires.filter(q => q.title.toLowerCase().includes(needle) || q.id.toLowerCase().includes(needle))
            : questionnaires;
    }, [questionnaires, search]);

    const { page, rowsPerPage, paged, setPage, setRowsPerPage } = useTablePagination({
        items: filtered,
        resetWhen: [search],
    });

    const emptyMessage = search
        ? 'Aucun questionnaire ne correspond à la recherche.'
        : 'Aucun questionnaire pour le moment.';

    const displayFrom = filtered.length === 0 ? 0 : page * rowsPerPage + 1;
    const displayTo = filtered.length === 0 ? 0 : Math.min((page + 1) * rowsPerPage, filtered.length);

    return (
        <Stack spacing={3}>
            <AdminPageHeader
                title="Questionnaires"
                subtitle="Référentiel des questionnaires, avec les dimensions, le volume de questions et l'état de publication."
            />

            <KpiGrid columns={2}>
                <KpiCard
                    label="Questionnaires"
                    value={questionnaires.length}
                    helper="référencés"
                    icon={Sparkles}
                    loading={isLoading}
                />
                <KpiCard
                    label="Dimensions"
                    value={uniqueDimensions}
                    helper="au total"
                    icon={LayoutGrid}
                    loading={isLoading}
                />
            </KpiGrid>

            <ListPanel
                title="Liste des questionnaires"
                headerBorder
                headerActions={
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                        <SearchField value={search} onChange={setSearch} placeholder="Rechercher un questionnaire…" />
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
                <QuestionnaireListViews
                    questionnaires={paged}
                    isLoading={isLoading}
                    isEmpty={filtered.length === 0}
                    emptyMessage={emptyMessage}
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
