// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Chip, Stack, Table, TableBody, TableCell, TableRow, Typography } from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';

import { SkeletonTableRows } from '@/components/common/SkeletonRows';
import {
    EmptyTableRow,
    ListTableHead,
    StandardTablePagination,
    TablePaginationFooter,
} from '@/components/common/data-table';
import { AdminPageHeader, ListPanel } from '@/components/common/layout';
import { listRowSx } from '@/components/common/styles/listSurfaces';
import { useBreadcrumbs } from '@/components/layout/AppShellChromeContext';
import { useAdminAuditEvents } from '@/hooks/admin';
import { usePageResetEffect } from '@/lib/usePageResetEffect';
import type { AdminAuditEvent } from '@aor/types';

export const Route = createFileRoute('/admin/audit-log')({
    component: AdminAuditLogRoute,
});

const TABLE_COLUMNS = 5;

const ACTOR_TYPE_COLOR: Record<AdminAuditEvent['actor_type'], { bg: string; fg: string }> = {
    'super-admin': { bg: 'tint.primaryBg', fg: 'primary.main' },
    coach: { bg: 'tint.successBg', fg: 'tint.successText' },
    participant: { bg: 'tint.subtleBg', fg: 'text.secondary' },
    system: { bg: 'tint.warningBg', fg: 'warning.main' },
    anonymous: { bg: 'tint.subtleBg', fg: 'text.secondary' },
};

const formatActor = (event: AdminAuditEvent): string => {
    if (event.actor_id === null) return event.actor_type;
    return `${event.actor_type} #${event.actor_id}`;
};

const formatResource = (event: AdminAuditEvent): string => {
    if (!event.resource_type) return '–';
    return event.resource_id !== null ? `${event.resource_type} #${event.resource_id}` : event.resource_type;
};

const formatDate = (iso: string): string => {
    const d = new Date(iso);
    return d.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
};

function AdminAuditLogRoute() {
    useBreadcrumbs([{ label: 'Administration' }, { label: 'Audit log' }]);

    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(50);

    const { data, isLoading } = useAdminAuditEvents(page + 1, rowsPerPage);

    usePageResetEffect(setPage, [rowsPerPage]);

    const items = data?.items ?? [];
    const total = data?.total ?? 0;

    return (
        <Stack spacing={4}>
            <AdminPageHeader
                title="Audit log"
                subtitle="Traçabilité G6 RGPD : actions sensibles (auth, suppressions, modifications RGPD). Les lectures ne sont pas tracées en V1."
            />

            <ListPanel title="Événements" subtitle="Triés du plus récent au plus ancien." headerBorder>
                <Box sx={{ overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 900 }}>
                        <ListTableHead
                            columns={[
                                { key: 'date', label: 'Date', sx: { pl: 4 } },
                                { key: 'actor', label: 'Acteur' },
                                { key: 'action', label: 'Action' },
                                { key: 'resource', label: 'Ressource' },
                                { key: 'ip', label: 'IP', sx: { pr: 4 } },
                            ]}
                        />
                        <TableBody>
                            {isLoading ? (
                                <SkeletonTableRows rows={6} columns={TABLE_COLUMNS} />
                            ) : (
                                items.map(event => {
                                    const color = ACTOR_TYPE_COLOR[event.actor_type];
                                    return (
                                        <TableRow hover key={event.id} sx={listRowSx}>
                                            <TableCell sx={{ pl: 4, py: 2 }}>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {formatDate(event.created_at)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 2 }}>
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
                                            <TableCell sx={{ py: 2 }}>
                                                <Typography
                                                    variant="body2"
                                                    fontWeight={600}
                                                    sx={{ fontFamily: 'monospace' }}
                                                >
                                                    {event.action}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 2 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    {formatResource(event)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ pr: 4, py: 2 }}>
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{ fontFamily: 'monospace' }}
                                                >
                                                    {event.ip_address ?? '–'}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                            {!isLoading && items.length === 0 ? (
                                <EmptyTableRow colSpan={TABLE_COLUMNS} message="Aucun événement enregistré." />
                            ) : null}
                        </TableBody>
                    </Table>
                </Box>
                {total > 0 ? (
                    <TablePaginationFooter>
                        <StandardTablePagination
                            count={total}
                            page={page}
                            rowsPerPage={rowsPerPage}
                            onPageChange={setPage}
                            onRowsPerPageChange={next => {
                                setRowsPerPage(next);
                                setPage(0);
                            }}
                            rowsPerPageOptions={[25, 50, 100, 200]}
                        />
                    </TablePaginationFooter>
                ) : null}
            </ListPanel>
        </Stack>
    );
}
