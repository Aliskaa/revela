// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { MiniStat } from '@/components/common/MiniStat';
import { SectionTitle } from '@/components/common/SectionTitle';
import { StatCard } from '@/components/common/StatCard';
import { useParticipant, useUpdateParticipant } from '@/hooks/admin';
import type { ParticipantCampaignAssignment, ParticipantFunctionLevel, UpdateParticipantProfileBody } from '@aor/types';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { Link, useRouter } from '@tanstack/react-router';
import {
    ArrowLeft,
    Building2,
    ClipboardList,
    LayoutPanelLeft,
    Mail,
    MessageSquareText,
    PencilLine,
    Save,
    X,
} from 'lucide-react';
import * as React from 'react';

const FUNCTION_LEVEL_LABELS: Record<ParticipantFunctionLevel, string> = {
    direction: 'Direction',
    middle_management: 'Management intermédiaire',
    frontline_manager: 'Manager de proximité',
};

function functionLevelLabel(level: ParticipantFunctionLevel | null): string {
    return level ? FUNCTION_LEVEL_LABELS[level] : 'Non renseigné';
}

function StatusChip({ status }: { status: string }) {
    const palette: Record<string, { bg: string; color: string; label: string }> = {
        draft: { bg: 'rgba(148,163,184,0.16)', color: 'rgb(100,116,139)', label: 'Brouillon' },
        active: { bg: 'rgba(16,185,129,0.12)', color: 'rgb(4,120,87)', label: 'Active' },
        archived: { bg: 'rgba(148,163,184,0.16)', color: 'rgb(100,116,139)', label: 'Archivée' },
    };
    const p = palette[status] ?? { bg: 'rgba(148,163,184,0.16)', color: 'rgb(100,116,139)', label: status };
    return (
        <Chip label={p.label} size="small" sx={{ borderRadius: 99, bgcolor: p.bg, color: p.color, fontWeight: 600 }} />
    );
}

export type ParticipantDetailViewProps = {
    participantId: number;
    /** Préfixe d'URL — `/admin` ou `/coach`. Utilisé pour les liens internes. */
    scopePrefix: '/admin' | '/coach';
};

export function ParticipantDetailView({ participantId, scopePrefix }: ParticipantDetailViewProps) {
    const router = useRouter();
    const { data, isLoading, isError } = useParticipant(participantId);
    const updateParticipant = useUpdateParticipant();

    const [editing, setEditing] = React.useState(false);
    const [organisation, setOrganisation] = React.useState('');
    const [direction, setDirection] = React.useState('');
    const [service, setService] = React.useState('');
    const [functionLevel, setFunctionLevel] = React.useState<ParticipantFunctionLevel | ''>('');

    const participant = data?.participant;
    const campaigns: ParticipantCampaignAssignment[] = data?.campaigns ?? [];

    React.useEffect(() => {
        if (participant) {
            setOrganisation(participant.organisation ?? '');
            setDirection(participant.direction ?? '');
            setService(participant.service ?? '');
            setFunctionLevel(participant.function_level ?? '');
        }
    }, [participant]);

    const handleStartEdit = () => setEditing(true);
    const handleCancelEdit = () => {
        if (participant) {
            setOrganisation(participant.organisation ?? '');
            setDirection(participant.direction ?? '');
            setService(participant.service ?? '');
            setFunctionLevel(participant.function_level ?? '');
        }
        setEditing(false);
    };

    const handleSave = async () => {
        const body: UpdateParticipantProfileBody = {
            organisation: organisation.trim() === '' ? null : organisation.trim(),
            direction: direction.trim() === '' ? null : direction.trim(),
            service: service.trim() === '' ? null : service.trim(),
            function_level: functionLevel === '' ? null : functionLevel,
        };
        await updateParticipant.mutateAsync({ participantId, body });
        setEditing(false);
    };

    if (isLoading) {
        return (
            <Stack spacing={3}>
                <Skeleton variant="rounded" height={140} />
                <Skeleton variant="rounded" height={100} />
                <Skeleton variant="rounded" height={300} />
            </Stack>
        );
    }

    if (isError || !participant) {
        return (
            <Card variant="outlined">
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">
                        Participant introuvable ou hors de votre périmètre.
                    </Typography>
                    <Button
                        onClick={() => router.history.back()}
                        variant="outlined"
                        sx={{ mt: 2, borderRadius: 3 }}
                        startIcon={<ArrowLeft size={16} />}
                    >
                        Retour
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const inviteCount = Object.keys(participant.invite_status).length;

    return (
        <Stack spacing={3}>
            <Button
                onClick={() => router.history.back()}
                startIcon={<ArrowLeft size={18} />}
                sx={{
                    alignSelf: 'flex-start',
                    fontWeight: 600,
                    color: 'text.secondary',
                    '&:hover': { bgcolor: 'transparent', color: 'primary.main' },
                }}
                disableRipple
            >
                Retour
            </Button>

            <Card variant="outlined">
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Stack
                        spacing={2.5}
                        direction={{ xs: 'column', lg: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'start', lg: 'start' }}
                    >
                        <Box>
                            <Chip
                                label="Détail participant"
                                sx={{ borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main', mb: 1.5 }}
                            />
                            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                                {participant.full_name}
                            </Typography>
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}
                            >
                                {participant.email}
                                {participant.company ? ` — ${participant.company.name}` : ''}
                            </Typography>
                        </Box>
                    </Stack>
                </CardContent>
            </Card>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
                <StatCard
                    label="Réponses"
                    value={participant.response_count}
                    helper="collectées"
                    icon={MessageSquareText}
                />
                <StatCard label="Invitations" value={inviteCount} helper="par questionnaire" icon={Mail} />
                <StatCard label="Campagnes" value={campaigns.length} helper="rattachées" icon={ClipboardList} />
            </Box>

            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', xl: '0.8fr 1.2fr' },
                    gap: 3,
                    alignItems: 'start',
                }}
            >
                <Card variant="outlined">
                    <CardContent sx={{ p: 2.5 }}>
                        <SectionTitle
                            title="Informations"
                            subtitle={
                                editing
                                    ? 'Modifiez les champs de profil. Identité et entreprise ne sont pas modifiables ici.'
                                    : 'Profil organisationnel du participant.'
                            }
                            action={
                                editing ? null : (
                                    <Button
                                        onClick={handleStartEdit}
                                        size="small"
                                        startIcon={<PencilLine size={14} />}
                                        sx={{ borderRadius: 99 }}
                                    >
                                        Modifier
                                    </Button>
                                )
                            }
                        />

                        {editing ? (
                            <Stack spacing={2} sx={{ mt: 2 }}>
                                <Stack spacing={1.2}>
                                    <MiniStat label="Prénom" value={participant.first_name} />
                                    <MiniStat label="Nom" value={participant.last_name} />
                                    <MiniStat label="Email" value={participant.email} />
                                    <MiniStat
                                        label="Entreprise"
                                        value={participant.company?.name ?? 'Non renseignée'}
                                    />
                                </Stack>

                                <TextField
                                    label="Organisation"
                                    value={organisation}
                                    onChange={e => setOrganisation(e.target.value)}
                                    fullWidth
                                    size="small"
                                    placeholder="Ex : Ville de Lyon"
                                />
                                <TextField
                                    label="Entité (Direction)"
                                    value={direction}
                                    onChange={e => setDirection(e.target.value)}
                                    fullWidth
                                    size="small"
                                    placeholder="Ex : Direction Sports & Jeunesse"
                                />
                                <TextField
                                    label="Service"
                                    value={service}
                                    onChange={e => setService(e.target.value)}
                                    fullWidth
                                    size="small"
                                    placeholder="Ex : Développement des équipes"
                                />
                                <FormControl fullWidth size="small">
                                    <InputLabel>Niveau de fonction</InputLabel>
                                    <Select
                                        label="Niveau de fonction"
                                        value={functionLevel}
                                        onChange={e =>
                                            setFunctionLevel(e.target.value as ParticipantFunctionLevel | '')
                                        }
                                    >
                                        <MenuItem value="">Non renseigné</MenuItem>
                                        <MenuItem value="direction">Direction</MenuItem>
                                        <MenuItem value="middle_management">Management intermédiaire</MenuItem>
                                        <MenuItem value="frontline_manager">Manager de proximité</MenuItem>
                                    </Select>
                                </FormControl>

                                {updateParticipant.isError && (
                                    <Alert severity="error">{updateParticipant.error?.message}</Alert>
                                )}

                                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                    <Button
                                        variant="contained"
                                        disableElevation
                                        startIcon={<Save size={16} />}
                                        onClick={handleSave}
                                        disabled={updateParticipant.isPending}
                                        sx={{ borderRadius: 3 }}
                                    >
                                        {updateParticipant.isPending ? 'Enregistrement…' : 'Enregistrer'}
                                    </Button>
                                    <Button
                                        variant="text"
                                        startIcon={<X size={16} />}
                                        onClick={handleCancelEdit}
                                        disabled={updateParticipant.isPending}
                                        sx={{ borderRadius: 3 }}
                                    >
                                        Annuler
                                    </Button>
                                </Stack>
                            </Stack>
                        ) : (
                            <Stack spacing={1.2} sx={{ mt: 2 }}>
                                <MiniStat label="Prénom" value={participant.first_name} />
                                <MiniStat label="Nom" value={participant.last_name} />
                                <MiniStat label="Email" value={participant.email} />
                                <MiniStat label="Entreprise" value={participant.company?.name ?? 'Non renseignée'} />
                                <MiniStat label="Organisation" value={participant.organisation ?? '–'} />
                                <MiniStat label="Entité (Direction)" value={participant.direction ?? '–'} />
                                <MiniStat label="Service" value={participant.service ?? '–'} />
                                <MiniStat
                                    label="Niveau de fonction"
                                    value={functionLevelLabel(participant.function_level)}
                                />
                            </Stack>
                        )}
                    </CardContent>
                </Card>

                <Card variant="outlined">
                    <CardContent sx={{ p: 2.5 }}>
                        <SectionTitle title="Campagnes" subtitle="Campagnes auxquelles ce participant est rattaché." />

                        <Box sx={{ overflowX: 'auto' }}>
                            <Table sx={{ minWidth: 520 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Campagne</TableCell>
                                        <TableCell>Entreprise</TableCell>
                                        <TableCell>Statut</TableCell>
                                        <TableCell />
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {campaigns.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                                <Stack spacing={1} alignItems="center">
                                                    <Building2 size={28} color="rgb(148,163,184)" />
                                                    <Typography variant="body2" color="text.secondary">
                                                        Aucune campagne rattachée.
                                                    </Typography>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        campaigns.map(c => (
                                            <TableRow hover key={c.campaign_id}>
                                                <TableCell>
                                                    <Link
                                                        to={`${scopePrefix}/campaigns/${c.campaign_id}`}
                                                        style={{ color: 'inherit', textDecoration: 'none' }}
                                                    >
                                                        <Typography
                                                            fontWeight={700}
                                                            color="primary.main"
                                                            sx={{ '&:hover': { textDecoration: 'underline' } }}
                                                        >
                                                            {c.campaign_name}
                                                        </Typography>
                                                    </Link>
                                                </TableCell>
                                                <TableCell>{c.company_name ?? '–'}</TableCell>
                                                <TableCell>
                                                    <StatusChip status={c.status} />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<LayoutPanelLeft size={14} />}
                                                        href={`${scopePrefix}/participants/${participantId}/matrix?qid=B`}
                                                        sx={{ borderRadius: 99 }}
                                                    >
                                                        Matrice
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </Stack>
    );
}
