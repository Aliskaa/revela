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
    TablePagination,
    TableRow,
    Typography,
} from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import { Users } from 'lucide-react';
import * as React from 'react';

import { SkeletonTableRows } from '@/components/common/SkeletonRows';
import { useParticipants } from '@/hooks/admin';
import { usePageResetEffect } from '@/lib/usePageResetEffect';

export const Route = createFileRoute('/coach/participants/')({
    component: CoachParticipantsRoute,
});

/**
 * Liste des participants du coach (déjà filtrée backend par scope=coach via la jointure
 * campaign_participants → campaigns.coach_id, cf. avancement-2026-04-28.md §1.b).
 */
function CoachParticipantsRoute() {
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(25);

    const { data, isLoading } = useParticipants(page + 1, undefined, rowsPerPage);
    const items = data?.items ?? [];
    const total = data?.total ?? 0;

    usePageResetEffect(setPage, [rowsPerPage]);

    return (
        <Stack spacing={3}>
            <Card variant="outlined">
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Stack spacing={1.5}>
                        <Chip
                            label="Mes participants"
                            sx={{
                                borderRadius: 99,
                                bgcolor: 'tint.primaryBg',
                                color: 'primary.main',
                                alignSelf: 'flex-start',
                            }}
                        />
                        <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                            Participants accompagnés
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7, maxWidth: 860 }}>
                            Tous les participants rattachés à au moins une de vos campagnes.
                        </Typography>
                    </Stack>
                </CardContent>
            </Card>

            <Card variant="outlined">
                <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ overflowX: 'auto' }}>
                        <Table sx={{ minWidth: 720 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Participant</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Organisation</TableCell>
                                    <TableCell>Société</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isLoading ? (
                                    <SkeletonTableRows rows={5} columns={4} />
                                ) : items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                            <Stack spacing={1} alignItems="center">
                                                <Users size={28} color="rgb(148,163,184)" />
                                                <Typography variant="body2" color="text.secondary">
                                                    Aucun participant rattaché à vos campagnes pour le moment.
                                                </Typography>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map(p => (
                                        <TableRow hover key={p.id}>
                                            <TableCell>
                                                <Typography fontWeight={700} color="text.primary">
                                                    {p.first_name} {p.last_name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{p.email}</TableCell>
                                            <TableCell>{p.organisation || '–'}</TableCell>
                                            <TableCell>{p.company?.name ?? '–'}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Box>

                    {total > 0 && (
                        <TablePagination
                            component="div"
                            count={total}
                            page={page}
                            onPageChange={(_, newPage) => setPage(newPage)}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={e => setRowsPerPage(Number(e.target.value))}
                            rowsPerPageOptions={[25, 50, 100]}
                            labelRowsPerPage="Lignes par page"
                            labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
                        />
                    )}
                </CardContent>
            </Card>
        </Stack>
    );
}
