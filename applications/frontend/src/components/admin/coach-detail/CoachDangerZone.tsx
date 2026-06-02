// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Alert, Box, Button, Card, CardContent, Typography } from '@mui/material';
import { Trash2 } from 'lucide-react';

import { surfaceCardSx } from '@/components/common/styles/listSurfaces';

export type CoachDangerZoneProps = {
    campaignCount: number;
    onDeleteClick: () => void;
    isDeleting?: boolean;
    hasError?: boolean;
};

export function CoachDangerZone({
    campaignCount,
    onDeleteClick,
    isDeleting = false,
    hasError = false,
}: CoachDangerZoneProps) {
    return (
        <Card variant="outlined" sx={{ ...surfaceCardSx, borderColor: 'tint.dangerBorder' }}>
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" fontWeight={700} color="error.main" sx={{ mb: 0.5 }}>
                        Zone dangereuse
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        Suppression définitive du coach — action irréversible.
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    startIcon={<Trash2 size={16} />}
                    disabled={isDeleting}
                    onClick={onDeleteClick}
                    sx={{ borderRadius: 2 }}
                >
                    Supprimer le coach
                </Button>
                {campaignCount > 0 ? (
                    <Alert severity="info" sx={{ mt: 1.5 }}>
                        À la suppression, les {campaignCount} campagne
                        {campaignCount > 1 ? 's' : ''} de ce coach seront automatiquement réaffectée
                        {campaignCount > 1 ? 's' : ''} au compte admin.
                    </Alert>
                ) : null}
                {hasError ? (
                    <Alert severity="error" sx={{ mt: 1.5 }}>
                        Erreur lors de la suppression.
                    </Alert>
                ) : null}
            </CardContent>
        </Card>
    );
}
