// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import { Trash2 } from 'lucide-react';

import { surfaceCardSx } from '@/components/common/styles/listSurfaces';

export type CompanyDangerZoneProps = {
    onDeleteClick: () => void;
};

export function CompanyDangerZone({ onDeleteClick }: CompanyDangerZoneProps) {
    return (
        <Card variant="outlined" sx={{ ...surfaceCardSx, borderColor: 'tint.dangerBorder' }}>
            <CardContent sx={{ p: 3 }}>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" fontWeight={700} color="error.main" sx={{ mb: 0.5 }}>
                        Zone dangereuse
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        Actions irréversibles — RGPD.
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    startIcon={<Trash2 size={16} />}
                    onClick={onDeleteClick}
                    sx={{ borderRadius: 2 }}
                >
                    Supprimer l'entreprise
                </Button>
            </CardContent>
        </Card>
    );
}
