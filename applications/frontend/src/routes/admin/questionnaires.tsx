import { SkeletonCards, SkeletonTableRows } from '@/components/common/SkeletonRows';
import { KpiCard } from '@/components/common/cards';
import {
    EmptyTableRow,
    ListTableHead,
    StandardTablePagination,
    TablePaginationFooter,
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
import { useAdminQuestionnaires } from '@/hooks/questionnaires';
import { useTablePagination } from '@/lib/useTablePagination';
import { Box, Card, CardContent, Chip, Stack, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import { ClipboardList, Users } from 'lucide-react';
import * as React from 'react';

export const Route = createFileRoute('/admin/questionnaires')({
    component: AdminQuestionnairesRoute,
});

const TABLE_COLUMNS = 3;

function AdminQuestionnairesRoute() {
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

    const isEmpty = !isLoading && filtered.length === 0;
    const emptyMessage = search
        ? 'Aucun questionnaire ne correspond à la recherche.'
        : 'Aucun questionnaire pour le moment.';

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
            <AdminPageHeader
                title="Questionnaires"
                subtitle="Référentiel des questionnaires, avec les dimensions, le volume de questions et l'état de publication."
            />

            <KpiGrid columns={2}>
                <KpiCard
                    label="Questionnaires"
                    value={questionnaires.length}
                    helper="référencés"
                    icon={ClipboardList}
                    loading={isLoading}
                />
                <KpiCard
                    label="Dimensions"
                    value={uniqueDimensions}
                    helper="au total"
                    icon={Users}
                    loading={isLoading}
                />
            </KpiGrid>

            <ListPanel
                title="Liste des questionnaires"
                subtitle="Voir rapidement la structure et ouvrir le détail ou l'édition."
                headerBorder
                headerActions={
                    <SearchField value={search} onChange={setSearch} placeholder="Rechercher un questionnaire…" />
                }
            >
                <ResponsiveListViews
                    desktop={
                        <>
                            <Table sx={{ minWidth: 800 }}>
                                <ListTableHead
                                    columns={[
                                        { key: 'code', label: 'Code', sx: { pl: 4 } },
                                        { key: 'title', label: 'Questionnaire' },
                                        { key: 'dimensions', label: 'Dimensions', sx: { pr: 4 } },
                                    ]}
                                />
                                <TableBody>
                                    {isLoading ? (
                                        <SkeletonTableRows rows={3} columns={TABLE_COLUMNS} />
                                    ) : (
                                        paged.map(q => (
                                            <TableRow hover key={q.id} sx={listRowSx}>
                                                <TableCell sx={{ pl: 4, py: 2.5 }}>
                                                    <Typography fontWeight={700} color="primary.main">
                                                        {q.id}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ py: 2.5 }}>
                                                    <Typography fontWeight={700} color="text.primary">
                                                        {q.title}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {q.description}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell sx={{ pr: 4, py: 2.5 }}>
                                                    <Typography color="text.secondary" fontWeight={600}>
                                                        {q.dimensions.map(d => d.name).join(' · ')}
                                                    </Typography>
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
                                <SkeletonCards count={3} height={160} />
                            ) : (
                                paged.map(q => (
                                    <Card variant="outlined" key={q.id} sx={{ borderRadius: 3 }}>
                                        <CardContent sx={{ p: 2.5 }}>
                                            <Stack spacing={1.8}>
                                                <Box>
                                                    <Typography variant="h6" fontWeight={800} color="primary.main">
                                                        {q.id} · {q.title}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                                                        {q.description}
                                                    </Typography>
                                                </Box>
                                                <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                                                    {q.dimensions.map(d => (
                                                        <Chip
                                                            key={d.name}
                                                            label={d.name}
                                                            size="small"
                                                            sx={{
                                                                borderRadius: 99,
                                                                bgcolor: 'tint.primaryBg',
                                                                color: 'primary.main',
                                                            }}
                                                        />
                                                    ))}
                                                </Stack>
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
