// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Button, Card, CardContent } from '@mui/material';
import { Trash2 } from 'lucide-react';

import { SectionTitle } from '@/components/common/SectionTitle';

export type CompanyDangerZoneProps = {
    onDeleteClick: () => void;
};

export function CompanyDangerZone({ onDeleteClick }: CompanyDangerZoneProps) {
    return (
        <Card variant="outlined" sx={{ borderColor: 'rgba(239,68,68,0.3)' }}>
            <CardContent sx={{ p: 2.5 }}>
                <SectionTitle title="Zone dangereuse" subtitle="Actions irréversibles — RGPD." />
                <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    startIcon={<Trash2 size={16} />}
                    onClick={onDeleteClick}
                    sx={{ borderRadius: 3, mt: 1 }}
                >
                    Supprimer l'entreprise
                </Button>
            </CardContent>
        </Card>
    );
}
