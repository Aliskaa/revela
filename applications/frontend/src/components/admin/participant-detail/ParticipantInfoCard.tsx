// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Avatar, Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { Link } from '@tanstack/react-router';
import { Building2, Mail, PencilLine, UserRound } from 'lucide-react';

import { Button } from '@/components/common/Button';
import { drawerSectionTitleSx, surfaceCardSx } from '@/components/common/styles/listSurfaces';
import type { Participant, ParticipantFunctionLevel } from '@aor/types';

const FUNCTION_LEVEL_LABELS: Record<ParticipantFunctionLevel, string> = {
    direction: 'Direction',
    middle_management: 'Management intermédiaire',
    frontline_manager: 'Manager de proximité',
};

function participantInitials(firstName: string, lastName: string): string {
    const a = firstName.trim().charAt(0);
    const b = lastName.trim().charAt(0);
    return `${a}${b}`.toUpperCase() || '?';
}

function displayOrEmpty(value: string | null | undefined): { text: string; isEmpty: boolean } {
    const trimmed = value?.trim();
    if (!trimmed) return { text: 'Non renseigné', isEmpty: true };
    return { text: trimmed, isEmpty: false };
}

export type ParticipantInfoCardProps = {
    participant: Participant;
    companyDetailTo?: string;
    onEdit: () => void;
};

export function ParticipantInfoCard({ participant, companyDetailTo, onEdit }: ParticipantInfoCardProps) {
    const initials = participantInitials(participant.first_name, participant.last_name);
    const functionLabel = participant.function_level
        ? FUNCTION_LEVEL_LABELS[participant.function_level]
        : null;

    const orgFields = [
        { label: 'Organisation', ...displayOrEmpty(participant.organisation) },
        { label: 'Entité (Direction)', ...displayOrEmpty(participant.direction) },
        { label: 'Service', ...displayOrEmpty(participant.service) },
    ];
    const profileComplete = orgFields.filter(f => !f.isEmpty).length + (functionLabel ? 1 : 0);

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
                                Identité et profil organisationnel.
                            </Typography>
                        </Box>
                        <Button
                            appearance="secondary"
                            size="small"
                            startIcon={<PencilLine size={14} />}
                            onClick={onEdit}
                            sx={{ flexShrink: 0 }}
                        >
                            Modifier
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
                            {initials}
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography
                                variant="subtitle1"
                                fontWeight={700}
                                color="primary.main"
                                sx={{ lineHeight: 1.25, letterSpacing: -0.02 }}
                            >
                                {participant.full_name}
                            </Typography>
                            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.5, minWidth: 0 }}>
                                <Box
                                    component="span"
                                    sx={{ color: 'text.secondary', display: 'inline-flex', flexShrink: 0 }}
                                >
                                    <Mail size={14} strokeWidth={1.75} aria-hidden />
                                </Box>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
                                >
                                    {participant.email}
                                </Typography>
                            </Stack>
                            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1.25 }}>
                                {participant.company ? (
                                    companyDetailTo ? (
                                        <Chip
                                            component={Link}
                                            clickable
                                            icon={<Building2 size={14} aria-hidden />}
                                            label={participant.company.name}
                                            to={companyDetailTo}
                                            sx={{
                                                borderRadius: 2,
                                                bgcolor: 'background.paper',
                                                border: '1px solid',
                                                borderColor: 'surface.outlineVariantSoft',
                                                fontWeight: 600,
                                                color: 'primary.main',
                                                '& .MuiChip-icon': { color: 'primary.main' },
                                                textDecoration: 'none',
                                                '&:hover': { bgcolor: 'surface.lavenderGrey' },
                                            }}
                                        />
                                    ) : (
                                        <Chip
                                            icon={<Building2 size={14} aria-hidden />}
                                            label={participant.company.name}
                                            sx={{
                                                borderRadius: 2,
                                                bgcolor: 'background.paper',
                                                border: '1px solid',
                                                borderColor: 'surface.outlineVariantSoft',
                                                fontWeight: 600,
                                                '& .MuiChip-icon': { color: 'primary.main' },
                                            }}
                                        />
                                    )
                                ) : (
                                    <Chip
                                        icon={<Building2 size={14} aria-hidden />}
                                        label="Entreprise non renseignée"
                                        sx={{
                                            borderRadius: 2,
                                            bgcolor: 'surface.lavenderGrey',
                                            color: 'text.secondary',
                                            fontWeight: 500,
                                            fontStyle: 'italic',
                                        }}
                                    />
                                )}
                                {functionLabel ? (
                                    <Chip
                                        icon={<UserRound size={14} aria-hidden />}
                                        label={functionLabel}
                                        sx={{
                                            borderRadius: 2,
                                            bgcolor: 'tint.primaryBg',
                                            color: 'primary.main',
                                            fontWeight: 600,
                                            border: '1px solid',
                                            borderColor: 'tint.primaryRail',
                                            '& .MuiChip-icon': { color: 'primary.main' },
                                        }}
                                    />
                                ) : null}
                            </Stack>
                        </Box>
                    </Stack>
                </Box>

                <Box sx={{ px: { xs: 2.5, md: 3 }, py: 2.5 }}>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="baseline"
                        spacing={2}
                        sx={{ mb: 2 }}
                    >
                        <Typography component="h3" sx={drawerSectionTitleSx}>
                            Profil organisationnel
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, flexShrink: 0 }}>
                            {profileComplete}/4 renseigné{profileComplete > 1 ? 's' : ''}
                        </Typography>
                    </Stack>

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                            gap: 2,
                        }}
                    >
                        {orgFields.map(field => (
                            <ProfileSummaryField
                                key={field.label}
                                label={field.label}
                                value={field.text}
                                isEmpty={field.isEmpty}
                            />
                        ))}
                        <ProfileSummaryField
                            label="Niveau de fonction"
                            value={functionLabel ?? 'Non renseigné'}
                            isEmpty={!functionLabel}
                        />
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}

type ProfileSummaryFieldProps = {
    label: string;
    value: string;
    isEmpty?: boolean;
};

function ProfileSummaryField({ label, value, isEmpty = false }: ProfileSummaryFieldProps) {
    return (
        <Box
            sx={{
                bgcolor: isEmpty ? 'surface.containerLow' : 'surface.softWhite',
                borderRadius: 2,
                p: 2,
                border: '1px solid',
                borderColor: isEmpty ? 'surface.outlineVariantFaint' : 'surface.outlineVariantSoft',
                borderStyle: isEmpty ? 'dashed' : 'solid',
            }}
        >
            <Typography
                component="span"
                variant="caption"
                sx={{
                    display: 'block',
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    lineHeight: 1.2,
                    mb: 0.5,
                }}
            >
                {label}
            </Typography>
            <Typography
                component="span"
                sx={{
                    display: 'block',
                    fontWeight: isEmpty ? 500 : 600,
                    fontSize: '1.125rem',
                    color: isEmpty ? 'text.secondary' : 'text.primary',
                    fontStyle: isEmpty ? 'italic' : 'normal',
                    lineHeight: 1.35,
                    opacity: isEmpty ? 0.85 : 1,
                }}
            >
                {value}
            </Typography>
        </Box>
    );
}
