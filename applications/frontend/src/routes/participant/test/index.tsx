import { Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { Link, createFileRoute } from '@tanstack/react-router';
import { ArrowRight, Brain, CheckCircle2, CircleDot, ClipboardList, Hash, Heart, Sparkles, Users } from 'lucide-react';
import type * as React from 'react';

export const Route = createFileRoute('/participant/test/')({
    component: ParticipantTestIndexRoute,
});

type QuestionnaireCode = 'B' | 'F' | 'S';

type QuestionnaireMeta = {
    code: QuestionnaireCode;
    title: string;
    subtitle: string;
    icon: React.ElementType;
    dimensions: string[];
    seriesLabels: [string, string];
    questionCountPerSeries: number;
};

const questionnaires: Record<QuestionnaireCode, QuestionnaireMeta> = {
    B: {
        code: 'B',
        title: 'Questionnaire B — Comportement',
        subtitle: '2 séries de 54 questions pour mesurer les comportements interpersonnels.',
        icon: Users,
        dimensions: ['Inclusion', 'Contrôle', 'Affection'],
        seriesLabels: ['Mon comportement actuel', 'Mon comportement souhaité'],
        questionCountPerSeries: 54,
    },
    F: {
        code: 'F',
        title: 'Questionnaire F — Ressentis',
        subtitle: '2 séries de 54 questions pour mesurer les ressentis interpersonnels.',
        icon: Heart,
        dimensions: ['Importance', 'Compétence', 'Affection'],
        seriesLabels: ['Mes ressentis actuels', 'Mes ressentis désirés'],
        questionCountPerSeries: 54,
    },
    S: {
        code: 'S',
        title: 'Questionnaire S — Soi',
        subtitle: '2 séries de 54 questions pour mesurer la perception de soi.',
        icon: Sparkles,
        dimensions: ['Vitalité', 'Libre arbitre', 'Conscience', 'Importance', 'Compétence', 'Amour de soi'],
        seriesLabels: ['Ma perception actuelle de moi', 'Ma perception idéale de moi'],
        questionCountPerSeries: 54,
    },
};

// À remplacer par la donnée de campagne venant du loader / API.
const campaignQuestionnaireCode: QuestionnaireCode = 'B';
const questionnaire = questionnaires[campaignQuestionnaireCode];

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <Box>
            <Typography variant="h5" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.4 }}>
                {title}
            </Typography>
            {subtitle ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.7, lineHeight: 1.7 }}>
                    {subtitle}
                </Typography>
            ) : null}
        </Box>
    );
}

function InfoPill({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return (
        <Box sx={{ border: '1px solid rgba(15,23,42,0.10)', borderRadius: 4, p: 1.8 }}>
            <Stack direction="row" spacing={1.2} alignItems="start">
                <Box
                    sx={{
                        width: 38,
                        height: 38,
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
                <Box>
                    <Typography variant="caption" color="text.secondary">
                        {label}
                    </Typography>
                    <Typography
                        variant="body2"
                        fontWeight={700}
                        color="text.primary"
                        sx={{ mt: 0.25, lineHeight: 1.6 }}
                    >
                        {value}
                    </Typography>
                </Box>
            </Stack>
        </Box>
    );
}

function TestChecklist() {
    return (
        <Card
            variant="outlined"
            sx={{ borderRadius: 6, borderColor: 'border', boxShadow: '0 6px 18px rgba(15,23,42,0.04)' }}
        >
            <CardContent sx={{ p: 2.5 }}>
                <SectionTitle title="Avant de commencer" subtitle="Quelques rappels utiles pour un parcours fluide." />
                <Stack spacing={1.4} sx={{ mt: 2 }}>
                    <ChecklistItem text="Répondre sérieusement et sans aller trop vite." />
                    <ChecklistItem text="Le test suit le questionnaire assigné par la campagne." />
                    <ChecklistItem text="Le parcours contient deux séries de 54 questions." />
                    <ChecklistItem text="La restitution viendra après la consolidation des résultats." />
                </Stack>
            </CardContent>
        </Card>
    );
}

function ChecklistItem({ text }: { text: string }) {
    return (
        <Stack direction="row" spacing={1.2} alignItems="start">
            <Box
                sx={{
                    width: 34,
                    height: 34,
                    borderRadius: 3,
                    bgcolor: 'tint.primaryBg',
                    color: 'primary.main',
                    display: 'grid',
                    placeItems: 'center',
                    flex: 'none',
                }}
            >
                <CheckCircle2 size={15} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, pt: 0.2 }}>
                {text}
            </Typography>
        </Stack>
    );
}

function QuestionnairePreview() {
    const Icon = questionnaire.icon;

    return (
        <Card
            variant="outlined"
            sx={{ borderRadius: 6, borderColor: 'border', boxShadow: '0 6px 18px rgba(15,23,42,0.04)' }}
        >
            <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={2}>
                        <Box>
                            <Typography variant="h6" fontWeight={800} color="text.primary">
                                {questionnaire.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.7 }}>
                                {questionnaire.subtitle}
                            </Typography>
                        </Box>
                        <Box
                            sx={{
                                width: 42,
                                height: 42,
                                borderRadius: 3,
                                bgcolor: 'rgba(15,24,152,0.10)',
                                color: 'primary.main',
                                display: 'grid',
                                placeItems: 'center',
                            }}
                        >
                            <Icon size={18} />
                        </Box>
                    </Stack>

                    <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                        {questionnaire.dimensions.map(dimension => (
                            <Chip
                                key={dimension}
                                label={dimension}
                                size="small"
                                sx={{ borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main' }}
                            />
                        ))}
                    </Stack>

                    <Box sx={{ borderRadius: 4, bgcolor: 'rgba(15,23,42,0.03)', p: 1.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                            {questionnaire.seriesLabels[0]} / {questionnaire.seriesLabels[1]} —{' '}
                            {questionnaire.questionCountPerSeries} questions par série
                        </Typography>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
}

function ParticipantTestIndexRoute() {
    return (
        <Stack spacing={3}>
            <Card
                variant="outlined"
                sx={{ borderRadius: 6, borderColor: 'border', boxShadow: '0 6px 18px rgba(15,23,42,0.04)' }}
            >
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Stack
                        spacing={2.5}
                        direction={{ xs: 'column', lg: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'start', lg: 'start' }}
                    >
                        <Box>
                            <Chip
                                label="Test Élément Humain"
                                sx={{ borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main', mb: 1.5 }}
                            />
                            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                                Questionnaire de la campagne
                            </Typography>
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}
                            >
                                Le participant passe uniquement le questionnaire assigné par sa campagne. Le choix n’est
                                pas disponible ici.
                            </Typography>
                        </Box>

                        <Card
                            variant="outlined"
                            sx={{ borderRadius: 4, borderColor: 'border', width: { xs: '100%', sm: 340 } }}
                        >
                            <CardContent sx={{ p: 2 }}>
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Box
                                        sx={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 4,
                                            bgcolor: 'primary.main',
                                            color: '#fff',
                                            display: 'grid',
                                            placeItems: 'center',
                                        }}
                                    >
                                        <Brain size={20} />
                                    </Box>
                                    <Box>
                                        <Typography fontWeight={800} color="text.primary">
                                            {questionnaire.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Assigné par la campagne
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Stack>
                </CardContent>
            </Card>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 2 }}>
                <InfoPill icon={ClipboardList} label="Questionnaire actif" value={campaignQuestionnaireCode} />
                <InfoPill icon={CircleDot} label="Séries" value="2" />
                <InfoPill icon={Hash} label="Questions" value="54 / série" />
                <InfoPill icon={Sparkles} label="Étape" value="Test" />
            </Box>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', xl: '1.2fr 0.8fr' },
                    gap: 3,
                    alignItems: 'start',
                }}
            >
                <Stack spacing={2.5}>
                    <Card
                        variant="outlined"
                        sx={{ borderRadius: 6, borderColor: 'border', boxShadow: '0 6px 18px rgba(15,23,42,0.04)' }}
                    >
                        <CardContent sx={{ p: 2.5 }}>
                            <SectionTitle
                                title="Questionnaire de la campagne"
                                subtitle="Le questionnaire actif dépend de l’invitation reçue."
                            />
                            <Stack spacing={2} sx={{ mt: 2 }}>
                                <QuestionnairePreview />
                            </Stack>
                        </CardContent>
                    </Card>

                    <Card
                        variant="outlined"
                        sx={{ borderRadius: 6, borderColor: 'border', boxShadow: '0 6px 18px rgba(15,23,42,0.04)' }}
                    >
                        <CardContent sx={{ p: 2.5 }}>
                            <SectionTitle title="Ce que le test implique" subtitle="Le parcours est séquentiel." />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.8 }}>
                                Chaque questionnaire B, F ou S contient deux séries de 54 questions. L’utilisateur ne
                                choisit pas ici le questionnaire : il est imposé par la campagne et son invitation.
                            </Typography>
                        </CardContent>
                    </Card>
                </Stack>

                <Stack spacing={2.5}>
                    <TestChecklist />

                    <Card
                        variant="outlined"
                        sx={{ borderRadius: 6, borderColor: 'border', boxShadow: '0 6px 18px rgba(15,23,42,0.04)' }}
                    >
                        <CardContent sx={{ p: 2.5 }}>
                            <SectionTitle title="Actions" subtitle="Passer au questionnaire ou revenir au parcours." />
                            <Stack spacing={1.2} sx={{ mt: 2 }}>
                                <Link
                                    to="/participant/test/$questionnaireCode"
                                    params={{ questionnaireCode: campaignQuestionnaireCode }}
                                    style={{ textDecoration: 'none' }}
                                >
                                    <Button
                                        variant="contained"
                                        disableElevation
                                        startIcon={<ArrowRight size={16} />}
                                        sx={{ borderRadius: 3, bgcolor: 'primary.main', textTransform: 'none' }}
                                    >
                                        Commencer le test
                                    </Button>
                                </Link>
                                <Button variant="outlined" sx={{ borderRadius: 3, textTransform: 'none' }}>
                                    Retour au parcours
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>

                    <Card
                        variant="outlined"
                        sx={{ borderRadius: 6, borderColor: 'border', boxShadow: '0 6px 18px rgba(15,23,42,0.04)' }}
                    >
                        <CardContent sx={{ p: 2.5 }}>
                            <SectionTitle
                                title="Rappel métier"
                                subtitle="La page est un point d’entrée, pas le questionnaire complet."
                            />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.8 }}>
                                L’auto-évaluation et les pairs utilisent les short labels notés de 1 à 9. Ici, on
                                bascule sur le test Élément Humain assigné par la campagne, sans option de sélection
                                manuelle.
                            </Typography>
                        </CardContent>
                    </Card>
                </Stack>
            </Box>
        </Stack>
    );
}
