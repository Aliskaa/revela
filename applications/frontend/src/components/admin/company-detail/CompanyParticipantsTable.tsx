// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Box,
    Card,
    CardContent,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { Trash2, UserPlus } from 'lucide-react';
import * as React from 'react';

import { AddParticipantToCampaignDrawerForm } from '@/components/admin/AddParticipantToCampaignDrawerForm';
import { SectionTitle } from '@/components/common/SectionTitle';
import { SkeletonTableRows } from '@/components/common/SkeletonRows';
import { ParticipantStatusChip } from '@/components/common/chips';
import {
    EmptyTableRow,
    StandardTablePagination,
    stickyActionCellSx,
    stickyActionHeadSx,
} from '@/components/common/data-table';
import { useAddParticipantToCompany } from '@/hooks/admin';
import type { Participant } from '@aor/types';

import { CompanyImportCsv } from './CompanyImportCsv';
import { Button } from '@/components/common/Button';

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
    /** Si `true`, affiche les contrôles d'import CSV (réservés à l'admin, cf. P08). */
    showCsvImport?: boolean;
    /**
     * `null` en scope admin (suppression toujours autorisée). En scope coach, le `coachId`
     * du coach connecté : la colonne « Supprimer » n'apparaît que sur les lignes dont
     * `created_by_coach_id` correspond — un coach ne peut effacer que les participants
     * qu'il a ajoutés unitairement (cf. PDF AOR §coach delete).
     */
    currentCoachId: number | null;
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
    onDeleteClick,
    showCsvImport = true,
    currentCoachId,
    search,
    onSearchChange,
}: CompanyParticipantsTableProps) {
    const [addDrawerOpen, setAddDrawerOpen] = React.useState(false);
    const addParticipant = useAddParticipantToCompany();
    const canDelete = (p: Participant) =>
        currentCoachId === null || p.created_by_coach_id === currentCoachId;

    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
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

                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                    spacing={1.5}
                    sx={{ mb: 1 }}
                >
                    <SectionTitle title="Collaborateurs" subtitle={`Les participants rattachés à ${companyName}.`} />
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={1.2}
                        alignItems={{ xs: 'stretch', sm: 'center' }}
                        sx={{ flexShrink: 0, width: { xs: '100%', sm: 'auto' } }}
                    >
                        <TextField
                            size="small"
                            placeholder="Rechercher un collaborateur…"
                            value={search}
                            onChange={e => onSearchChange(e.target.value)}
                            sx={{ minWidth: { xs: '100%', sm: 260 } }}
                        />
                        <Button
                            appearance="primary"
                            startIcon={<UserPlus size={16} />}
                            onClick={() => setAddDrawerOpen(true)}
                        >
                            Ajouter un participant
                        </Button>
                        {showCsvImport && <CompanyImportCsv companyId={companyId} companyName={companyName} />}
                    </Stack>
                </Stack>

                {showCsvImport && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        CSV (séparateur « ; ») avec colonnes : <code>first_name</code>, <code>last_name</code>,{' '}
                        <code>email</code> (obligatoires), puis <code>organisation</code>, <code>direction</code>,{' '}
                        <code>service</code>, <code>function_level</code> (optionnels). Tous les participants seront
                        rattachés à <strong>{companyName}</strong>.
                    </Typography>
                )}

                <Box sx={{ overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 600 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell></TableCell>
                                <TableCell>Participant</TableCell>
                                <TableCell>Organisation</TableCell>
                                <TableCell sx={stickyActionHeadSx} />
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
                                        <TableCell align="right" sx={stickyActionCellSx}>
                                            {canDelete(p) && (
                                                <Button
                                                    size="small"
                                                    appearance="secondary"
                                                    startIcon={<Trash2 size={14} />}
                                                    onClick={() => onDeleteClick(p)}
                                                >
                                                    Supprimer
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                            {!loading && participants.length === 0 && (
                                <EmptyTableRow
                                    colSpan={4}
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
