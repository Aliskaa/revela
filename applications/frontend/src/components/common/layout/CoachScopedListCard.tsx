import { Card, CardContent } from '@mui/material';
import type * as React from 'react';

import { SectionTitle } from '@/components/common/SectionTitle';

export type CoachScopedListCardProps = {
    title: string;
    subtitle?: string;
    search?: React.ReactNode;
    children: React.ReactNode;
};

/** Carte de liste coach : SectionTitle + contenu responsive. */
export function CoachScopedListCard({ title, subtitle, search, children }: CoachScopedListCardProps) {
    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
                <SectionTitle title={title} subtitle={subtitle} action={search} />
                {children}
            </CardContent>
        </Card>
    );
}
