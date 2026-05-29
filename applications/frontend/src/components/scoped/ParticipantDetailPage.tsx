// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Link as MuiLink, Skeleton, Stack, Typography } from '@mui/material';
import { Link, useNavigate } from '@tanstack/react-router';
import { ClipboardList, Mail, MessageSquareText } from 'lucide-react';
import * as React from 'react';

import { AddParticipantToCampaignDrawerForm } from '@/components/admin/AddParticipantToCampaignDrawerForm';
import { DeleteCompanyParticipantDialog } from '@/components/admin/company-detail/DeleteCompanyParticipantDialog';
import { ParticipantCampaignsTable } from '@/components/admin/participant-detail/ParticipantCampaignsTable';
import { ParticipantDangerZone } from '@/components/admin/participant-detail/ParticipantDangerZone';
import { ParticipantInfoCard } from '@/components/admin/participant-detail/ParticipantInfoCard';
import { KpiCard } from '@/components/common/cards';
import { KpiGrid } from '@/components/common/layout';
import { useBreadcrumbs } from '@/components/layout/AppShellChromeContext';
import { useParticipant, useUpdateParticipant } from '@/hooks/admin';
import { useAuthStore } from '@/stores/authStore';
import type { ParticipantCampaignAssignment, UpdateParticipantProfileBody } from '@aor/types';

const SKELETON_KEYS = ['stat-1', 'stat-2', 'stat-3'] as const;

const SUBTITLE =
    'Profil organisationnel du collaborateur, indicateurs d’activité et campagnes rattachées.';

export type ParticipantDetailScope = 'admin' | 'coach';

export type ParticipantDetailPageProps = {
    scope: ParticipantDetailScope;
    participantId: number;
};

const SCOPE_CFG: Record<
    ParticipantDetailScope,
    {
        scopePrefix: '/admin' | '/coach';
        companiesListTo: '/admin/companies' | '/coach/companies';
        companyDetailTo: (companyId: number) => string;
        notFound: string;
    }
> = {
    admin: {
        scopePrefix: '/admin',
        companiesListTo: '/admin/companies',
        companyDetailTo: companyId => `/admin/companies/${companyId}`,
        notFound: 'Collaborateur introuvable.',
    },
    coach: {
        scopePrefix: '/coach',
        companiesListTo: '/coach/companies',
        companyDetailTo: companyId => `/coach/companies/${companyId}`,
        notFound: 'Collaborateur introuvable ou hors de votre périmètre.',
    },
};

export function ParticipantDetailPage({ scope, participantId }: ParticipantDetailPageProps) {
    const cfg = SCOPE_CFG[scope];
    const isAdmin = scope === 'admin';
    const navigate = useNavigate();
    const adminMe = useAuthStore(s => s.adminMe);
    const currentCoachId = isAdmin ? null : (adminMe?.coachId ?? null);

    const { data, isLoading, isError } = useParticipant(participantId);
    const updateParticipant = useUpdateParticipant();

    const [editDrawerOpen, setEditDrawerOpen] = React.useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

    const participant = data?.participant;
    const campaigns: ParticipantCampaignAssignment[] = data?.campaigns ?? [];

    useBreadcrumbs(
        isAdmin
            ? participant
                ? participant.company
                    ? [
                          { label: 'Administration' },
                          { label: 'Entreprises', to: cfg.companiesListTo },
                          {
                              label: participant.company.name,
                              to: cfg.companyDetailTo(participant.company.id),
                          },
                          { label: participant.full_name },
                      ]
                    : [
                          { label: 'Administration' },
                          { label: 'Entreprises', to: cfg.companiesListTo },
                          { label: participant.full_name },
                      ]
                : [{ label: 'Administration' }, { label: 'Entreprises', to: cfg.companiesListTo }]
            : participant
              ? participant.company
                  ? [
                        { label: 'Entreprises', to: cfg.companiesListTo },
                        {
                            label: participant.company.name,
                            to: cfg.companyDetailTo(participant.company.id),
                        },
                        { label: participant.full_name },
                    ]
                  : [{ label: 'Entreprises', to: cfg.companiesListTo }, { label: participant.full_name }]
              : [{ label: 'Entreprises', to: cfg.companiesListTo }]
    );

    const canDelete =
        participant &&
        (currentCoachId === null || participant.created_by_coach_id === currentCoachId);

    if (isLoading) {
        return (
            <Stack
                spacing={3}
                role="status"
                aria-live="polite"
                aria-busy="true"
                aria-label="Chargement du collaborateur"
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

    if (isError || !participant) {
        return (
            <Stack spacing={2} sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    {cfg.notFound}
                </Typography>
                <MuiLink component={Link} to={cfg.companiesListTo} underline="hover" sx={{ fontWeight: 600 }}>
                    Retour aux entreprises
                </MuiLink>
            </Stack>
        );
    }

    const inviteCount = Object.keys(participant.invite_status).length;
    const subtitleParts = [participant.email];
    if (participant.company) {
        subtitleParts.push(participant.company.name);
    }

    const handleDeleted = () => {
        setDeleteDialogOpen(false);
        if (participant.company) {
            navigate({ to: cfg.companyDetailTo(participant.company.id) });
        } else {
            navigate({ to: cfg.companiesListTo });
        }
    };

    return (
        <Stack spacing={3} sx={{ minWidth: 0 }}>
            <AddParticipantToCampaignDrawerForm
                open={editDrawerOpen}
                mode="edit"
                isSubmitting={updateParticipant.isPending}
                initialValues={{
                    firstName: participant.first_name,
                    lastName: participant.last_name,
                    email: participant.email,
                    organisation: participant.organisation ?? '',
                    direction: participant.direction ?? '',
                    service: participant.service ?? '',
                    functionLevel: participant.function_level ?? '',
                }}
                onClose={() => {
                    setEditDrawerOpen(false);
                    updateParticipant.reset();
                }}
                onSubmit={async values => {
                    const body: UpdateParticipantProfileBody = {
                        organisation: values.organisation.trim() === '' ? null : values.organisation.trim(),
                        direction: values.direction.trim() === '' ? null : values.direction.trim(),
                        service: values.service.trim() === '' ? null : values.service.trim(),
                        function_level: values.functionLevel === '' ? null : values.functionLevel,
                    };
                    try {
                        await updateParticipant.mutateAsync({ participantId, body });
                        setEditDrawerOpen(false);
                    } catch {
                        // Toast émis par le hook ; on garde le drawer ouvert.
                    }
                }}
            />

            <DeleteCompanyParticipantDialog
                participant={deleteDialogOpen ? participant : null}
                onClose={() => setDeleteDialogOpen(false)}
                onDeleted={handleDeleted}
            />

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
                    {participant.full_name}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720, lineHeight: 1.7 }}>
                    {subtitleParts.join(' — ')}. {SUBTITLE}
                </Typography>
            </Box>

            <KpiGrid columns={3}>
                <KpiCard
                    label="Réponses"
                    value={participant.response_count}
                    helper="collectées"
                    icon={MessageSquareText}
                />
                <KpiCard label="Invitations" value={inviteCount} helper="par questionnaire" icon={Mail} />
                <KpiCard label="Campagnes" value={campaigns.length} helper="rattachées" icon={ClipboardList} />
            </KpiGrid>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 0.85fr) minmax(0, 1.15fr)' },
                    gap: 3,
                    alignItems: 'start',
                }}
            >
                <ParticipantInfoCard
                    participant={participant}
                    companyDetailTo={
                        participant.company ? cfg.companyDetailTo(participant.company.id) : undefined
                    }
                    onEdit={() => setEditDrawerOpen(true)}
                />

                <ParticipantCampaignsTable
                    campaigns={campaigns}
                    getDetailTo={campaignId => `${cfg.scopePrefix}/campaigns/${campaignId}`}
                />
            </Box>

            {canDelete ? (
                <ParticipantDangerZone onDeleteClick={() => setDeleteDialogOpen(true)} />
            ) : null}
        </Stack>
    );
}
