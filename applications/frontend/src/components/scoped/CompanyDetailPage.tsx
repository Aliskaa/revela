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
import { Building2, Mail, Trash2, Users } from 'lucide-react';
import * as React from 'react';

import { SectionTitle } from '@/components/common/SectionTitle';
import { SkeletonTableRows } from '@/components/common/SkeletonRows';
import { StatCard } from '@/components/common/cards';
import { ParticipantStatusChip } from '@/components/common/chips';
import { EmptyTableRow, StandardTablePagination } from '@/components/common/data-table';
import { KpiGrid, PageHeroCard } from '@/components/common/layout';
import { useCompanies, useDeleteCompany, useDeleteParticipant, useParticipants } from '@/hooks/admin';
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

    const [deleteCompanyOpen, setDeleteCompanyOpen] = React.useState(false);
    const [deleteParticipantTarget, setDeleteParticipantTarget] = React.useState<Participant | null>(null);
    const [snack, setSnack] = React.useState<string | null>(null);

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
                        irréversible (RGPD). Les participants ne seront pas supprimés mais perdront leur rattachement.
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
                        <SectionTitle
                            title="Collaborateurs"
                            subtitle={`Les participants rattachés à ${company.name}.`}
                        />

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
