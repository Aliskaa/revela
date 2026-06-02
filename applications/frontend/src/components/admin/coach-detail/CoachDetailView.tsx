// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Link as MuiLink, Skeleton, Stack, Typography } from '@mui/material';
import { Link, useNavigate } from '@tanstack/react-router';
import { ClipboardList, UserRound } from 'lucide-react';
import * as React from 'react';

import { AdminCoachDrawerForm } from '@/components/admin/AdminCoachDrawerForm';
import { CoachCampaignsTable } from '@/components/admin/coach-detail/CoachCampaignsTable';
import { CoachDangerZone } from '@/components/admin/coach-detail/CoachDangerZone';
import { CoachInfoCard } from '@/components/admin/coach-detail/CoachInfoCard';
import { DeleteCoachDialog } from '@/components/admin/coach-detail/DeleteCoachDialog';
import { KpiCard } from '@/components/common/cards';
import { KpiGrid } from '@/components/common/layout';
import { useBreadcrumbs } from '@/components/layout/AppShellChromeContext';
import { useAdminCoach, useCompanies, useUpdateCoach, useUploadCoachAvatar } from '@/hooks/admin';

const SKELETON_KEYS = ['stat-1', 'stat-2', 'stat-3'] as const;

export type CoachDetailViewProps = {
    coachId: number;
};

export function CoachDetailView({ coachId }: CoachDetailViewProps) {
    const navigate = useNavigate();

    const { data, isLoading, isError } = useAdminCoach(coachId);
    const { data: companies = [] } = useCompanies();
    const updateCoach = useUpdateCoach();
    const uploadCoachAvatar = useUploadCoachAvatar(coachId);

    const [editOpen, setEditOpen] = React.useState(false);
    const [deleteOpen, setDeleteOpen] = React.useState(false);

    const coach = data?.coach;
    const campaigns = data?.campaigns ?? [];
    const isAdminCoach = coach?.isAdmin ?? false;

    useBreadcrumbs(
        coach
            ? [
                  { label: 'Administration' },
                  { label: 'Coachs', to: '/admin/coaches' },
                  { label: coach.displayName },
              ]
            : [{ label: 'Administration' }, { label: 'Coachs', to: '/admin/coaches' }]
    );

    const companyNameById = React.useMemo(() => {
        const map = new Map<number, string>();
        for (const company of companies) {
            map.set(company.id, company.name);
        }
        return map;
    }, [companies]);

    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const archivedCampaigns = campaigns.filter(c => c.status === 'archived').length;

    if (isLoading && !coach) {
        return (
            <Stack
                spacing={3}
                role="status"
                aria-live="polite"
                aria-busy="true"
                aria-label="Chargement du coach"
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

    if (isError || !coach) {
        return (
            <Stack spacing={2} sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    Coach introuvable.
                </Typography>
                <MuiLink component={Link} to="/admin/coaches" underline="hover" sx={{ fontWeight: 600 }}>
                    Retour aux coachs
                </MuiLink>
            </Stack>
        );
    }

    const subtitleParts = [`@${coach.username}`];
    if (isAdminCoach) {
        subtitleParts.push('compte admin');
    } else {
        subtitleParts.push(coach.isActive ? 'actif' : 'en pause');
    }

    return (
        <Stack spacing={3} sx={{ minWidth: 0 }}>
            <AdminCoachDrawerForm
                open={editOpen}
                mode="edit"
                isSubmitting={updateCoach.isPending}
                initialValues={{
                    displayName: coach.displayName,
                    username: coach.username,
                    isActive: coach.isActive,
                }}
                lockedFields={
                    isAdminCoach ? { username: true, password: true, isActive: true } : undefined
                }
                onClose={() => {
                    setEditOpen(false);
                    updateCoach.reset();
                }}
                onSubmit={async values => {
                    try {
                        await updateCoach.mutateAsync({
                            coachId,
                            displayName: values.displayName,
                            ...(isAdminCoach
                                ? {}
                                : {
                                      username: values.username,
                                      password: values.password.length > 0 ? values.password : undefined,
                                      isActive: values.isActive,
                                  }),
                        });
                        setEditOpen(false);
                    } catch {
                        // Toast émis par le hook ; on garde le drawer ouvert.
                    }
                }}
            />

            <DeleteCoachDialog
                open={deleteOpen}
                coach={coach}
                campaignCount={campaigns.length}
                onClose={() => setDeleteOpen(false)}
                onDeleted={() => navigate({ to: '/admin/coaches' })}
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
                    {coach.displayName}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720, lineHeight: 1.7 }}>
                    {subtitleParts.join(' — ')}. Campagnes rattachées et actions de gestion.
                </Typography>
            </Box>

            <KpiGrid columns={3}>
                <KpiCard
                    label="Campagnes"
                    value={campaigns.length}
                    helper="rattachées au coach"
                    icon={ClipboardList}
                />
                <KpiCard label="Actives" value={activeCampaigns} helper="en cours" icon={ClipboardList} />
                <KpiCard
                    label="Compte créé"
                    value={coach.createdAt ? new Date(coach.createdAt).toLocaleDateString('fr-FR') : '–'}
                    helper={`ID ${coach.id}`}
                    icon={UserRound}
                />
            </KpiGrid>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 0.85fr) minmax(0, 1.15fr)' },
                    gap: 3,
                    alignItems: 'start',
                }}
            >
                <CoachInfoCard
                    coach={coach}
                    campaignCount={campaigns.length}
                    allowAvatarEdit={isAdminCoach}
                    isAvatarUploading={uploadCoachAvatar.isPending}
                    onAvatarUpload={
                        isAdminCoach
                            ? async file => {
                                  try {
                                      await uploadCoachAvatar.mutateAsync(file);
                                  } catch {
                                      // Toast émis par le hook.
                                  }
                              }
                            : undefined
                    }
                    onEdit={() => setEditOpen(true)}
                />
                <CoachCampaignsTable
                    campaigns={campaigns}
                    companyNameById={companyNameById}
                    archivedCount={archivedCampaigns}
                />
            </Box>

            {!isAdminCoach ? (
                <CoachDangerZone
                    campaignCount={campaigns.length}
                    onDeleteClick={() => setDeleteOpen(true)}
                />
            ) : null}
        </Stack>
    );
}
