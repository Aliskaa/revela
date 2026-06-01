// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { createFileRoute, redirect } from '@tanstack/react-router';

import { CoachProfilePage } from '@/components/scoped/CoachProfilePage';
import { parseAdminJwtClaims } from '@/lib/auth';

export const Route = createFileRoute('/coach/profile')({
    beforeLoad: () => {
        const claims = parseAdminJwtClaims();
        if (claims?.scope !== 'coach') {
            throw redirect({ to: '/coach' });
        }
    },
    component: CoachProfilePage,
});
