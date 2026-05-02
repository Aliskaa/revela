// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Skeleton,
    Snackbar,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { Link, useNavigate } from '@tanstack/react-router';
import { Building2, Mail, Trash2, Upload, Users } from 'lucide-react';
import * as React from 'react';

import { SectionTitle } from '@/components/common/SectionTitle';
import { SkeletonTableRows } from '@/components/common/SkeletonRows';
import { StatCard } from '@/components/common/cards';
import { ParticipantStatusChip } from '@/components/common/chips';
import { EmptyTableRow, StandardTablePagination } from '@/components/common/data-table';
import { KpiGrid, PageHeroCard } from '@/components/common/layout';
import {
    useCompanies,
    useDeleteCompany,
    useDeleteParticipant,
    useImportParticipantsToCompany,
    useParticipants,
} from '@/hooks/admin';
import {
    type ParticipantImportPreviewRow,
    buildParticipantImportPreview,
    parseSemicolonCsvText,
} from '@/lib/parseCsv';
import { usePageResetEffect } from '@/lib/usePageResetEffect';
import type { Participant } from '@aor/types';

export type CompanyDetailScope = 'admin' | 'coach';

export type CompanyDetailPageProps = {
    scope: CompanyDetailScope;
    companyId: number;
};

const SCOPE_CFG: Record<
    CompanyDetailScope,
    {
        backTo: '/admin/companies' | '/coach/companies';
        notFound: string;
        participantPathPrefix: string;
    }
> = {
    admin: {
        backTo: '/admin/companies',
        notFound: 'Entreprise introuvable.',
        participantPathPrefix: '/admin/participants',
    },
    coach: {
        backTo: '/coach/companies',
        notFound: 'Entreprise introuvable ou hors de votre périmètre.',
        participantPathPrefix: '/coach/participants',
    },
};

export function CompanyDetailPage({ scope, companyId }: CompanyDetailPageProps) {
    const cfg = SCOPE_CFG[scope];
    const navigate = useNavigate();

    const { data: companies = [], isLoading: companiesLoading } = useCompanies();
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const { data: participantsData, isLoading: participantsLoading } = useParticipants(
        page + 1,
        companyId,
        rowsPerPage
    );

    usePageResetEffect(setPage, [rowsPerPage]);

    const deleteCompany = useDeleteCompany();
    const deleteParticipant = useDeleteParticipant();
    const importParticipants = useImportParticipantsToCompany();

    const [deleteCompanyOpen, setDeleteCompanyOpen] = React.useState(false);
    const [deleteParticipantTarget, setDeleteParticipantTarget] = React.useState<Participant | null>(null);
    const [snack, setSnack] = React.useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [csvPreview, setCsvPreview] = React.useState<{
        file: File;
        rows: ParticipantImportPreviewRow[];
        parseError: string | null;
    } | null>(null);
    const isImporting = importParticipants.isPending;

    const validPreviewCount = csvPreview?.rows.filter(r => r.valid).length ?? 0;
    const invalidPreviewCount = (csvPreview?.rows.length ?? 0) - validPreviewCount;

    const resetFileInput = () => {
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            const rows = parseSemicolonCsvText(text);
            const preview = buildParticipantImportPreview(rows);
            setCsvPreview({
                file,
                rows: preview,
                parseError:
                    preview.length === 0
                        ? 'Le fichier est vide ou ne contient pas d’en-tête (séparateur attendu : « ; »).'
                        : null,
            });
        } catch (err) {
            setCsvPreview({
                file,
                rows: [],
                parseError: err instanceof Error ? err.message : 'Impossible de lire le fichier.',
            });
        }
    };

    const handleCancelImport = () => {
        setCsvPreview(null);
        resetFileInput();
    };

    const handleConfirmImport = () => {
        if (!csvPreview) return;
        const formData = new FormData();
        formData.append('file', csvPreview.file);
        importParticipants.mutate(
            { companyId, formData },
            {
                onSettled: resetFileInput,
                onSuccess: () => setCsvPreview(null),
            }
        );
    };

    const company = companies.find(c => c.id === companyId);
    const participants = participantsData?.items ?? [];
    const totalCount = participantsData?.total ?? 0;
    const isLoading = companiesLoading || participantsLoading;

    const handleDeleteCompany = async () => {
        await deleteCompany.mutateAsync({ companyId });
        setDeleteCompanyOpen(false);
        navigate({ to: cfg.backTo });
    };

    const handleDeleteParticipant = async () => {
        if (!deleteParticipantTarget) return;
        const result = await deleteParticipant.mutateAsync({ participantId: deleteParticipantTarget.id });
        setSnack(
            `${deleteParticipantTarget.full_name} supprimé (${result.responses_removed} réponse${result.responses_removed !== 1 ? 's' : ''}, ${result.invite_tokens_removed} invitation${result.invite_tokens_removed !== 1 ? 's' : ''} retirées)`
        );
        setDeleteParticipantTarget(null);
    };

    if (isLoading && !company) {
        return (
            <Stack spacing={3}>
                <Skeleton variant="rounded" height={140} />
                <Skeleton variant="rounded" height={100} />
                <Skeleton variant="rounded" height={300} />
            </Stack>
        );
    }

    if (!company) {
        return (
            <Card variant="outlined">
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">
                        {cfg.notFound}
                    </Typography>
                    <Button component={Link} to={cfg.backTo} variant="outlined" sx={{ mt: 2, borderRadius: 3 }}>
                        Retour aux entreprises
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Stack spacing={3}>
            <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} message={snack} />

            <Dialog open={deleteCompanyOpen} onClose={() => setDeleteCompanyOpen(false)}>
                <DialogTitle>Supprimer l'entreprise</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Vous êtes sur le point de supprimer <strong>{company.name}</strong>. Cette action est
                        irréversible (RGPD).
                        {company.participant_count > 0 && (
                            <>
                                {' '}
                                Les <strong>{company.participant_count} participant(s)</strong> rattaché(s) seront
                                également supprimés, ainsi que toutes leurs réponses, scores et invitations. Les
                                campagnes de l'entreprise seront aussi supprimées.
                            </>
                        )}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteCompanyOpen(false)}>Annuler</Button>
                    <Button
                        onClick={handleDeleteCompany}
                        color="error"
                        variant="contained"
                        disableElevation
                        disabled={deleteCompany.isPending}
                    >
                        {deleteCompany.isPending ? 'Suppression…' : 'Confirmer la suppression'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={!!deleteParticipantTarget} onClose={() => setDeleteParticipantTarget(null)}>
                <DialogTitle>Supprimer le participant</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Vous êtes sur le point de supprimer <strong>{deleteParticipantTarget?.full_name}</strong> (
                        {deleteParticipantTarget?.email}). Toutes ses réponses, scores et invitations seront
                        définitivement effacés (RGPD).
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteParticipantTarget(null)}>Annuler</Button>
                    <Button
                        onClick={handleDeleteParticipant}
                        color="error"
                        variant="contained"
                        disableElevation
                        disabled={deleteParticipant.isPending}
                    >
                        {deleteParticipant.isPending ? 'Suppression…' : 'Confirmer la suppression'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={csvPreview !== null}
                onClose={isImporting ? undefined : handleCancelImport}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Confirmer l'import</DialogTitle>
                <DialogContent dividers>
                    {csvPreview?.parseError ? (
                        <Alert severity="error">{csvPreview.parseError}</Alert>
                    ) : (
                        <Stack spacing={1.5}>
                            <DialogContentText>
                                Fichier <strong>{csvPreview?.file.name}</strong> — {csvPreview?.rows.length ?? 0}{' '}
                                ligne(s) détectée(s) ({validPreviewCount} valide(s)
                                {invalidPreviewCount > 0 ? `, ${invalidPreviewCount} ignorée(s)` : ''}). Tous les
                                participants valides seront rattachés à <strong>{company.name}</strong>.
                            </DialogContentText>
                            <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
                                <Table size="small" stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Ligne</TableCell>
                                            <TableCell>Prénom</TableCell>
                                            <TableCell>Nom</TableCell>
                                            <TableCell>Email</TableCell>
                                            <TableCell>Statut</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {csvPreview?.rows.map(row => (
                                            <TableRow
                                                key={`${row.line}-${row.email}`}
                                                sx={!row.valid ? { bgcolor: 'tint.warningBg' } : undefined}
                                            >
                                                <TableCell>{row.line}</TableCell>
                                                <TableCell>{row.firstName || '—'}</TableCell>
                                                <TableCell>{row.lastName || '—'}</TableCell>
                                                <TableCell>{row.email || '—'}</TableCell>
                                                <TableCell>
                                                    {row.valid ? (
                                                        <Typography variant="caption" color="success.main">
                                                            OK
                                                        </Typography>
                                                    ) : (
                                                        <Typography variant="caption" color="warning.main">
                                                            {row.error}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelImport} disabled={isImporting}>
                        Annuler
                    </Button>
                    <Button
                        onClick={handleConfirmImport}
                        variant="contained"
                        disableElevation
                        disabled={isImporting || csvPreview?.parseError !== null || validPreviewCount === 0}
                    >
                        {isImporting
                            ? 'Import en cours…'
                            : `Importer ${validPreviewCount} participant${validPreviewCount > 1 ? 's' : ''}`}
                    </Button>
                </DialogActions>
            </Dialog>

            <PageHeroCard
                eyebrow="Détail entreprise"
                title={company.name}
                subtitle="Fiche entreprise avec la liste des collaborateurs rattachés et les actions de gestion."
                actions={
                    <Button variant="outlined" component={Link} to={cfg.backTo} sx={{ borderRadius: 3 }}>
                        Retour aux entreprises
                    </Button>
                }
            />

            <KpiGrid columns={3}>
                <StatCard
                    label="Collaborateurs"
                    value={company.participant_count}
                    helper="dans cette entreprise"
                    icon={Users}
                />
                <StatCard
                    label="Contact"
                    value={company.contact_name ?? '–'}
                    helper={company.contact_email ?? 'non renseigné'}
                    icon={Mail}
                />
                <StatCard label="Entreprise" value={company.name} helper={`ID ${company.id}`} icon={Building2} />
            </KpiGrid>

            <Stack spacing={3}>
                <Card variant="outlined">
                    <CardContent sx={{ p: 2.5 }}>
                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            justifyContent="space-between"
                            alignItems={{ xs: 'flex-start', sm: 'center' }}
                            spacing={1.5}
                            sx={{ mb: 1 }}
                        >
                            <SectionTitle
                                title="Collaborateurs"
                                subtitle={`Les participants rattachés à ${company.name}.`}
                            />
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                hidden
                                onChange={handleFileChange}
                            />
                            <Button
                                variant="outlined"
                                startIcon={<Upload size={16} />}
                                disabled={isImporting}
                                onClick={() => fileInputRef.current?.click()}
                                sx={{ borderRadius: 3, flexShrink: 0 }}
                            >
                                {isImporting ? 'Import en cours…' : 'Importer un CSV'}
                            </Button>
                        </Stack>

                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            CSV (séparateur « ; ») avec colonnes : <code>first_name</code>, <code>last_name</code>,{' '}
                            <code>email</code> (obligatoires), puis <code>organisation</code>, <code>direction</code>,{' '}
                            <code>service</code>, <code>function_level</code> (optionnels). Tous les participants
                            seront rattachés à <strong>{company.name}</strong>.
                        </Typography>

                        <Box sx={{ overflowX: 'auto' }}>
                            <Table sx={{ minWidth: 600 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Participant</TableCell>
                                        <TableCell>Réponses</TableCell>
                                        <TableCell>Statut</TableCell>
                                        <TableCell />
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {participantsLoading ? (
                                        <SkeletonTableRows rows={4} columns={4} />
                                    ) : (
                                        participants.map(p => (
                                            <TableRow hover key={p.id}>
                                                <TableCell>
                                                    <a
                                                        href={`${cfg.participantPathPrefix}/${p.id}`}
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
                                                <TableCell>{p.response_count}</TableCell>
                                                <TableCell>
                                                    <ParticipantStatusChip participant={p} />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Button
                                                        size="small"
                                                        color="error"
                                                        startIcon={<Trash2 size={14} />}
                                                        onClick={() => setDeleteParticipantTarget(p)}
                                                    >
                                                        Supprimer
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                    {!participantsLoading && participants.length === 0 && (
                                        <EmptyTableRow
                                            colSpan={4}
                                            message="Aucun collaborateur rattaché à cette entreprise."
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
                                onPageChange={setPage}
                                onRowsPerPageChange={next => {
                                    setRowsPerPage(next);
                                    setPage(0);
                                }}
                            />
                        )}
                    </CardContent>
                </Card>

                <Card variant="outlined" sx={{ borderColor: 'rgba(239,68,68,0.3)' }}>
                    <CardContent sx={{ p: 2.5 }}>
                        <SectionTitle title="Zone dangereuse" subtitle="Actions irréversibles — RGPD." />
                        <Button
                            variant="outlined"
                            color="error"
                            fullWidth
                            startIcon={<Trash2 size={16} />}
                            disabled={deleteCompany.isPending}
                            onClick={() => setDeleteCompanyOpen(true)}
                            sx={{ borderRadius: 3, mt: 1 }}
                        >
                            Supprimer l'entreprise
                        </Button>
                        {deleteCompany.isError && (
                            <Alert severity="error" sx={{ mt: 1.5 }}>
                                Erreur lors de la suppression.
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </Stack>
        </Stack>
    );
}
