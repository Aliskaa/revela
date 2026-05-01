// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { createFileRoute, redirect } from '@tanstack/react-router';

/**
 * La liste cross-campagnes « Mes participants » a été retirée : un participant
 * n'a de sens que dans le contexte d'une campagne ou d'une entreprise. La liste
 * des participants se consulte désormais depuis la fiche entreprise ou la fiche
 * campagne. On garde la route en redirection vers le dashboard coach pour ne
 * pas casser les anciens liens externes.
 */
export const Route = createFileRoute('/coach/participants/')({
    beforeLoad: () => {
        throw redirect({ to: '/coach' });
    },
});
