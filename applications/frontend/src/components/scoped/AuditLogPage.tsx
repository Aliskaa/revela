// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Stack, Typography } from '@mui/material';
import { List, ScrollText } from 'lucide-react';
import * as React from 'react';

import { KpiCard } from '@/components/common/cards';
import { AdminPageHeader, KpiGrid, ListPanel } from '@/components/common/layout';
import { useBreadcrumbs } from '@/components/layout/AppShellChromeContext';
import { AuditLogListViews } from '@/components/scoped/audit-log/AuditLogListViews';
import { useAdminAuditEvents } from '@/hooks/admin';
import { usePageResetEffect } from '@/lib/usePageResetEffect';

export function AuditLogPage() {
    useBreadcrumbs([{ label: 'Administration' }, { label: 'Audit log' }]);

    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

    const { data, isLoading } = useAdminAuditEvents(page + 1, rowsPerPage);

    usePageResetEffect(setPage, [rowsPerPage]);

    const items = data?.items ?? [];
    const total = data?.total ?? 0;

    const displayFrom = total === 0 ? 0 : page * rowsPerPage + 1;
    const displayTo = total === 0 ? 0 : Math.min((page + 1) * rowsPerPage, total);

    return (
        <Stack spacing={3}>
            <AdminPageHeader
                title="Audit log"
                subtitle="Traçabilité G6 RGPD : actions sensibles (auth, suppressions, modifications RGPD). Les lectures ne sont pas tracées en V1."
            />

            <KpiGrid columns={2}>
                <KpiCard
                    label="Événements"
                    value={total}
                    helper="enregistrés"
                    icon={ScrollText}
                    loading={isLoading}
                />
                <KpiCard
                    label="Affichés"
                    value={items.length}
                    helper="sur cette page"
                    icon={List}
                    loading={isLoading}
                />
            </KpiGrid>

            <ListPanel
                title="Événements"
                headerBorder
                headerActions={
                    total > 0 ? (
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: { xs: 'none', md: 'block' }, whiteSpace: 'nowrap' }}
                            >
                                Affichage {displayFrom}–{displayTo} sur {total}
                            </Typography>
                        </Stack>
                    ) : null
                }
            >
                <AuditLogListViews
                    events={items}
                    isLoading={isLoading}
                    isEmpty={!isLoading && items.length === 0}
                    emptyMessage="Aucun événement enregistré."
                    page={page}
                    rowsPerPage={rowsPerPage}
                    totalCount={total}
                    onPageChange={setPage}
                    onRowsPerPageChange={next => {
                        setRowsPerPage(next);
                        setPage(0);
                    }}
                />
            </ListPanel>
        </Stack>
    );
}
