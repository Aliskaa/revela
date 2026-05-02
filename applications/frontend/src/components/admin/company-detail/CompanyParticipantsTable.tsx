// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

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
    Typography,
} from '@mui/material';
import { Trash2 } from 'lucide-react';

import { SectionTitle } from '@/components/common/SectionTitle';
import { SkeletonTableRows } from '@/components/common/SkeletonRows';
import { ParticipantStatusChip } from '@/components/common/chips';
import { EmptyTableRow, StandardTablePagination } from '@/components/common/data-table';
import type { Participant } from '@aor/types';

import { CompanyImportCsv } from './CompanyImportCsv';

export type CompanyParticipantsTableProps = {
    companyId: number;
    companyName: string;
    participants: Participant[];
    loading: boolean;
    totalCount: number;
    page: number;
    rowsPerPage: number;
    onPageChange: (next: number) => void;
    onRowsPerPageChange: (next: number) => void;
    participantPathPrefix: string;
    onDeleteClick: (participant: Participant) => void;
};

export function CompanyParticipantsTable({
    companyId,
    companyName,
    participants,
    loading,
    totalCount,
    page,
    rowsPerPage,
    onPageChange,
    onRowsPerPageChange,
    participantPathPrefix,
    onDeleteClick,
}: CompanyParticipantsTableProps) {
    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    spacing={1.5}
                    sx={{ mb: 1 }}
                >
                    <SectionTitle title="Collaborateurs" subtitle={`Les participants rattachés à ${companyName}.`} />
                    <CompanyImportCsv companyId={companyId} companyName={companyName} />
                </Stack>

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    CSV (séparateur « ; ») avec colonnes : <code>first_name</code>, <code>last_name</code>,{' '}
                    <code>email</code> (obligatoires), puis <code>organisation</code>, <code>direction</code>,{' '}
                    <code>service</code>, <code>function_level</code> (optionnels). Tous les participants seront
                    rattachés à <strong>{companyName}</strong>.
                </Typography>

                <Box sx={{ overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 600 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell></TableCell>
                                <TableCell>Participant</TableCell>
                                <TableCell>Organisation</TableCell>
                                <TableCell />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <SkeletonTableRows rows={4} columns={4} />
                            ) : (
                                participants.map(p => (
                                    <TableRow hover key={p.id}>
                                    <TableCell>
                                        <ParticipantStatusChip participant={p} />
                                    </TableCell>
                                        <TableCell>
                                            <a
                                                href={`${participantPathPrefix}/${p.id}`}
                                                style={{ color: 'inherit', textDecoration: 'none' }}
                                            >
                                                <Typography
                                                    fontWeight={700}
                                                    color="primary.main"
                                                    sx={{ '&:hover': { textDecoration: 'underline' } }}
                                                >
                                                    {p.full_name}
                                                </Typography>
                                            </a>
                                            <Typography variant="caption" color="text.secondary">
                                                {p.email}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography
                                                fontWeight={700}
                                            >
                                                {p.organisation ?? '–'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {p.direction}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button
                                                size="small"
                                                color="error"
                                                startIcon={<Trash2 size={14} />}
                                                onClick={() => onDeleteClick(p)}
                                            >
                                                Supprimer
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                            {!loading && participants.length === 0 && (
                                <EmptyTableRow colSpan={4} message="Aucun collaborateur rattaché à cette entreprise." />
                            )}
                        </TableBody>
                    </Table>
                </Box>

                {totalCount > 0 && (
                    <StandardTablePagination
                        count={totalCount}
                        page={page}
                        rowsPerPage={rowsPerPage}
                        onPageChange={onPageChange}
                        onRowsPerPageChange={next => {
                            onRowsPerPageChange(next);
                            onPageChange(0);
                        }}
                    />
                )}
            </CardContent>
        </Card>
    );
}
