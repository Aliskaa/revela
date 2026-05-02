// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Box,
    Card,
    CardContent,
    Chip,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';

import { SectionTitle } from '@/components/common/SectionTitle';
import { SkeletonTableRows } from '@/components/common/SkeletonRows';
import { EmptyTableRow, StandardTablePagination } from '@/components/common/data-table';
import { useAdminAuditEvents } from '@/hooks/admin';
import { usePageResetEffect } from '@/lib/usePageResetEffect';
import type { AdminAuditEvent } from '@aor/types';

export const Route = createFileRoute('/admin/audit-log')({
    component: AdminAuditLogRoute,
});

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
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(50);

    const { data, isLoading } = useAdminAuditEvents(page + 1, rowsPerPage);

    usePageResetEffect(setPage, [rowsPerPage]);

    const items = data?.items ?? [];
    const total = data?.total ?? 0;

    return (
        <Stack spacing={3}>
            <Card variant="outlined">
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Chip
                        label="Audit log"
                        sx={{ borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main', mb: 1.5 }}
                    />
                    <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                        Audit log
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}>
                        Traçabilité G6 RGPD : actions sensibles (auth, suppressions, modifications RGPD). Les lectures
                        ne sont pas tracées en V1.
                    </Typography>
                </CardContent>
            </Card>

            <Card variant="outlined">
                <CardContent sx={{ p: 2.5 }}>
                    <SectionTitle
                        title="Événements"
                        subtitle="Triés du plus récent au plus ancien."
                    />

                    <Box sx={{ overflowX: 'auto' }}>
                        <Table sx={{ minWidth: 900 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Acteur</TableCell>
                                    <TableCell>Action</TableCell>
                                    <TableCell>Ressource</TableCell>
                                    <TableCell>IP</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isLoading ? (
                                    <SkeletonTableRows rows={6} columns={5} />
                                ) : (
                                    items.map(event => {
                                        const color = ACTOR_TYPE_COLOR[event.actor_type];
                                        return (
                                            <TableRow hover key={event.id}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {formatDate(event.created_at)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
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
                                                <TableCell>
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight={600}
                                                        sx={{ fontFamily: 'monospace' }}
                                                    >
                                                        {event.action}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {formatResource(event)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
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
                                {!isLoading && items.length === 0 && (
                                    <EmptyTableRow colSpan={5} message="Aucun événement enregistré." />
                                )}
                            </TableBody>
                        </Table>
                    </Box>

                    {total > 0 && (
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
                    )}
                </CardContent>
            </Card>
        </Stack>
    );
}
