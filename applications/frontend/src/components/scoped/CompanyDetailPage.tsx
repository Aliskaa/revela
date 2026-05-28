// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Link as MuiLink, Skeleton, Stack, Typography } from '@mui/material';
import { Link, useNavigate } from '@tanstack/react-router';
import { Building2, Mail, Users } from 'lucide-react';
import * as React from 'react';

import { CompanyDangerZone } from '@/components/admin/company-detail/CompanyDangerZone';
import { useBreadcrumbs } from '@/components/layout/AppShellChromeContext';
import { CompanyParticipantsTable } from '@/components/admin/company-detail/CompanyParticipantsTable';
import { DeleteCompanyDialog } from '@/components/admin/company-detail/DeleteCompanyDialog';
import { KpiCard } from '@/components/common/cards';
import { KpiGrid } from '@/components/common/layout';
import { useCompanies, useParticipants } from '@/hooks/admin';
import { usePageResetEffect } from '@/lib/usePageResetEffect';

const SKELETON_KEYS = ['stat-1', 'stat-2', 'stat-3'] as const;

const SUBTITLE =
    'Fiche entreprise avec la liste des collaborateurs rattachés et les actions de gestion.';

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
    const isAdmin = scope === 'admin';
    const navigate = useNavigate();

    const { data: companies = [], isLoading: companiesLoading } = useCompanies();
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const [search, setSearch] = React.useState('');
    const [debouncedSearch, setDebouncedSearch] = React.useState('');
    React.useEffect(() => {
        const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
        return () => window.clearTimeout(id);
    }, [search]);
    const { data: participantsData, isLoading: participantsLoading } = useParticipants(
        page + 1,
        companyId,
        rowsPerPage,
        debouncedSearch
    );

    usePageResetEffect(setPage, [rowsPerPage, debouncedSearch]);

    const [deleteCompanyOpen, setDeleteCompanyOpen] = React.useState(false);

    const company = companies.find(c => c.id === companyId);

    useBreadcrumbs(
        isAdmin
            ? company
                ? [
                      { label: 'Administration' },
                      { label: 'Entreprises', to: cfg.backTo },
                      { label: company.name },
                  ]
                : [{ label: 'Administration' }, { label: 'Entreprises', to: cfg.backTo }]
            : company
              ? [{ label: 'Entreprises', to: cfg.backTo }, { label: company.name }]
              : [{ label: 'Entreprises', to: cfg.backTo }]
    );

    const participants = participantsData?.items ?? [];
    const totalCount = participantsData?.total ?? 0;

    if (companiesLoading && !company) {
        return (
            <Stack
                spacing={3}
                role="status"
                aria-live="polite"
                aria-busy="true"
                aria-label="Chargement de l'entreprise"
            >
                <Skeleton variant="text" width={280} height={28} />
                <Skeleton variant="text" width="60%" height={48} />
                <KpiGrid columns={3}>
                    {SKELETON_KEYS.map(k => (
                        <Skeleton key={k} variant="rounded" height={140} />
                    ))}
                </KpiGrid>
                <Skeleton variant="rounded" height={400} />
            </Stack>
        );
    }

    if (!company) {
        return (
            <Stack spacing={2} sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    {cfg.notFound}
                </Typography>
                <MuiLink component={Link} to={cfg.backTo} underline="hover" sx={{ fontWeight: 600 }}>
                    Retour aux entreprises
                </MuiLink>
            </Stack>
        );
    }

    return (
        <Stack spacing={3} sx={{ minWidth: 0 }}>
            {isAdmin && (
                <DeleteCompanyDialog
                    open={deleteCompanyOpen}
                    company={company}
                    onClose={() => setDeleteCompanyOpen(false)}
                    onDeleted={() => navigate({ to: cfg.backTo })}
                />
            )}

            <Box>
                <Typography
                    variant="h3"
                    sx={{
                        color: 'primary.main',
                        fontWeight: 900,
                        letterSpacing: -0.03,
                        lineHeight: 1.1,
                        mb: 1,
                    }}
                >
                    {company.name}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720, lineHeight: 1.7 }}>
                    {SUBTITLE}
                </Typography>
            </Box>

            <KpiGrid columns={3}>
                <KpiCard
                    label="Collaborateurs"
                    value={company.participant_count}
                    helper="dans cette entreprise"
                    icon={Users}
                />
                <KpiCard
                    label="Contact"
                    value={company.contact_name ?? '–'}
                    helper={company.contact_email ?? 'non renseigné'}
                    icon={Mail}
                />
                <KpiCard label="Entreprise" value={company.name} icon={Building2} />
            </KpiGrid>

            <Stack spacing={3} sx={{ minWidth: 0 }}>
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
                    showCsvImport={isAdmin}
                    search={search}
                    onSearchChange={setSearch}
                />

                {isAdmin && <CompanyDangerZone onDeleteClick={() => setDeleteCompanyOpen(true)} />}
            </Stack>
        </Stack>
    );
}
