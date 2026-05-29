// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Alert, Avatar, Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { AtSign, CalendarDays, ClipboardList, PencilLine, ShieldCheck, UserRound } from 'lucide-react';

import { Button } from '@/components/common/Button';
import { ActiveStatusChip, AdminBadge } from '@/components/common/chips';
import { drawerSectionTitleSx, surfaceCardSx } from '@/components/common/styles/listSurfaces';
import type { Coach } from '@aor/types';

function coachInitial(displayName: string): string {
    const trimmed = displayName.trim();
    return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
}

function formatCreatedAt(createdAt: string | null | undefined): string {
    return createdAt
        ? new Date(createdAt).toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
          })
        : '–';
}

export type CoachInfoCardProps = {
    coach: Coach;
    campaignCount: number;
    onEdit: () => void;
};

export function CoachInfoCard({ coach, campaignCount, onEdit }: CoachInfoCardProps) {
    const isAdminCoach = coach.isAdmin;
    const initial = coachInitial(coach.displayName);

    const summaryFields = [
        { label: 'Nom à afficher', value: coach.displayName },
        { label: 'Username', value: coach.username },
        {
            label: 'Compte créé',
            value: formatCreatedAt(coach.createdAt),
        },
        { label: 'Campagnes', value: String(campaignCount) },
    ];

    return (
        <Card variant="outlined" sx={{ ...surfaceCardSx, overflow: 'hidden' }}>
            <CardContent sx={{ p: 0 }}>
                <Box
                    sx={{
                        px: { xs: 2.5, md: 3 },
                        pt: { xs: 2.5, md: 3 },
                        pb: 2,
                        borderBottom: '1px solid',
                        borderColor: 'border',
                    }}
                >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ mb: 0.5 }}>
                                Informations
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                Identité et accès du coach.
                            </Typography>
                        </Box>
                        <Button
                            appearance="secondary"
                            size="small"
                            startIcon={<PencilLine size={14} />}
                            onClick={onEdit}
                            sx={{ flexShrink: 0 }}
                        >
                            {isAdminCoach ? 'Modifier le nom' : 'Modifier'}
                        </Button>
                    </Stack>
                </Box>

                <Box
                    sx={{
                        px: { xs: 2.5, md: 3 },
                        py: 2.5,
                        bgcolor: 'tint.primaryWash',
                        borderBottom: '1px solid',
                        borderColor: 'surface.outlineVariantFaint',
                    }}
                >
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                            sx={{
                                width: 56,
                                height: 56,
                                bgcolor: 'primary.main',
                                fontWeight: 700,
                                fontSize: '1.125rem',
                                letterSpacing: '0.04em',
                                boxShadow: theme => theme.palette.shadow.brandMd,
                                flexShrink: 0,
                            }}
                        >
                            {initial}
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                <Typography
                                    variant="subtitle1"
                                    fontWeight={700}
                                    color="primary.main"
                                    sx={{ lineHeight: 1.25, letterSpacing: -0.02 }}
                                >
                                    {coach.displayName}
                                </Typography>
                                {isAdminCoach ? <AdminBadge /> : null}
                                <ActiveStatusChip isActive={coach.isActive} inactiveLabel="Pause" />
                            </Stack>
                            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.5, minWidth: 0 }}>
                                <Box
                                    component="span"
                                    sx={{ color: 'text.secondary', display: 'inline-flex', flexShrink: 0 }}
                                >
                                    <AtSign size={14} strokeWidth={1.75} aria-hidden />
                                </Box>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
                                >
                                    {coach.username}
                                </Typography>
                            </Stack>
                        </Box>
                    </Stack>
                </Box>

                <Box sx={{ px: { xs: 2.5, md: 3 }, py: 2.5 }}>
                    <Typography component="h3" sx={{ ...drawerSectionTitleSx, mb: 2 }}>
                        Résumé
                    </Typography>
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                            gap: 2,
                        }}
                    >
                        {summaryFields.map(field => (
                            <CoachSummaryField key={field.label} label={field.label} value={field.value} />
                        ))}
                    </Box>
                </Box>

                {isAdminCoach ? (
                    <Box sx={{ px: { xs: 2.5, md: 3 }, pb: 2.5 }}>
                        <Alert severity="info" icon={<ShieldCheck size={18} />}>
                            Ce compte est la cible d'assignation des campagnes détenues par l'admin. Seul le nom à
                            afficher est modifiable depuis cette interface ; le username, le mot de passe et le statut
                            sont verrouillés.
                        </Alert>
                    </Box>
                ) : null}
            </CardContent>
        </Card>
    );
}

type CoachSummaryFieldProps = {
    label: string;
    value: string;
};

function CoachSummaryField({ label, value }: CoachSummaryFieldProps) {
    const icon =
        label === 'Campagnes' ? (
            <ClipboardList size={14} aria-hidden />
        ) : label === 'Compte créé' ? (
            <CalendarDays size={14} aria-hidden />
        ) : (
            <UserRound size={14} aria-hidden />
        );

    return (
        <Box
            sx={{
                bgcolor: 'surface.softWhite',
                borderRadius: 2,
                p: 2,
                border: '1px solid',
                borderColor: 'surface.outlineVariantSoft',
            }}
        >
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
                <Box component="span" sx={{ color: 'text.secondary', display: 'inline-flex' }}>
                    {icon}
                </Box>
                <Typography
                    component="span"
                    variant="caption"
                    sx={{
                        color: 'text.secondary',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        lineHeight: 1.2,
                    }}
                >
                    {label}
                </Typography>
            </Stack>
            <Typography
                component="span"
                sx={{
                    display: 'block',
                    fontWeight: 600,
                    fontSize: '1.125rem',
                    color: 'text.primary',
                    lineHeight: 1.35,
                }}
            >
                {value}
            </Typography>
        </Box>
    );
}
