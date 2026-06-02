import type { AdminAuditEvent } from '@aor/types';
import { Box, Card, CardContent, Chip, Stack, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material';

import { SkeletonCards, SkeletonTableRows } from '@/components/common/SkeletonRows';
import { EmptyTableRow, ListTableHead, ListTablePagination } from '@/components/common/data-table';
import type { ListTableColumn } from '@/components/common/data-table';
import { MobileListEmptyMessage, ResponsiveListViews } from '@/components/common/layout';
import { listRowSx } from '@/components/common/styles/listSurfaces';

const ADMIN_EDGE_X = 5;
const ADMIN_CELL_PY = 3;
const ADMIN_TABLE_MIN_WIDTH = 960;
const TABLE_COLUMNS = 5;

const ACTOR_TYPE_COLOR: Record<AdminAuditEvent['actor_type'], { bg: string; fg: string }> = {
    'super-admin': { bg: 'tint.primaryBg', fg: 'primary.main' },
    coach: { bg: 'tint.successBg', fg: 'tint.successText' },
    participant: { bg: 'tint.subtleBg', fg: 'text.secondary' },
    system: { bg: 'tint.secondaryBg', fg: 'warning.main' },
    anonymous: { bg: 'tint.subtleBg', fg: 'text.secondary' },
};

function formatActor(event: AdminAuditEvent): string {
    if (event.actor_id === null) return event.actor_type;
    return `${event.actor_type} #${event.actor_id}`;
}

function formatResource(event: AdminAuditEvent): string {
    if (!event.resource_type) return '–';
    return event.resource_id !== null ? `${event.resource_type} #${event.resource_id}` : event.resource_type;
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

export type AuditLogListViewsProps = {
    events: AdminAuditEvent[];
    isLoading: boolean;
    isEmpty: boolean;
    emptyMessage: string;
    page: number;
    rowsPerPage: number;
    totalCount: number;
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (rowsPerPage: number) => void;
};

export function AuditLogListViews({
    events,
    isLoading,
    isEmpty,
    emptyMessage,
    page,
    rowsPerPage,
    totalCount,
    onPageChange,
    onRowsPerPageChange,
}: AuditLogListViewsProps) {
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

    const columns: ListTableColumn[] = [
        { key: 'date', label: 'Date', sx: { pl: ADMIN_EDGE_X } },
        { key: 'actor', label: 'Acteur' },
        { key: 'action', label: 'Action' },
        { key: 'resource', label: 'Ressource' },
        { key: 'ip', label: 'IP', sx: { pr: ADMIN_EDGE_X } },
    ];

    return (
        <>
            <ResponsiveListViews
                desktopScroll={false}
                desktop={
                    <Box sx={{ overflowX: 'auto' }}>
                        <Table sx={{ minWidth: ADMIN_TABLE_MIN_WIDTH }}>
                            <ListTableHead columns={columns} />
                            <TableBody>
                                {isLoading ? (
                                    <SkeletonTableRows rows={6} columns={TABLE_COLUMNS} />
                                ) : (
                                    events.map(event => (
                                        <AuditLogTableRow key={event.id} event={event} />
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
                            <SkeletonCards count={3} height={120} />
                        ) : (
                            events.map(event => <AuditLogMobileCard key={event.id} event={event} />)
                        )}
                        {!isLoading && isEmpty ? <MobileListEmptyMessage message={emptyMessage} /> : null}
                    </>
                }
            />
            {pagination}
        </>
    );
}

type AuditLogRowProps = {
    event: AdminAuditEvent;
};

function AuditLogTableRow({ event }: AuditLogRowProps) {
    const color = ACTOR_TYPE_COLOR[event.actor_type];

    return (
        <TableRow hover sx={listRowSx}>
            <TableCell sx={{ pl: ADMIN_EDGE_X, py: ADMIN_CELL_PY }}>
                <Typography variant="body2" fontWeight={600} color="text.primary">
                    {formatDate(event.created_at)}
                </Typography>
            </TableCell>
            <TableCell sx={{ py: ADMIN_CELL_PY }}>
                <Chip
                    size="small"
                    label={formatActor(event)}
                    sx={{
                        borderRadius: 99,
                        bgcolor: color.bg,
                        color: color.fg,
                        fontWeight: 600,
                    }}
                />
            </TableCell>
            <TableCell sx={{ py: ADMIN_CELL_PY }}>
                <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                    {event.action}
                </Typography>
            </TableCell>
            <TableCell sx={{ py: ADMIN_CELL_PY }}>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    {formatResource(event)}
                </Typography>
            </TableCell>
            <TableCell sx={{ pr: ADMIN_EDGE_X, py: ADMIN_CELL_PY }}>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontFamily: 'monospace', opacity: 0.85 }}
                >
                    {event.ip_address ?? '–'}
                </Typography>
            </TableCell>
        </TableRow>
    );
}

function AuditLogMobileCard({ event }: AuditLogRowProps) {
    const color = ACTOR_TYPE_COLOR[event.actor_type];

    return (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={2}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            {formatDate(event.created_at)}
                        </Typography>
                        <Chip
                            size="small"
                            label={formatActor(event)}
                            sx={{
                                borderRadius: 99,
                                bgcolor: color.bg,
                                color: color.fg,
                                fontWeight: 600,
                            }}
                        />
                    </Stack>
                    <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                        {event.action}
                    </Typography>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                        <Typography variant="caption" color="text.secondary">
                            {formatResource(event)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', opacity: 0.85 }}>
                            {event.ip_address ?? '–'}
                        </Typography>
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
}
