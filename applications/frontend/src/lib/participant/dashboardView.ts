// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { BadgeCheck, Brain, ClipboardCheck, Gauge, Lock, MessageSquareQuote, Radar, Users } from 'lucide-react';
import type { ElementType } from 'react';

import type { ParticipantSession } from '@aor/types';

/**
 * View-model du tableau de bord participant. Sortie de `routes/index.tsx`
 * pour pouvoir tester la logique métier indépendamment du JSX.
 */

export type StepState = 'completed' | 'current' | 'locked';

export type JourneyStep = {
    label: string;
    state: StepState;
    description: string;
    icon: ElementType;
    to?: string;
};

export type Metric = {
    label: string;
    value: string;
    helper: string;
    icon: ElementType;
};

export type ParticipantAssignment = ParticipantSession['assignments'][number];

export type CampaignView = {
    name: string;
    company: string;
    coach: string;
    questionnaire: string;
    questionnaireId: string | null;
    status: string;
    progress: number;
    nextAction: string;
    hasAssignment: boolean;
};

const journeyTemplate: JourneyStep[] = [
    {
        label: 'Auto-évaluation',
        state: 'locked',
        description: 'Vos réponses sont enregistrées pour la campagne en cours.',
        icon: BadgeCheck,
    },
    {
        label: 'Feedback des pairs',
        state: 'locked',
        description: 'Encore quelques réponses attendues avant de débloquer la suite.',
        icon: Users,
    },
    {
        label: 'Test Élément Humain',
        state: 'locked',
        description:
            "Approche de Will Schutz : explore les besoins fondamentaux d'inclusion, contrôle et ouverture, et l'écart entre comportement actuel et souhaité.",
        icon: Lock,
    },
    {
        label: 'Résultats',
        state: 'locked',
        description: 'Les scores et écarts seront affichés après le test.',
        icon: Radar,
    },
    {
        label: 'Restitution coaching',
        state: 'locked',
        description: 'Lecture partagée des résultats avec le coach.',
        icon: MessageSquareQuote,
    },
];

const metricsTemplate: Metric[] = [
    { label: 'Progression', value: '—', helper: 'parcours complété', icon: Gauge },
    { label: 'Auto-évaluation', value: '—', helper: 'première étape du parcours', icon: ClipboardCheck },
    { label: 'Feedback pairs', value: '—', helper: 'retours liés à la campagne', icon: Users },
    { label: 'Questionnaire', value: '—', helper: 'lié à la campagne', icon: Brain },
];

const statusLabels = {
    draft: 'Brouillon',
    active: 'En cours',
    closed: 'Clôturée',
    archived: 'Archivée',
} as const;

const stepStateFromStatus = (status?: 'locked' | 'pending' | 'completed'): StepState => {
    if (status === 'completed') {
        return 'completed';
    }
    if (status === 'pending') {
        return 'current';
    }
    return 'locked';
};

const completedStepValue = (status?: 'locked' | 'pending' | 'completed') => (status === 'completed' ? 1 : 0);

export const buildProgress = (assignment?: ParticipantAssignment): number => {
    const progression = assignment?.progression;
    if (!progression) {
        return 0;
    }
    const completed =
        completedStepValue(progression.self_rating_status) +
        completedStepValue(progression.peer_feedback_status) +
        completedStepValue(progression.element_humain_status) +
        completedStepValue(progression.results_status);
    return Math.round((completed / 4) * 100);
};

export const buildNextAction = (assignment?: ParticipantAssignment): string => {
    if (!assignment) {
        return 'Aucune action requise pour le moment';
    }
    if (!assignment.invitation_confirmed) {
        return 'Confirmer votre participation';
    }
    const progression = assignment.progression;
    if (!progression) {
        return assignment.allow_test_without_manual_inputs
            ? 'Passer le test Élément Humain'
            : 'Démarrer votre parcours';
    }
    if (progression.self_rating_status !== 'completed') {
        return 'Compléter votre auto-évaluation';
    }
    if (progression.peer_feedback_status !== 'completed') {
        return 'Finaliser le feedback des pairs';
    }
    if (progression.element_humain_status !== 'completed') {
        return 'Passer le test Élément Humain';
    }
    if (progression.results_status !== 'completed') {
        return 'Consulter la publication des résultats';
    }
    return 'Préparer la restitution coaching';
};

export const buildCampaignView = (session?: ParticipantSession, assignment?: ParticipantAssignment): CampaignView => {
    if (!session || !assignment) {
        return {
            name: 'Aucune campagne active',
            company: 'Organisation non renseignée',
            coach: 'Coach non attribué',
            questionnaire: 'Aucun questionnaire assigné',
            questionnaireId: null,
            status: 'À venir',
            progress: 0,
            nextAction: 'Aucune action requise pour le moment',
            hasAssignment: false,
        };
    }
    return {
        name: assignment.campaign_name ?? 'Campagne sans nom',
        company: assignment.company_name ?? 'Organisation non renseignée',
        coach: assignment.coach_name ?? 'Coach non attribué',
        questionnaire: assignment.questionnaire_title ?? assignment.questionnaire_id,
        questionnaireId: assignment.questionnaire_id,
        status: assignment.campaign_status ? statusLabels[assignment.campaign_status] : 'Sans statut',
        progress: buildProgress(assignment),
        nextAction: buildNextAction(assignment),
        hasAssignment: true,
    };
};

export const buildJourney = (assignment?: ParticipantAssignment): JourneyStep[] => {
    const qCode = assignment?.questionnaire_id?.toUpperCase() ?? '';
    const testRoute = qCode ? `/test/${qCode}` : undefined;

    const campaignId = assignment?.campaign_id ?? null;
    const resultsTo = campaignId !== null ? `/campaigns/${String(campaignId)}/results` : '/campaigns';
    const coachTo = campaignId !== null ? `/campaigns/${String(campaignId)}/coach` : '/campaigns';
    if (!assignment?.progression) {
        const manualInputState: StepState = assignment ? 'current' : 'locked';
        return [
            { ...journeyTemplate[0], state: manualInputState, to: '/self-rating' },
            { ...journeyTemplate[1], state: manualInputState, to: '/peer-feedback' },
            {
                ...journeyTemplate[2],
                state: assignment?.allow_test_without_manual_inputs ? 'current' : 'locked',
                to: testRoute,
            },
            { ...journeyTemplate[3], state: 'locked', to: resultsTo },
            { ...journeyTemplate[4], state: 'locked', to: coachTo },
        ];
    }
    return [
        {
            ...journeyTemplate[0],
            state: stepStateFromStatus(assignment.progression.self_rating_status),
            to: '/self-rating',
        },
        {
            ...journeyTemplate[1],
            state: stepStateFromStatus(assignment.progression.peer_feedback_status),
            to: '/peer-feedback',
        },
        {
            ...journeyTemplate[2],
            state: stepStateFromStatus(assignment.progression.element_humain_status),
            to: testRoute,
        },
        {
            ...journeyTemplate[3],
            state: stepStateFromStatus(assignment.progression.results_status),
            to: resultsTo,
        },
        {
            ...journeyTemplate[4],
            state: assignment.progression.results_status === 'completed' ? 'current' : 'locked',
            to: coachTo,
        },
    ];
};

/**
 * Estimation grossière du temps restant pour finir le parcours, basée sur des constantes de
 * référence (mesurées sur les premiers utilisateurs, à recalibrer avec les données prod) :
 * auto-évaluation ~10 min, feedback pairs ~10 min, test Élément Humain ~15 min.
 * La consultation des résultats et la restitution coaching ne sont pas comptées (lecture libre,
 * dépend du coach).
 */
const STEP_EFFORT_MINUTES = {
    self_rating: 10,
    peer_feedback: 10,
    element_humain: 15,
} as const;

export type EffortEstimate = {
    remainingMinutes: number;
    remainingSteps: number;
    isComplete: boolean;
};

export const buildEffortEstimate = (assignment?: ParticipantAssignment): EffortEstimate => {
    const progression = assignment?.progression;
    if (!assignment || !progression) {
        const total =
            STEP_EFFORT_MINUTES.self_rating + STEP_EFFORT_MINUTES.peer_feedback + STEP_EFFORT_MINUTES.element_humain;
        return { remainingMinutes: total, remainingSteps: 3, isComplete: false };
    }
    let minutes = 0;
    let steps = 0;
    if (progression.self_rating_status !== 'completed') {
        minutes += STEP_EFFORT_MINUTES.self_rating;
        steps += 1;
    }
    if (progression.peer_feedback_status !== 'completed') {
        minutes += STEP_EFFORT_MINUTES.peer_feedback;
        steps += 1;
    }
    if (progression.element_humain_status !== 'completed') {
        minutes += STEP_EFFORT_MINUTES.element_humain;
        steps += 1;
    }
    return {
        remainingMinutes: minutes,
        remainingSteps: steps,
        isComplete: steps === 0,
    };
};

export const buildMetrics = (campaignView: CampaignView, assignment?: ParticipantAssignment): Metric[] => [
    { ...metricsTemplate[0], value: `${campaignView.progress}%`, helper: 'parcours complété' },
    {
        ...metricsTemplate[1],
        value: assignment?.progression?.self_rating_status === 'completed' ? 'Terminé' : 'À faire',
        helper: 'première étape du parcours',
    },
    {
        ...metricsTemplate[2],
        value: assignment?.progression?.peer_feedback_status === 'completed' ? 'Terminé' : 'En attente',
        helper: 'retours liés à la campagne',
    },
    { ...metricsTemplate[3], value: campaignView.questionnaire, helper: 'lié à la campagne' },
];
