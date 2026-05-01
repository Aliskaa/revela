import { SectionTitle } from '@/components/common/SectionTitle';
import { StatCard } from '@/components/common/cards';
import { useConfirmCampaignParticipation, useParticipantSession } from '@/hooks/participantSession';
import { useCampaignStore } from '@/stores/campaignStore';
import type { ParticipantSession } from '@aor/types';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    InputAdornment,
    LinearProgress,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
    ArrowRight,
    BadgeCheck,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Gauge,
    Layers3,
    Lock,
    Search,
    Sparkles,
    Users,
} from 'lucide-react';
import * as React from 'react';

export const Route = createFileRoute('/_participant/campaigns/')({
    component: ParticipantCampaignsRoute,
});

type CampaignStatus = 'active' | 'draft' | 'closed' | 'archived';
type ParticipantAssignment = ParticipantSession['assignments'][number];

type Campaign = {
    id: string;
    campaignId: number | null;
    questionnaireId: string;
    name: string;
    company: string;
    coach: string;
    questionnaire: string;
    status: CampaignStatus;
    progress: number;
    participants: string;
    lastUpdate: string;
    nextAction: string;
    invitationConfirmed: boolean;
};

const completedValue = (status?: 'locked' | 'pending' | 'completed') => (status === 'completed' ? 1 : 0);

const progressFromAssignment = (assignment: ParticipantAssignment): number => {
    const progression = assignment.progression;
    if (!progression) {
        return 0;
    }
    const completed =
        completedValue(progression.self_rating_status) +
        completedValue(progression.peer_feedback_status) +
        completedValue(progression.element_humain_status);
    return Math.round((completed / 3) * 100);
};

const nextActionFromAssignment = (assignment: ParticipantAssignment): string => {
    if (!assignment.invitation_confirmed) {
        return 'Confirmer votre participation';
    }
    const progression = assignment.progression;
    if (!progression) {
        return assignment.allow_test_without_manual_inputs ? 'Passer le test Element Humain' : 'Demarrer le parcours';
    }
    if (progression.self_rating_status !== 'completed') {
        return "Completer l'auto-evaluation";
    }
    if (progression.peer_feedback_status !== 'completed') {
        return 'Finaliser le feedback des pairs';
    }
    if (progression.element_humain_status !== 'completed') {
        return 'Passer le test Element Humain';
    }
    if (progression.feedback_coach == null) {
        return 'Consulter les resultats';
    }
    return 'Consulter les retours du coach';
};

const campaignFromAssignment = (assignment: ParticipantAssignment): Campaign => ({
    id: `${assignment.campaign_id ?? 'none'}-${assignment.questionnaire_id}`,
    campaignId: assignment.campaign_id,
    questionnaireId: assignment.questionnaire_id,
    name: assignment.campaign_name ?? 'Campagne sans nom',
    company: assignment.company_name ?? 'Organisation non renseignee',
    coach: assignment.coach_name ?? 'Coach non attribue',
    questionnaire: assignment.questionnaire_title ?? assignment.questionnaire_id,
    status: assignment.campaign_status ?? 'draft',
    progress: progressFromAssignment(assignment),
    participants: assignment.invitation_confirmed ? 'Participation confirmee' : 'Participation a confirmer',
    lastUpdate: 'Suivi actualise avec votre session',
    nextAction: nextActionFromAssignment(assignment),
    invitationConfirmed: assignment.invitation_confirmed,
});

const statsFromAssignments = (assignments: ParticipantAssignment[]) => [
    { label: 'Campagnes rattachees', value: String(assignments.length), icon: Layers3 },
    {
        label: 'Campagnes actives',
        value: String(assignments.filter(a => a.campaign_status === 'active').length),
        icon: Gauge,
    },
    {
        label: 'Questionnaires completes',
        value: String(assignments.filter(a => a.progression?.element_humain_status === 'completed').length),
        icon: CheckCircle2,
    },
    {
        label: 'Feedbacks recus',
        value: String(assignments.filter(a => a.progression?.peer_feedback_status === 'completed').length),
        icon: Users,
    },
];

function statusChip(status: CampaignStatus) {
    if (status === 'active') {
        return (
            <Chip
                label="En cours"
                size="small"
                sx={{ borderRadius: 99, bgcolor: 'tint.successBg', color: 'tint.successText' }}
            />
        );
    }

    if (status === 'closed') {
        return (
            <Chip
                label="Terminée"
                size="small"
                sx={{ borderRadius: 99, bgcolor: 'tint.mutedBg', color: 'tint.mutedText' }}
            />
        );
    }

    return (
        <Chip
            label="Brouillon"
            size="small"
            sx={{ borderRadius: 99, bgcolor: 'tint.secondaryBg', color: 'tint.secondaryText' }}
        />
    );
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
    const selectCampaign = useCampaignStore(s => s.select);
    const navigate = useNavigate();
    const confirmParticipation = useConfirmCampaignParticipation();
    const isActive = campaign.status === 'active';
    const needsConfirmation = isActive && !campaign.invitationConfirmed;
    const canStartJourney = isActive && campaign.invitationConfirmed;

    const goToWorkspace = () => {
        if (campaign.campaignId == null) return;
        selectCampaign(campaign.campaignId);
        navigate({
            to: '/campaigns/$campaignId',
            params: { campaignId: String(campaign.campaignId) },
        });
    };

    const goToResults = () => {
        if (campaign.campaignId == null) return;
        selectCampaign(campaign.campaignId);
        navigate({
            to: '/campaigns/$campaignId/results',
            params: { campaignId: String(campaign.campaignId) },
        });
    };

    const handleConfirm = () => {
        if (campaign.campaignId == null) {
            return;
        }
        confirmParticipation.mutate(campaign.campaignId);
    };

    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={2}>
                        <Box sx={{ minWidth: 0 }}>
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                <Typography
                                    variant="h6"
                                    fontWeight={800}
                                    color="text.primary"
                                    sx={{ letterSpacing: -0.3 }}
                                >
                                    {campaign.name}
                                </Typography>
                                {statusChip(campaign.status)}
                            </Stack>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.8, lineHeight: 1.7 }}>
                                {campaign.company} · Coach {campaign.coach}
                            </Typography>
                        </Box>

                        <Box
                            sx={{
                                width: 44,
                                height: 44,
                                borderRadius: 3,
                                bgcolor: isActive ? 'tint.primaryBg' : 'tint.primaryHover',
                                color: isActive ? 'primary.main' : 'tint.mutedText',
                                display: 'grid',
                                placeItems: 'center',
                                flex: 'none',
                            }}
                        >
                            <Sparkles size={18} />
                        </Box>
                    </Stack>

                    <Divider />

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.2fr 0.8fr' }, gap: 2 }}>
                        <Stack spacing={1.25}>
                            <Row icon={ClipboardList} label="Questionnaire" value={campaign.questionnaire} />
                            <Row icon={Users} label="Participants" value={campaign.participants} />
                            <Row icon={CalendarDays} label="Dernière mise à jour" value={campaign.lastUpdate} />
                        </Stack>

                        <Card variant="outlined" sx={{ bgcolor: 'rgba(15,23,42,0.03)', p: 2 }}>
                            <Typography variant="caption" color="text.secondary">
                                Progression
                            </Typography>
                            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ mt: 0.3 }}>
                                {campaign.progress}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
                                {campaign.nextAction}
                            </Typography>
                        </Card>
                    </Box>

                    {needsConfirmation && (
                        <Alert severity="info" sx={{ borderRadius: 3 }}>
                            Vous devez confirmer votre participation avant de pouvoir démarrer le parcours.
                        </Alert>
                    )}

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
                        {needsConfirmation && (
                            <Button
                                variant="contained"
                                disableElevation
                                onClick={handleConfirm}
                                disabled={confirmParticipation.isPending || campaign.campaignId == null}
                                sx={{ borderRadius: 3, bgcolor: 'primary.main' }}
                                startIcon={<BadgeCheck size={16} />}
                            >
                                {confirmParticipation.isPending ? 'Confirmation…' : 'Confirmer ma participation'}
                            </Button>
                        )}
                        {canStartJourney && (
                            <Button
                                variant="contained"
                                disableElevation
                                onClick={goToWorkspace}
                                sx={{ borderRadius: 3, bgcolor: 'primary.main' }}
                                endIcon={<ArrowRight size={16} />}
                            >
                                {campaign.progress === 100
                                    ? 'Voir mes résultats'
                                    : campaign.progress > 0
                                      ? 'Continuer le parcours'
                                      : 'Commencer le parcours'}
                            </Button>
                        )}
                        {campaign.status === 'closed' && (
                            <Button
                                variant="contained"
                                disableElevation
                                onClick={goToResults}
                                sx={{ borderRadius: 3, bgcolor: 'primary.main' }}
                                endIcon={<ArrowRight size={16} />}
                            >
                                Voir les résultats
                            </Button>
                        )}
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
}

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return (
        <Stack direction="row" spacing={1.3} alignItems="start">
            <Box
                sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 3,
                    bgcolor: 'tint.primaryBg',
                    color: 'primary.main',
                    display: 'grid',
                    placeItems: 'center',
                    flex: 'none',
                }}
            >
                <Icon size={16} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">
                    {label}
                </Typography>
                <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mt: 0.25, lineHeight: 1.6 }}>
                    {value}
                </Typography>
            </Box>
        </Stack>
    );
}

function EmptyCampaignsState() {
    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 3 }}>
                <Stack spacing={2} alignItems="start">
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 3,
                            bgcolor: 'tint.secondaryBg',
                            color: 'tint.secondaryText',
                            display: 'grid',
                            placeItems: 'center',
                        }}
                    >
                        <Lock size={18} />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight={800} color="text.primary">
                            Aucune campagne disponible pour le moment
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6, lineHeight: 1.7 }}>
                            Les campagnes apparaissent ici dès qu’elles sont créées et que ton accès est rattaché par
                            l’administrateur.
                        </Typography>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}

function ParticipantCampaignsRoute() {
    const { data: session, isLoading, isError } = useParticipantSession();
    const [query, setQuery] = React.useState('');
    const assignments = session?.assignments ?? [];
    const sourceCampaigns = assignments.map(campaignFromAssignment);
    const normalizedQuery = query.trim().toLowerCase();
    const visibleCampaigns = sourceCampaigns.filter(campaign => {
        if (!normalizedQuery) {
            return true;
        }
        return [campaign.name, campaign.company, campaign.coach, campaign.questionnaire]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery);
    });
    const statsView = statsFromAssignments(assignments);
    if (isLoading) {
        return (
            <Card variant="outlined">
                <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={800} color="text.primary">
                        Chargement de vos campagnes
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                        Recuperation des campagnes rattachees a votre espace participant.
                    </Typography>
                    <LinearProgress />
                </CardContent>
            </Card>
        );
    }

    if (isError || !session) {
        return <Alert severity="error">Impossible de charger vos campagnes pour le moment.</Alert>;
    }

    return (
        <Stack spacing={3}>
            <Card variant="outlined">
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Stack spacing={2.5}>
                        <SectionTitle
                            title="Mes campagnes"
                            subtitle="Toutes les campagnes auxquelles le participant est rattaché. Une campagne correspond à un questionnaire unique."
                        />

                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Rechercher une campagne, un coach, une organisation…"
                            value={query}
                            onChange={event => setQuery(event.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search size={16} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ maxWidth: 520 }}
                        />

                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' },
                                gap: 2,
                            }}
                        >
                            {statsView.map(stat => (
                                <StatCard key={stat.label} {...stat} />
                            ))}
                        </Box>
                    </Stack>
                </CardContent>
            </Card>

            {visibleCampaigns.length > 0 ? (
                visibleCampaigns.map(campaign => <CampaignCard key={campaign.id} campaign={campaign} />)
            ) : (
                <EmptyCampaignsState />
            )}
        </Stack>
    );
}
