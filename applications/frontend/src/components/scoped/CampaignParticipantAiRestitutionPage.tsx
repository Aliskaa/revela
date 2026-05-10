// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    InputAdornment,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, BadgeCheck, Bot, CheckCircle, Eye, Pencil, RotateCw, Sparkles, XCircle } from 'lucide-react';
import * as React from 'react';
import ReactMarkdown from 'react-markdown';

import { LoadingCard } from '@/components/common/LoadingCard';
import { useAdminCampaign, useParticipant } from '@/hooks/admin';
import {
    type GenerateAiRestitutionBody,
    useAdminAiRestitution,
    useApproveAiRestitution,
    useEditAiRestitution,
    useGenerateAiRestitution,
    useRejectAiRestitution,
} from '@/hooks/aiRestitutions';
import type { AiRestitutionAdminView } from '@aor/types';

export type CampaignParticipantAiRestitutionScope = 'admin' | 'coach';

export type CampaignParticipantAiRestitutionPageProps = {
    scope: CampaignParticipantAiRestitutionScope;
    campaignId: number;
    participantId: number;
};

const SCOPE_CFG: Record<
    CampaignParticipantAiRestitutionScope,
    {
        backTo: '/admin/campaigns/$campaignId' | '/coach/campaigns/$campaignId';
        notFound: string;
    }
> = {
    admin: {
        backTo: '/admin/campaigns/$campaignId',
        notFound: 'Campagne introuvable.',
    },
    coach: {
        backTo: '/coach/campaigns/$campaignId',
        notFound: 'Campagne introuvable ou hors de votre périmètre.',
    },
};

const STATUS_LABEL: Record<AiRestitutionAdminView['status'], string> = {
    generated: 'Générée',
    edited: 'Éditée',
    approved: 'Approuvée',
    rejected: 'Rejetée',
};

const STATUS_COLOR: Record<AiRestitutionAdminView['status'], 'default' | 'primary' | 'info' | 'success' | 'warning'> = {
    generated: 'primary',
    edited: 'info',
    approved: 'success',
    rejected: 'warning',
};

const FAILURE_LABEL: Record<string, string> = {
    length_exceeded: 'Longueur dépassée',
    missing_section: 'Section manquante',
    forbidden_phrase: 'Formulation interdite',
    missing_hypothesis_markers: 'Pas de marqueur prudent',
    unauthorized_dimension: 'Dimension non autorisée',
    wrong_question_count: 'Nombre de questions hors plage',
};

type DimensionForm = { expressed: number; wanted: number; peer_feedback: number };

const DEFAULT_DIM: DimensionForm = { expressed: 5, wanted: 5, peer_feedback: 5 };

const DEFAULT_FORM = {
    inclusion: { ...DEFAULT_DIM },
    control: { ...DEFAULT_DIM },
    openness: { ...DEFAULT_DIM },
    transparency: 50,
};

type FormState = typeof DEFAULT_FORM;

const clampInt = (value: number, min: number, max: number): number => {
    if (Number.isNaN(value)) return min;
    return Math.max(min, Math.min(max, Math.round(value)));
};

const FiroInput = ({
    label,
    value,
    onChange,
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
}) => (
    <TextField
        label={label}
        type="number"
        size="small"
        value={value}
        onChange={e => onChange(clampInt(Number.parseInt(e.target.value, 10), 0, 9))}
        slotProps={{ htmlInput: { min: 0, max: 9 } }}
        sx={{ width: 90 }}
    />
);

const DimensionRow = ({
    title,
    value,
    onChange,
}: {
    title: string;
    value: DimensionForm;
    onChange: (v: DimensionForm) => void;
}) => (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
        <Typography variant="subtitle2" sx={{ minWidth: 200, fontWeight: 600 }}>
            {title}
        </Typography>
        <FiroInput label="Exprimé" value={value.expressed} onChange={v => onChange({ ...value, expressed: v })} />
        <FiroInput label="Désiré" value={value.wanted} onChange={v => onChange({ ...value, wanted: v })} />
        <FiroInput
            label="Feedback pairs"
            value={value.peer_feedback}
            onChange={v => onChange({ ...value, peer_feedback: v })}
        />
    </Stack>
);

const buildBody = (form: FormState): GenerateAiRestitutionBody => ({
    module: 'firo_b_short_restitution',
    language: 'fr',
    scores: {
        inclusion: form.inclusion,
        control: form.control,
        openness: form.openness,
        transparency: { score: clampInt(form.transparency, 0, 100) },
    },
});

const StatusBadge = ({ status }: { status: AiRestitutionAdminView['status'] }) => (
    <Chip
        label={STATUS_LABEL[status]}
        color={STATUS_COLOR[status]}
        size="small"
        sx={{ fontWeight: 600, borderRadius: 99 }}
    />
);

const ValidationFailures = ({
    failures,
}: {
    failures: AiRestitutionAdminView['validation_report'] extends null
        ? never
        : NonNullable<AiRestitutionAdminView['validation_report']>['failures'];
}) => {
    if (failures.length === 0) {
        return (
            <Alert severity="success" icon={<CheckCircle size={16} />}>
                Validateur §9 OK — la restitution est diffusable.
            </Alert>
        );
    }
    return (
        <Alert severity="warning" icon={<XCircle size={16} />}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                {failures.length} contrôle(s) en échec — édite ou régénère avant approbation.
            </Typography>
            <Stack spacing={0.5}>
                {failures.map((f, i) => (
                    <Typography key={`${f.code}-${i}`} variant="caption" component="div">
                        <strong>{FAILURE_LABEL[f.code] ?? f.code}</strong> — {f.detail}
                    </Typography>
                ))}
            </Stack>
        </Alert>
    );
};

const RestitutionPreview = ({ markdown }: { markdown: string }) => (
    <Box
        sx={{
            p: 3,
            bgcolor: 'grey.50',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            '& h1, & h2, & h3': { mt: 2, mb: 1 },
            '& p': { mb: 1.5 },
            '& ul, & ol': { pl: 3, mb: 1.5 },
            '& li': { mb: 0.5 },
        }}
    >
        <ReactMarkdown>{markdown}</ReactMarkdown>
    </Box>
);

const TechnicalDetails = ({ restitution }: { restitution: AiRestitutionAdminView }) => (
    <Card variant="outlined">
        <CardContent>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                Détails techniques
            </Typography>
            <Stack spacing={0.75}>
                <Typography variant="caption" component="div">
                    <strong>Modèle :</strong> {restitution.model}
                </Typography>
                <Typography variant="caption" component="div">
                    <strong>Version prompt :</strong> {restitution.prompt_version}
                </Typography>
                <Typography variant="caption" component="div">
                    <strong>Tentatives de régénération :</strong> {restitution.regen_attempts}
                </Typography>
                <Typography variant="caption" component="div">
                    <strong>Dimensions sélectionnées :</strong>{' '}
                    {restitution.selected_dimensions.length === 0
                        ? 'aucune (équilibre apparent)'
                        : restitution.selected_dimensions.map(d => `${d.name} (gap ${d.gap})`).join(', ')}
                </Typography>
                <Typography variant="caption" component="div">
                    <strong>Générée le :</strong> {new Date(restitution.generated_at).toLocaleString('fr-FR')}
                </Typography>
                {restitution.approved_at && (
                    <Typography variant="caption" component="div">
                        <strong>Approuvée le :</strong> {new Date(restitution.approved_at).toLocaleString('fr-FR')}
                    </Typography>
                )}
            </Stack>
        </CardContent>
    </Card>
);

/**
 * Vue admin/coach de la restitution IA d'un participant pour une campagne donnée.
 *
 * Quatre états principaux gérés par cette page :
 *  - aucune restitution → formulaire de saisie des 12 chiffres + bouton Générer.
 *  - generated/edited   → preview Markdown + édition + Approuver / Rejeter / Régénérer.
 *  - approved           → preview lecture seule + date d'approbation.
 *  - rejected           → bandeau d'info + bouton Régénérer.
 *
 * Sécurité : scope coach respecté côté backend (404 si campagne hors périmètre).
 *
 * Limitation V1 : le coach saisit les 12 chiffres manuellement en regardant la
 * matrice. Un pré-remplissage automatique depuis les agrégats FIRO-B viendra
 * en Lot 4b (besoin d'arbitrage Nora sur le mapping 12 paires → 3 dimensions
 * agrégées).
 */
export function CampaignParticipantAiRestitutionPage({
    scope,
    campaignId,
    participantId,
}: CampaignParticipantAiRestitutionPageProps) {
    const cfg = SCOPE_CFG[scope];

    const { data: campaignDetail, isLoading: campaignLoading } = useAdminCampaign(campaignId);
    const { data: participantDetail } = useParticipant(participantId);
    const { data: envelope, isLoading: envelopeLoading } = useAdminAiRestitution(campaignId, participantId);

    const generate = useGenerateAiRestitution();
    const edit = useEditAiRestitution();
    const approve = useApproveAiRestitution();
    const reject = useRejectAiRestitution();

    const [form, setForm] = React.useState<FormState>(DEFAULT_FORM);
    const [editing, setEditing] = React.useState(false);
    const [editedDraft, setEditedDraft] = React.useState('');

    const restitution = envelope?.restitution ?? null;

    React.useEffect(() => {
        if (restitution && !editing) {
            setEditedDraft(restitution.edited_output ?? restitution.raw_output);
        }
    }, [restitution, editing]);

    const participantName = participantDetail?.participant.full_name ?? `Participant #${participantId}`;
    const campaignName = campaignDetail?.campaign.name ?? `Campagne #${campaignId}`;

    const backButton = (
        <Link to={cfg.backTo} params={{ campaignId: String(campaignId) }}>
            <Button variant="outlined" startIcon={<ArrowLeft size={16} />}>
                Retour à la campagne
            </Button>
        </Link>
    );

    if (campaignLoading || envelopeLoading) {
        return <LoadingCard title="Chargement de la restitution IA" />;
    }

    if (!campaignDetail) {
        return (
            <Stack spacing={2}>
                <Alert severity="warning">{cfg.notFound}</Alert>
                {backButton}
            </Stack>
        );
    }

    const handleGenerate = () => generate.mutate({ campaignId, participantId, body: buildBody(form) });

    const handleSaveEdit = () => {
        edit.mutate(
            { campaignId, participantId, body: { edited_output: editedDraft } },
            { onSuccess: () => setEditing(false) }
        );
    };

    const handleApprove = () => approve.mutate({ campaignId, participantId });
    const handleReject = () => reject.mutate({ campaignId, participantId });

    const isApproved = restitution?.status === 'approved';
    const isRejected = restitution?.status === 'rejected';
    const validationOk = restitution?.validation_report?.ok ?? false;
    const currentText = restitution?.edited_output ?? restitution?.raw_output ?? '';

    return (
        <Stack spacing={3}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                <Stack spacing={0.5}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Bot size={20} />
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                            Retour IA — {participantName}
                        </Typography>
                        {restitution && <StatusBadge status={restitution.status} />}
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                        Campagne : {campaignName}
                    </Typography>
                </Stack>
                {backButton}
            </Stack>

            {!restitution && (
                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                            Saisir les scores agrégés
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Renseigne les 3 chiffres par dimension (Exprimé / Désiré / Feedback pairs, échelle 0-9) et
                            le score de transparence (0-100). Ces valeurs sont injectées telles quelles dans le harness
                            §5 du PDF Marius. <em>Pré-remplissage automatique prévu en Lot 4b.</em>
                        </Typography>
                        <Stack spacing={2.5}>
                            <DimensionRow
                                title="Inclusion"
                                value={form.inclusion}
                                onChange={v => setForm(f => ({ ...f, inclusion: v }))}
                            />
                            <DimensionRow
                                title="Contrôle"
                                value={form.control}
                                onChange={v => setForm(f => ({ ...f, control: v }))}
                            />
                            <DimensionRow
                                title="Affection / Ouverture"
                                value={form.openness}
                                onChange={v => setForm(f => ({ ...f, openness: v }))}
                            />
                            <Divider />
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Typography variant="subtitle2" sx={{ minWidth: 200, fontWeight: 600 }}>
                                    Transparence
                                </Typography>
                                <TextField
                                    label="Score"
                                    type="number"
                                    size="small"
                                    value={form.transparency}
                                    onChange={e =>
                                        setForm(f => ({
                                            ...f,
                                            transparency: clampInt(Number.parseInt(e.target.value, 10), 0, 100),
                                        }))
                                    }
                                    slotProps={{
                                        htmlInput: { min: 0, max: 100 },
                                        input: {
                                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                        },
                                    }}
                                    sx={{ width: 130 }}
                                />
                            </Stack>
                        </Stack>
                        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<Sparkles size={16} />}
                                onClick={handleGenerate}
                                disabled={generate.isPending}
                            >
                                {generate.isPending ? 'Génération en cours…' : 'Générer la restitution'}
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            )}

            {restitution && (
                <Stack spacing={3}>
                    {restitution.validation_report && !isApproved && !isRejected && (
                        <ValidationFailures failures={restitution.validation_report.failures} />
                    )}

                    {isApproved && (
                        <Alert severity="success" icon={<BadgeCheck size={18} />}>
                            Restitution approuvée le{' '}
                            {restitution.approved_at ? new Date(restitution.approved_at).toLocaleString('fr-FR') : '—'}{' '}
                            et diffusée au participant.
                        </Alert>
                    )}

                    {isRejected && (
                        <Alert severity="warning">
                            Cette restitution a été rejetée — non visible par le participant. Tu peux relancer une
                            génération avec d'autres valeurs (le formulaire de saisie réapparaîtra ci-dessous).
                        </Alert>
                    )}

                    <Card variant="outlined">
                        <CardContent>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                    Texte de la restitution
                                </Typography>
                                {!isApproved && !editing && (
                                    <Button
                                        size="small"
                                        startIcon={<Pencil size={14} />}
                                        onClick={() => setEditing(true)}
                                    >
                                        Éditer
                                    </Button>
                                )}
                                {editing && (
                                    <Stack direction="row" spacing={1}>
                                        <Button
                                            size="small"
                                            startIcon={<Eye size={14} />}
                                            onClick={() => {
                                                setEditing(false);
                                                setEditedDraft(restitution.edited_output ?? restitution.raw_output);
                                            }}
                                        >
                                            Annuler
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="contained"
                                            onClick={handleSaveEdit}
                                            disabled={edit.isPending || editedDraft.trim().length === 0}
                                        >
                                            {edit.isPending ? 'Enregistrement…' : 'Enregistrer'}
                                        </Button>
                                    </Stack>
                                )}
                            </Stack>

                            {editing ? (
                                <TextField
                                    multiline
                                    fullWidth
                                    minRows={20}
                                    maxRows={40}
                                    value={editedDraft}
                                    onChange={e => setEditedDraft(e.target.value)}
                                    sx={{ fontFamily: 'monospace' }}
                                    helperText={`${editedDraft.length} caractères. Markdown libre. Le validateur §9 sera rejoué à l'enregistrement.`}
                                />
                            ) : (
                                <RestitutionPreview markdown={currentText} />
                            )}
                        </CardContent>
                    </Card>

                    {!isApproved && !editing && (
                        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                            <Tooltip
                                title={
                                    validationOk
                                        ? 'Approuver et diffuser au participant.'
                                        : 'Bloqué tant que le validateur §9 ne passe pas — édite ou régénère.'
                                }
                            >
                                <span>
                                    <Button
                                        variant="contained"
                                        color="success"
                                        startIcon={<BadgeCheck size={16} />}
                                        onClick={handleApprove}
                                        disabled={!validationOk || approve.isPending}
                                    >
                                        {approve.isPending ? 'Approbation…' : 'Approuver et diffuser'}
                                    </Button>
                                </span>
                            </Tooltip>
                            <Button
                                variant="outlined"
                                color="warning"
                                startIcon={<XCircle size={16} />}
                                onClick={handleReject}
                                disabled={reject.isPending}
                            >
                                {reject.isPending ? 'Rejet…' : 'Rejeter'}
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<RotateCw size={16} />}
                                onClick={handleGenerate}
                                disabled={generate.isPending}
                            >
                                {generate.isPending ? 'Régénération…' : 'Régénérer'}
                            </Button>
                        </Stack>
                    )}

                    <TechnicalDetails restitution={restitution} />
                </Stack>
            )}
        </Stack>
    );
}
