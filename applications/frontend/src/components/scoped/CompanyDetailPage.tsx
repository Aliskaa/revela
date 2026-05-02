// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Button, Card, CardContent, Skeleton, Snackbar, Stack, Typography } from '@mui/material';
import { Link, useNavigate } from '@tanstack/react-router';
import { Building2, Mail, Users } from 'lucide-react';
import * as React from 'react';

import { CompanyDangerZone } from '@/components/admin/company-detail/CompanyDangerZone';
import { CompanyParticipantsTable } from '@/components/admin/company-detail/CompanyParticipantsTable';
import { DeleteCompanyDialog } from '@/components/admin/company-detail/DeleteCompanyDialog';
import { DeleteCompanyParticipantDialog } from '@/components/admin/company-detail/DeleteCompanyParticipantDialog';
import { StatCard } from '@/components/common/cards';
import { KpiGrid, PageHeroCard } from '@/components/common/layout';
import { useCompanies, useParticipants } from '@/hooks/admin';
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

    const [deleteCompanyOpen, setDeleteCompanyOpen] = React.useState(false);
    const [deleteParticipantTarget, setDeleteParticipantTarget] = React.useState<Participant | null>(null);
    const [snack, setSnack] = React.useState<string | null>(null);

    const company = companies.find(c => c.id === companyId);
    const participants = participantsData?.items ?? [];
    const totalCount = participantsData?.total ?? 0;
    const isLoading = companiesLoading || participantsLoading;

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

            <DeleteCompanyDialog
                open={deleteCompanyOpen}
                company={company}
                onClose={() => setDeleteCompanyOpen(false)}
                onDeleted={() => navigate({ to: cfg.backTo })}
            />

            <DeleteCompanyParticipantDialog
                participant={deleteParticipantTarget}
                onClose={() => setDeleteParticipantTarget(null)}
                onDeleted={setSnack}
            />

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
                <StatCard label="Entreprise" value={company.name} icon={Building2} />
            </KpiGrid>

            <Stack spacing={3}>
                <CompanyParticipantsTable
                    companyId={company.id}
                    companyName={company.name}
                    participants={participants}
                    loading={participantsLoading}
                    totalCount={totalCount}
                    page={page}
                    rowsPerPage={rowsPerPage}
                    onPageChange={setPage}
                    onRowsPerPageChange={setRowsPerPage}
                    participantPathPrefix={cfg.participantPathPrefix}
                    onDeleteClick={setDeleteParticipantTarget}
                />

                <CompanyDangerZone onDeleteClick={() => setDeleteCompanyOpen(true)} />
            </Stack>
        </Stack>
    );
}
