// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Alert, Box, Skeleton, Stack, Typography } from '@mui/material';
import { ClipboardList } from 'lucide-react';

import { CoachInfoCard } from '@/components/admin/coach-detail/CoachInfoCard';
import { KpiCard } from '@/components/common/cards';
import { KpiGrid } from '@/components/common/layout';
import { useBreadcrumbs } from '@/components/layout/AppShellChromeContext';
import { useAdminCoach, useUploadCoachAvatar } from '@/hooks/admin';
import { useAuthStore } from '@/stores/authStore';

const SUBTITLE =
    'Consultez votre profil coach. Seule la photo de profil est modifiable depuis cette page ; pour tout autre changement, contactez l’administrateur.';

export function CoachProfilePage() {
    const adminMe = useAuthStore(s => s.adminMe);
    const coachId = adminMe?.coachId ?? 0;

    const { data, isLoading, isError } = useAdminCoach(coachId, { enabled: coachId > 0 });
    const uploadCoachAvatar = useUploadCoachAvatar(coachId);

    const coach = data?.coach;
    const campaigns = data?.campaigns ?? [];

    useBreadcrumbs([{ label: 'Mon profil' }]);

    if (adminMe?.scope !== 'coach' || coachId <= 0) {
        return (
            <Stack spacing={2} sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    Cette page est réservée aux comptes coach.
                </Typography>
            </Stack>
        );
    }

    if (isLoading && !coach) {
        return (
            <Stack spacing={3}>
                <Skeleton variant="text" width={280} height={28} />
                <Skeleton variant="rounded" height={280} />
            </Stack>
        );
    }

    if (isError || !coach) {
        return (
            <Stack spacing={2} sx={{ py: 6, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                    Impossible de charger votre profil.
                </Typography>
            </Stack>
        );
    }

    return (
        <Stack spacing={3} sx={{ minWidth: 0 }}>
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
                    Mon profil
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720, lineHeight: 1.7 }}>
                    {SUBTITLE}
                </Typography>
            </Box>

            <Alert severity="info" sx={{ maxWidth: 720 }}>
                Votre nom d’utilisateur, votre mot de passe et votre statut ne sont pas modifiables ici.
            </Alert>

            <KpiGrid columns={1}>
                <KpiCard label="Campagnes" value={campaigns.length} helper="dans votre périmètre" icon={ClipboardList} />
            </KpiGrid>

            <CoachInfoCard
                coach={coach}
                campaignCount={campaigns.length}
                allowAvatarEdit
                isAvatarUploading={uploadCoachAvatar.isPending}
                onAvatarUpload={async file => {
                    try {
                        await uploadCoachAvatar.mutateAsync(file);
                    } catch {
                        // Toast émis par le hook.
                    }
                }}
            />
        </Stack>
    );
}
