// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

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
import { UserPlus } from 'lucide-react';
import * as React from 'react';

import { AddParticipantToCampaignDrawerForm } from '@/components/admin/AddParticipantToCampaignDrawerForm';
import { SearchField } from '@/components/common/forms/SearchField';
import { SkeletonTableRows } from '@/components/common/SkeletonRows';
import {
    tableCellSx,
    surfaceCardSx,
} from '@/components/common/styles/listSurfaces';
import { ParticipantStatusChip } from '@/components/common/chips';
import {
    ClickableTableRow,
    EmptyTableRow,
    ListTableHead,
    ListTablePagination,
    RowNavigateHint,
    type ListTableColumn,
} from '@/components/common/data-table';
import { useAddParticipantToCompany } from '@/hooks/admin';
import type { Participant } from '@aor/types';

import { CompanyImportCsv } from './CompanyImportCsv';
import { Button } from '@/components/common/Button';

const EDGE_X = 3;
const TABLE_MIN_WIDTH = 560;

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
    /** Si `true`, affiche les contrôles d'import CSV (réservés à l'admin, cf. P08). */
    showCsvImport?: boolean;
    /**
     * Texte courant de la barre de recherche (saisie brute, non debouncée). La valeur
     * effectivement envoyée au backend est gérée par le parent (cf. CompanyDetailPage).
     */
    search: string;
    onSearchChange: (next: string) => void;
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
    showCsvImport = true,
    search,
    onSearchChange,
}: CompanyParticipantsTableProps) {
    const [addDrawerOpen, setAddDrawerOpen] = React.useState(false);
    const addParticipant = useAddParticipantToCompany();

    const columns: ListTableColumn[] = [
        { key: 'status', sx: { pl: EDGE_X, width: 48 } },
        { key: 'participant', label: 'Participant' },
        { key: 'organisation', label: 'Organisation' },
        { key: 'navigate', align: 'right', sx: { pr: EDGE_X, width: 48 } },
    ];
    const colSpan = columns.length;

    return (
        <Card variant="outlined" sx={{ ...surfaceCardSx, overflow: 'hidden' }}>
            <CardContent sx={{ p: 0 }}>
                <AddParticipantToCampaignDrawerForm
                    open={addDrawerOpen}
                    isSubmitting={addParticipant.isPending}
                    subtitle={`Le participant est rattaché à ${companyName}. Aucune invitation n'est envoyée — il sera invité depuis une campagne.`}
                    submitLabel="Ajouter à l'entreprise"
                    onClose={() => {
                        setAddDrawerOpen(false);
                        addParticipant.reset();
                    }}
                    onSubmit={async values => {
                        try {
                            await addParticipant.mutateAsync({
                                companyId,
                                payload: {
                                    firstName: values.firstName,
                                    lastName: values.lastName,
                                    email: values.email,
                                    organisation: values.organisation,
                                    direction: values.direction,
                                    service: values.service,
                                    functionLevel: values.functionLevel,
                                },
                            });
                            setAddDrawerOpen(false);
                        } catch {
                            // Toast émis par le hook ; on garde le drawer ouvert.
                        }
                    }}
                />

                <Box
                    sx={{
                        px: { xs: 2.5, md: 3 },
                        pt: 3,
                        pb: 2,
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { sm: 'center' },
                        justifyContent: 'space-between',
                        gap: 2,
                        borderBottom: '1px solid',
                        borderColor: 'surface.lavenderGrey',
                    }}
                >
                    <Box>
                        <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ mb: 0.5 }}>
                            Collaborateurs
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                            Les participants rattachés à {companyName}.
                        </Typography>
                    </Box>
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1.2}
                        alignItems={{ xs: 'stretch', sm: 'center' }}
                        sx={{ flexShrink: 0, width: { xs: '100%', sm: 'auto' } }}
                    >
                        <SearchField
                            value={search}
                            onChange={onSearchChange}
                            placeholder="Rechercher un collaborateur…"
                            sx={{ width: { xs: '100%', sm: 260 } }}
                        />
                        <Button
                            appearance="primary"
                            startIcon={<UserPlus size={14} />}
                            onClick={() => setAddDrawerOpen(true)}
                        >
                            Nouveau
                        </Button>
                        {showCsvImport && <CompanyImportCsv companyId={companyId} companyName={companyName} />}
                    </Stack>
                </Box>

                {showCsvImport && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', px: { xs: 2.5, md: 3 }, pt: 1.5, pb: 0.5 }}
                    >
                        CSV (séparateur « ; ») avec colonnes : <code>first_name</code>, <code>last_name</code>,{' '}
                        <code>email</code> (obligatoires), puis <code>organisation</code>, <code>direction</code>,{' '}
                        <code>service</code>, <code>function_level</code> (optionnels). Tous les participants seront
                        rattachés à <strong>{companyName}</strong>.
                    </Typography>
                )}

                <Box sx={{ overflowX: 'auto', px: { xs: 1, md: 0 } }}>
                    <Table sx={{ minWidth: TABLE_MIN_WIDTH }}>
                        <ListTableHead columns={columns} />
                        <TableBody>
                            {loading ? (
                                <SkeletonTableRows rows={4} columns={colSpan} />
                            ) : (
                                participants.map(p => {
                                    const detailTo = `${participantPathPrefix}/${p.id}`;
                                    return (
                                        <ClickableTableRow
                                            key={p.id}
                                            to={detailTo}
                                            ariaLabel={`Ouvrir ${p.full_name}`}
                                        >
                                            <TableCell sx={{ pl: EDGE_X, ...tableCellSx }}>
                                                <ParticipantStatusChip participant={p} />
                                            </TableCell>
                                            <TableCell sx={tableCellSx}>
                                                <Typography
                                                    fontWeight={700}
                                                    color="primary.main"
                                                    lineHeight={1.2}
                                                    sx={{ fontSize: '1.0625rem' }}
                                                >
                                                    {p.full_name}
                                                </Typography>
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{ display: 'block', mt: 0.25, opacity: 0.7 }}
                                                >
                                                    {p.email}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={tableCellSx}>
                                                <Typography fontWeight={700}>{p.organisation ?? '–'}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {p.direction}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right" sx={{ pr: EDGE_X, ...tableCellSx }}>
                                                <RowNavigateHint />
                                            </TableCell>
                                        </ClickableTableRow>
                                    );
                                })
                            )}
                            {!loading && participants.length === 0 && (
                                <EmptyTableRow
                                    colSpan={colSpan}
                                    message={
                                        search.trim().length > 0
                                            ? `Aucun collaborateur ne correspond à « ${search.trim()} ».`
                                            : 'Aucun collaborateur rattaché à cette entreprise.'
                                    }
                                />
                            )}
                        </TableBody>
                    </Table>
                </Box>

                {totalCount > 0 && (
                    <ListTablePagination
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
