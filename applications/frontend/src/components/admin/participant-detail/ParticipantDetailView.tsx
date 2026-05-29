// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Box,
    Button,
    Card,
    CardContent,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableCell,
    Typography,
} from '@mui/material';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, ClipboardList, Mail, MessageSquareText } from 'lucide-react';
import * as React from 'react';

import { AddParticipantToCampaignDrawerForm } from '@/components/admin/AddParticipantToCampaignDrawerForm';
import { DeleteCompanyParticipantDialog } from '@/components/admin/company-detail/DeleteCompanyParticipantDialog';
import { KpiCard } from '@/components/common/cards';
import { CampaignStatusChip } from '@/components/common/chips';
import {
    ClickableTableRow,
    EmptyTableRow,
    ListTableHead,
    RowNavigateHint,
    type ListTableColumn,
} from '@/components/common/data-table';
import { KpiGrid } from '@/components/common/layout';
import {
    harmonizedTableCellSx,
    surfaceCardSx,
} from '@/components/common/styles/listSurfaces';
import { useBreadcrumbs } from '@/components/layout/AppShellChromeContext';
import { useParticipant, useUpdateParticipant } from '@/hooks/admin';
import { useAuthStore } from '@/stores/authStore';
import type {
    CampaignStatus,
    ParticipantCampaignAssignment,
    UpdateParticipantProfileBody,
} from '@aor/types';

import { ParticipantDangerZone } from './ParticipantDangerZone';
import { ParticipantInfoCard } from './ParticipantInfoCard';

const SKELETON_KEYS = ['stat-1', 'stat-2', 'stat-3'] as const;
const EDGE_X = 3;
const CAMPAIGNS_TABLE_MIN_WIDTH = 640;

export type ParticipantDetailScope = 'admin' | 'coach';

export type ParticipantDetailViewProps = {
    participantId: number;
    /** Préfixe d'URL — `/admin` ou `/coach`. Utilisé pour les liens internes. */
    scopePrefix: '/admin' | '/coach';
};

const SCOPE_CFG: Record<
    ParticipantDetailScope,
    {
        companiesListTo: '/admin/companies' | '/coach/companies';
        companyDetailTo: (companyId: number) => string;
        notFound: string;
    }
> = {
    admin: {
        companiesListTo: '/admin/companies',
        companyDetailTo: companyId => `/admin/companies/${companyId}`,
        notFound: 'Collaborateur introuvable.',
    },
    coach: {
        companiesListTo: '/coach/companies',
        companyDetailTo: companyId => `/coach/companies/${companyId}`,
        notFound: 'Collaborateur introuvable ou hors de votre périmètre.',
    },
};

export function ParticipantDetailView({ participantId, scopePrefix }: ParticipantDetailViewProps) {
    const scope: ParticipantDetailScope = scopePrefix === '/admin' ? 'admin' : 'coach';
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

    const campaignColumns: ListTableColumn[] = [
        { key: 'status', sx: { pl: EDGE_X, width: 48 } },
        { key: 'campaign', label: 'Campagne' },
        { key: 'company', label: 'Entreprise' },
        { key: 'joined', label: 'Rejoint le' },
        { key: 'navigate', align: 'right', sx: { pr: EDGE_X, width: 48 } },
    ];
    const campaignColSpan = campaignColumns.length;

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
                <Link to={cfg.companiesListTo}>
                    <Button variant="outlined" startIcon={<ArrowLeft size={16} />}>
                        Retour aux entreprises
                    </Button>
                </Link>
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
                    {subtitleParts.join(' — ')}. Profil organisationnel et campagnes rattachées.
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

                <Card variant="outlined" sx={{ ...surfaceCardSx, overflow: 'hidden' }}>
                    <CardContent sx={{ p: 0 }}>
                        <Box sx={{ px: { xs: 2.5, md: 3 }, pt: 3, pb: 2 }}>
                            <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ mb: 0.5 }}>
                                Campagnes
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                Campagnes auxquelles ce collaborateur est rattaché.
                            </Typography>
                        </Box>

                        <Box sx={{ overflowX: 'auto', px: { xs: 1, md: 0 } }}>
                            <Table sx={{ minWidth: CAMPAIGNS_TABLE_MIN_WIDTH }}>
                                <ListTableHead columns={campaignColumns} />
                                <TableBody>
                                    {campaigns.length === 0 ? (
                                        <EmptyTableRow
                                            colSpan={campaignColSpan}
                                            message="Aucune campagne rattachée."
                                        />
                                    ) : (
                                        campaigns.map(c => {
                                            const detailTo = `${scopePrefix}/campaigns/${c.campaign_id}`;
                                            return (
                                                <ClickableTableRow
                                                    key={c.campaign_id}
                                                    to={detailTo}
                                                    ariaLabel={`Ouvrir ${c.campaign_name}`}
                                                >
                                                    <TableCell sx={{ pl: EDGE_X, ...harmonizedTableCellSx }}>
                                                        <CampaignStatusChip status={c.status as CampaignStatus} />
                                                    </TableCell>
                                                    <TableCell sx={harmonizedTableCellSx}>
                                                        <Typography
                                                            fontWeight={700}
                                                            color="primary.main"
                                                            lineHeight={1.2}
                                                            sx={{ fontSize: '1.0625rem' }}
                                                        >
                                                            {c.campaign_name}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={harmonizedTableCellSx}>
                                                        <Typography fontWeight={600} color="text.primary">
                                                            {c.company_name ?? '–'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell sx={harmonizedTableCellSx}>
                                                        <Typography color="text.secondary" fontWeight={600}>
                                                            {c.joined_at
                                                                ? new Date(c.joined_at).toLocaleDateString('fr-FR', {
                                                                      day: '2-digit',
                                                                      month: 'long',
                                                                      year: 'numeric',
                                                                  })
                                                                : '–'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ pr: EDGE_X, ...harmonizedTableCellSx }}>
                                                        <RowNavigateHint />
                                                    </TableCell>
                                                </ClickableTableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </Box>
                    </CardContent>
                </Card>
            </Box>

            {canDelete ? (
                <ParticipantDangerZone onDeleteClick={() => setDeleteDialogOpen(true)} />
            ) : null}
        </Stack>
    );
}
