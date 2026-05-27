import type { Coach } from '@aor/types';
import {
    Box,
    Card,
    CardContent,
    Stack,
    Table,
    TableBody,
    TableCell,
    Typography,
} from '@mui/material';
import { Link } from '@tanstack/react-router';

import { SkeletonCards, SkeletonTableRows } from '@/components/common/SkeletonRows';
import { ActiveStatusChip, AdminBadge } from '@/components/common/chips';
import {
    ClickableTableRow,
    EmptyTableRow,
    ListTableHead,
    ListTablePagination,
    RowNavigateHint,
} from '@/components/common/data-table';
import type { ListTableColumn } from '@/components/common/data-table';
import { MobileListEmptyMessage, ResponsiveListViews } from '@/components/common/layout';

const ADMIN_EDGE_X = 5;
const ADMIN_CELL_PY = 3;
const ADMIN_TABLE_MIN_WIDTH = 760;
const TABLE_COLUMNS = 5;

function formatCreatedAt(createdAt: string | null | undefined): string {
    return createdAt ? new Date(createdAt).toLocaleDateString('fr-FR') : '–';
}

function coachInitial(displayName: string): string {
    const trimmed = displayName.trim();
    return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
}

export type CoachListViewsProps = {
    coaches: Coach[];
    campaignCountByCoach: ReadonlyMap<number, number>;
    isLoading: boolean;
    isEmpty: boolean;
    emptyMessage: string;
    detailPathPrefix: string;
    page: number;
    rowsPerPage: number;
    totalCount: number;
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (rowsPerPage: number) => void;
};

export function CoachListViews({
    coaches,
    campaignCountByCoach,
    isLoading,
    isEmpty,
    emptyMessage,
    detailPathPrefix,
    page,
    rowsPerPage,
    totalCount,
    onPageChange,
    onRowsPerPageChange,
}: CoachListViewsProps) {
    const pagination =
        totalCount > 0 ? (
            <ListTablePagination
                count={totalCount}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={onPageChange}
                onRowsPerPageChange={onRowsPerPageChange}
            />
        ) : null;

    const adminColumns: ListTableColumn[] = [
        { key: 'coach', label: 'Coach', sx: { pl: ADMIN_EDGE_X } },
        { key: 'username', label: 'Username' },
        { key: 'campaigns', label: 'Campagnes' },
        { key: 'createdAt', label: 'Créé le' },
        { key: 'status', label: 'Statut', sx: { pr: ADMIN_EDGE_X } },
    ];

    return (
        <>
            <ResponsiveListViews
                desktopScroll={false}
                desktop={
                    <Box sx={{ overflowX: 'auto' }}>
                        <Table sx={{ minWidth: ADMIN_TABLE_MIN_WIDTH }}>
                            <ListTableHead columns={adminColumns} />
                            <TableBody>
                                {isLoading ? (
                                    <SkeletonTableRows rows={4} columns={TABLE_COLUMNS} />
                                ) : (
                                    coaches.map(coach => (
                                        <CoachTableRow
                                            key={coach.id}
                                            coach={coach}
                                            campaignCount={campaignCountByCoach.get(coach.id) ?? 0}
                                            detailPathPrefix={detailPathPrefix}
                                        />
                                    ))
                                )}
                                {!isLoading && isEmpty ? (
                                    <EmptyTableRow colSpan={TABLE_COLUMNS} message={emptyMessage} />
                                ) : null}
                            </TableBody>
                        </Table>
                    </Box>
                }
                mobile={
                    <>
                        {isLoading ? (
                            <SkeletonCards count={3} height={140} />
                        ) : (
                            coaches.map(coach => (
                                <CoachMobileCard
                                    key={coach.id}
                                    coach={coach}
                                    campaignCount={campaignCountByCoach.get(coach.id) ?? 0}
                                    detailPathPrefix={detailPathPrefix}
                                />
                            ))
                        )}
                        {!isLoading && isEmpty ? <MobileListEmptyMessage message={emptyMessage} /> : null}
                    </>
                }
            />
            {pagination}
        </>
    );
}

type CoachRowProps = {
    coach: Coach;
    campaignCount: number;
    detailPathPrefix: string;
};

function CoachTableRow({ coach, campaignCount, detailPathPrefix }: CoachRowProps) {
    const detailTo = `${detailPathPrefix}/${coach.id}`;
    const rowLabel = `Ouvrir ${coach.displayName}`;

    return (
        <ClickableTableRow to={detailTo} ariaLabel={rowLabel}>
            <TableCell sx={{ pl: ADMIN_EDGE_X, py: ADMIN_CELL_PY }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            bgcolor: 'grey.100',
                            color: 'primary.main',
                            display: 'grid',
                            placeItems: 'center',
                            fontWeight: 800,
                            fontSize: '1.125rem',
                            flexShrink: 0,
                        }}
                    >
                        {coachInitial(coach.displayName)}
                    </Box>
                    <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Typography
                                fontWeight={700}
                                color="primary.main"
                                lineHeight={1}
                                sx={{ fontSize: '1.125rem' }}
                            >
                                {coach.displayName}
                            </Typography>
                            {coach.isAdmin ? <AdminBadge /> : null}
                        </Stack>
                    </Box>
                </Stack>
            </TableCell>
            <TableCell sx={{ py: ADMIN_CELL_PY }}>
                <Typography color="text.secondary" fontWeight={600}>
                    {coach.username}
                </Typography>
            </TableCell>
            <TableCell sx={{ py: ADMIN_CELL_PY }}>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                    <Typography fontWeight={800} color="primary.main">
                        {campaignCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.6 }}>
                        campagnes
                    </Typography>
                </Box>
            </TableCell>
            <TableCell sx={{ py: ADMIN_CELL_PY }}>
                <Typography color="text.secondary" sx={{ opacity: 0.85 }}>
                    {formatCreatedAt(coach.createdAt)}
                </Typography>
            </TableCell>
            <TableCell sx={{ py: ADMIN_CELL_PY, pr: ADMIN_EDGE_X }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                    <ActiveStatusChip isActive={coach.isActive} inactiveLabel="Pause" />
                    <RowNavigateHint />
                </Stack>
            </TableCell>
        </ClickableTableRow>
    );
}

function CoachMobileCard({ coach, campaignCount, detailPathPrefix }: CoachRowProps) {
    const detailTo = `${detailPathPrefix}/${coach.id}`;

    return (
        <Card
            component={Link}
            to={detailTo}
            variant="outlined"
            sx={{
                borderRadius: 3,
                textDecoration: 'none',
                color: 'inherit',
                transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                '&:hover': {
                    boxShadow: theme => theme.palette.shadow.brandPaper,
                    transform: 'translateY(-1px)',
                },
            }}
        >
            <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={2}>
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
                                {coachInitial(coach.displayName)}
                            </Box>
                            <Box>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography variant="h6" fontWeight={800} color="primary.main">
                                        {coach.displayName}
                                    </Typography>
                                    {coach.isAdmin ? <AdminBadge /> : null}
                                </Stack>
                                <Typography variant="body2" color="text.secondary">
                                    {coach.username}
                                </Typography>
                            </Box>
                        </Stack>
                        <ActiveStatusChip isActive={coach.isActive}  inactiveLabel="Pause" />
                    </Stack>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">
                            {campaignCount} campagnes · Créé le {formatCreatedAt(coach.createdAt)}
                        </Typography>
                        <RowNavigateHint />
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
}
