// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Skeleton, Stack } from '@mui/material';
import { useNavigate } from '@tanstack/react-router';
import * as React from 'react';

import { useParticipant } from '@/hooks/admin';

export type LegacyParticipantDetailRedirectProps = {
    participantId: number;
    scope: 'admin' | 'coach';
};

/**
 * Redirige les anciennes URLs `/admin|coach/participants/:id` vers
 * `/admin|coach/companies/:companyId/participants/:id`.
 */
export function LegacyParticipantDetailRedirect({
    participantId,
    scope,
}: LegacyParticipantDetailRedirectProps) {
    const navigate = useNavigate();
    const { data, isError, isLoading } = useParticipant(participantId);

    React.useEffect(() => {
        if (isLoading) return;

        const companiesList = scope === 'admin' ? '/admin/companies' : '/coach/companies';
        const companyId = data?.participant.company?.id;

        if (isError || !companyId) {
            navigate({ to: companiesList, replace: true });
            return;
        }

        navigate({
            to:
                scope === 'admin'
                    ? '/admin/companies/$companyId/participants/$participantId'
                    : '/coach/companies/$companyId/participants/$participantId',
            params: {
                companyId: String(companyId),
                participantId: String(participantId),
            },
            replace: true,
        });
    }, [data, isError, isLoading, navigate, participantId, scope]);

    return (
        <Stack spacing={2} role="status" aria-live="polite" aria-busy="true" aria-label="Redirection">
            <Skeleton variant="text" width={280} height={28} />
            <Skeleton variant="rounded" height={320} />
        </Stack>
    );
}
