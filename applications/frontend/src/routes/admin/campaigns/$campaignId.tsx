import type { AdminCampaignDetail, AdminResponse } from '@/api/types';
import { DataTable } from '@/components/common/DataTable';
import {
    useAdminCampaign,
    useArchiveAdminCampaign,
    useCoaches,
    useImportParticipantsToCampaign,
    useInviteCampaignParticipants,
    useReassignCampaignCoach,
    useUpdateAdminCampaignStatus,
} from '@/hooks/admin';
import { parseAdminJwtClaims } from '@/lib/auth';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    FormControl,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TableCell,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { Archive, Calendar, Eye, FileSpreadsheet, Mail, Save, Search, Upload, UserRoundCog } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export const Route = createFileRoute('/admin/campaigns/$campaignId')({
    component: AdminCampaignDetailPage,
});

type CampaignParticipantProgressRow = AdminCampaignDetail['participant_progress'][number];

const readApiError = (err: unknown): string => {
    if (typeof err === 'object' && err !== null && 'response' in err) {
        const data = (err as { response?: { data?: { error?: string } } }).response?.data;
        if (data?.error) {
            return data.error;
        }
    }
    return err instanceof Error ? err.message : 'Erreur inconnue.';
};

const getProgressChipColor = (status: string): 'default' | 'success' | 'warning' => {
    const s = status.toLowerCase();
    if (s.includes('completed') || s.includes('terminé')) {
        return 'success';
    }
    if (s.includes('pending') || s.includes('en cours')) {
        return 'warning';
    }
    return 'default';
};

function AdminCampaignDetailPage() {
    const { campaignId } = Route.useParams();
    const id = Number(campaignId);
    const navigate = useNavigate();

    const { data, isLoading } = useAdminCampaign(id);
    const updateStatus = useUpdateAdminCampaignStatus();
    const archiveCampaign = useArchiveAdminCampaign();
    const importParticipants = useImportParticipantsToCampaign();
    const inviteParticipants = useInviteCampaignParticipants();
    const { data: coaches } = useCoaches();
    const reassignCampaignCoach = useReassignCampaignCoach();

    const [status, setStatus] = useState<'draft' | 'active' | 'closed' | 'archived'>('draft');
    const [file, setFile] = useState<File | null>(null);
    const [search, setSearch] = useState('');
    const [earlyActiveDialogOpen, setEarlyActiveDialogOpen] = useState(false);
    const [reassignCoachOpen, setReassignCoachOpen] = useState(false);
    const [reassignCoachSelect, setReassignCoachSelect] = useState('');
    const [reassignCoachError, setReassignCoachError] = useState<string | null>(null);

    // Synchroniser le statut local avec les données de la campagne une fois chargées
    useEffect(() => {
        if (data?.campaign?.status) {
            setStatus(data.campaign.status as 'draft' | 'active' | 'closed' | 'archived');
        }
    }, [data?.campaign?.status]);

    const responseColumns = useMemo<ColumnDef<AdminResponse>[]>(
        () => [
            {
                accessorKey: 'id',
                header: 'ID',
                enableSorting: false,
                cell: ({ getValue }) => (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        #{getValue() as number}
                    </Typography>
                ),
            },
            {
                accessorKey: 'name',
                header: 'Participant',
                enableSorting: false,
                cell: ({ getValue }) => (
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {getValue() as string}
                    </Typography>
                ),
            },
            {
                accessorKey: 'submitted_at',
                header: 'Soumis le',
                enableSorting: false,
                cell: ({ getValue }) => {
                    const v = getValue() as string;
                    return <Typography variant="body2">{v ? new Date(v).toLocaleString('fr-FR') : '—'}</Typography>;
                },
            },
            {
                accessorKey: 'submission_kind',
                header: 'Type',
                enableSorting: false,
                cell: ({ getValue }) => <Chip label={getValue() as string} size="small" variant="outlined" />,
            },
        ],
        []
    );

    const participantColumns = useMemo<ColumnDef<CampaignParticipantProgressRow>[]>(
        () => [
            {
                accessorKey: 'fullName',
                header: 'Nom',
                enableSorting: false,
                cell: ({ getValue }) => (
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {getValue() as string}
                    </Typography>
                ),
            },
            {
                accessorKey: 'email',
                header: 'Email',
                enableSorting: false,
                cell: ({ getValue }) => (
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                        {getValue() as string}
                    </Typography>
                ),
            },
            {
                accessorKey: 'selfRatingStatus',
                header: 'Self',
                enableSorting: false,
                cell: ({ getValue }) => (
                    <Chip
                        size="small"
                        label={getValue() as string}
                        color={getProgressChipColor(getValue() as string)}
                        variant="outlined"
                    />
                ),
            },
            {
                accessorKey: 'peerFeedbackStatus',
                header: 'Peer',
                enableSorting: false,
                cell: ({ getValue }) => (
                    <Chip
                        size="small"
                        label={getValue() as string}
                        color={getProgressChipColor(getValue() as string)}
                        variant="outlined"
                    />
                ),
            },
            {
                accessorKey: 'elementHumainStatus',
                header: 'Test',
                enableSorting: false,
                cell: ({ getValue }) => (
                    <Chip
                        size="small"
                        label={getValue() as string}
                        color={getProgressChipColor(getValue() as string)}
                        variant="outlined"
                    />
                ),
            },
        ],
        []
    );

    const filteredParticipants = useMemo(() => {
        const list = data?.participant_progress ?? [];
        const q = search.trim().toLowerCase();
        if (!q) {
            return list;
        }
        return list.filter(p => p.fullName.toLowerCase().includes(q) || p.email.toLowerCase().includes(q));
    }, [data?.participant_progress, search]);

    if (isLoading) {
        return (
            <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                Chargement des détails de la campagne...
            </Box>
        );
    }
    if (!data?.campaign) {
        return (
            <Box sx={{ p: 4 }}>
                <Alert severity="error" variant="filled">
                    Campagne introuvable.
                </Alert>
            </Box>
        );
    }

    const campaign = data.campaign;
    const responses = data.responses;
    const isSuperAdmin = parseAdminJwtClaims()?.scope === 'super-admin';

    // Helpers pour les couleurs des badges
    const getCampaignStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'success';
            case 'closed':
                return 'error';
            case 'archived':
                return 'warning';
            default:
                return 'default';
        }
    };

    const scheduledStartMs = campaign.startsAt ? new Date(campaign.startsAt).getTime() : null;
    const startsAtIsInFuture =
        scheduledStartMs !== null && !Number.isNaN(scheduledStartMs) && scheduledStartMs > Date.now();

    const applyStatusUpdate = async (alignStartsAtToNow?: boolean) => {
        await updateStatus.mutateAsync({
            campaignId: campaign.id,
            status,
            ...(alignStartsAtToNow ? { align_starts_at_to_now: true } : {}),
        });
    };

    const handleRequestStatusUpdate = () => {
        if (status === 'active' && startsAtIsInFuture) {
            setEarlyActiveDialogOpen(true);
            return;
        }
        void applyStatusUpdate();
    };

    const handleConfirmEarlyActivation = () => {
        void (async () => {
            try {
                await applyStatusUpdate(true);
                setEarlyActiveDialogOpen(false);
            } catch {
                // erreur affichée via updateStatus.isError
            }
        })();
    };

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, sm: 3, md: 4 } }}>
            {/* En-tête de la page */}
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', md: 'center' }}
                spacing={2}
                sx={{ mb: 4 }}
            >
                <Box>
                    <Typography variant="h4" fontWeight={800} sx={{ color: 'primary.main', mb: 0.5 }}>
                        {campaign.name}
                    </Typography>
                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        flexWrap="wrap"
                        useFlexGap
                        sx={{ color: 'text.secondary' }}
                    >
                        <Typography variant="body2" fontWeight={600}>
                            Campagne #{campaign.id}
                        </Typography>
                        <Typography variant="body2">•</Typography>
                        <Typography variant="body2">Questionnaire {campaign.questionnaireId ?? 'n/a'}</Typography>
                        <Typography variant="body2">•</Typography>
                        <Typography variant="body2">Entreprise #{campaign.companyId}</Typography>
                    </Stack>
                </Box>
                <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Mail size={18} />}
                        onClick={() => inviteParticipants.mutate({ campaignId: campaign.id })}
                        disabled={inviteParticipants.isPending}
                        sx={{ boxShadow: 1 }}
                    >
                        {inviteParticipants.isPending ? 'Envoi...' : 'Inviter les participants'}
                    </Button>
                    <Link
                        to="/admin/responses"
                        search={{ qid: campaign.questionnaireId ?? undefined, campaignId: campaign.id }}
                        style={{ textDecoration: 'none' }}
                    >
                        <Button variant="outlined" color="primary" startIcon={<Eye size={18} />}>
                            Voir les réponses
                        </Button>
                    </Link>
                    <Button
                        color="error"
                        variant="outlined"
                        startIcon={<Archive size={18} />}
                        onClick={async () => {
                            if (window.confirm('Êtes-vous sûr de vouloir archiver cette campagne ?')) {
                                await archiveCampaign.mutateAsync({ campaignId: campaign.id });
                                navigate({ to: '/admin/campaigns' });
                            }
                        }}
                    >
                        Archiver
                    </Button>
                </Stack>
            </Stack>

            {/* Section Supérieure : Détails & Import */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, mb: 3 }}>
                {/* Carte Détails de campagne */}
                <Card sx={{ borderRadius: 2.5 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Typography
                            variant="h6"
                            fontWeight={800}
                            sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                            <Calendar size={20} className="text-primary" />
                            Détails de la campagne
                        </Typography>

                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                            <Box>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    fontWeight={600}
                                    textTransform="uppercase"
                                >
                                    Statut actuel
                                </Typography>
                                <Box sx={{ mt: 0.5 }}>
                                    <Chip
                                        size="small"
                                        label={campaign.status}
                                        color={
                                            getCampaignStatusColor(campaign.status) as
                                                | 'default'
                                                | 'success'
                                                | 'error'
                                                | 'warning'
                                        }
                                        variant={campaign.status === 'draft' ? 'outlined' : 'filled'}
                                        sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                                    />
                                </Box>
                            </Box>
                            <Box>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    fontWeight={600}
                                    textTransform="uppercase"
                                >
                                    Test sans inputs
                                </Typography>
                                <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                                    {campaign.allowTestWithoutManualInputs ? 'Autorisé' : 'Non autorisé'}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    fontWeight={600}
                                    textTransform="uppercase"
                                >
                                    Date de début
                                </Typography>
                                <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                                    {campaign.startsAt ? new Date(campaign.startsAt).toLocaleString('fr-FR') : '—'}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    fontWeight={600}
                                    textTransform="uppercase"
                                >
                                    Date de fin
                                </Typography>
                                <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                                    {campaign.endsAt ? new Date(campaign.endsAt).toLocaleString('fr-FR') : '—'}
                                </Typography>
                            </Box>
                            <Box sx={{ gridColumn: { xs: '1 / -1', sm: '1 / -1' } }}>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    fontWeight={600}
                                    textTransform="uppercase"
                                >
                                    Coach
                                </Typography>
                                <Stack
                                    direction={{ xs: 'column', sm: 'row' }}
                                    spacing={1.5}
                                    alignItems={{ xs: 'flex-start', sm: 'center' }}
                                    sx={{ mt: 0.5 }}
                                >
                                    <Typography variant="body2" fontWeight={600} component="div">
                                        {coaches?.find(c => c.id === campaign.coachId)?.displayName ??
                                            `ID ${campaign.coachId}`}{' '}
                                        <Box
                                            component="span"
                                            sx={{ fontWeight: 400, color: 'text.secondary', fontSize: '0.8rem' }}
                                        >
                                            ({coaches?.find(c => c.id === campaign.coachId)?.username ?? '—'})
                                        </Box>
                                    </Typography>
                                    {isSuperAdmin ? (
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            color="inherit"
                                            startIcon={<UserRoundCog size={16} />}
                                            onClick={() => {
                                                setReassignCoachSelect(String(campaign.coachId));
                                                setReassignCoachError(null);
                                                setReassignCoachOpen(true);
                                            }}
                                            sx={{ fontWeight: 600, borderColor: 'divider' }}
                                        >
                                            Réaffecter
                                        </Button>
                                    ) : null}
                                </Stack>
                            </Box>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="flex-end">
                            <FormControl size="small" sx={{ minWidth: 200, flexGrow: 1 }}>
                                <InputLabel>Nouveau statut</InputLabel>
                                <Select
                                    label="Nouveau statut"
                                    value={status}
                                    onChange={e =>
                                        setStatus(e.target.value as 'draft' | 'active' | 'closed' | 'archived')
                                    }
                                >
                                    <MenuItem value="draft">Brouillon (Draft)</MenuItem>
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="closed">Fermée (Closed)</MenuItem>
                                    <MenuItem value="archived">Archivée</MenuItem>
                                </Select>
                            </FormControl>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<Save size={18} />}
                                onClick={handleRequestStatusUpdate}
                                disabled={updateStatus.isPending || status === campaign.status}
                            >
                                Mettre à jour
                            </Button>
                        </Stack>
                        {updateStatus.isError && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {updateStatus.error.message}
                            </Alert>
                        )}
                        {updateStatus.isSuccess && (
                            <Alert severity="success" sx={{ mt: 2 }}>
                                Statut mis à jour avec succès.
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {/* Carte Import CSV */}
                <Card sx={{ borderRadius: 2.5 }}>
                    <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Typography
                            variant="h6"
                            fontWeight={800}
                            sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                            <FileSpreadsheet size={20} className="text-primary" />
                            Import participants (CSV)
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Import global des participants. Assurez-vous d'utiliser un fichier cohérent avec
                            l'entreprise de cette campagne.
                        </Typography>

                        <Box
                            sx={{
                                flexGrow: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                p: 3,
                                border: '2px dashed',
                                borderColor: 'divider',
                                borderRadius: 2,
                                bgcolor: 'background.default',
                            }}
                        >
                            <Button
                                component="label"
                                variant="outlined"
                                startIcon={<Upload size={18} />}
                                sx={{ mb: 1 }}
                            >
                                Choisir un fichier CSV
                                <input
                                    type="file"
                                    accept=".csv"
                                    hidden
                                    onChange={e => setFile(e.target.files?.[0] ?? null)}
                                />
                            </Button>
                            <Typography variant="caption" color="text.secondary">
                                {file ? file.name : 'Aucun fichier sélectionné'}
                            </Typography>
                        </Box>

                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                variant="contained"
                                color="secondary"
                                disabled={!file || importParticipants.isPending}
                                onClick={async () => {
                                    if (!file) return;
                                    const form = new FormData();
                                    form.append('file', file);
                                    await importParticipants.mutateAsync({ campaignId: campaign.id, formData: form });
                                    setFile(null);
                                }}
                            >
                                {importParticipants.isPending ? 'Importation...' : "Lancer l'importation"}
                            </Button>
                        </Box>

                        {importParticipants.isError && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                Échec de l'importation CSV.
                            </Alert>
                        )}
                        {importParticipants.isSuccess && (
                            <Alert severity="success" sx={{ mt: 2 }}>
                                Import terminé : {importParticipants.data.created} créés,{' '}
                                {importParticipants.data.updated} mis à jour, {importParticipants.data.invited} invités.
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </Box>

            {/* Section Inférieure : Réponses & Participants */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '1.2fr 1.5fr' }, gap: 3 }}>
                <DataTable
                    data={responses ?? []}
                    columns={responseColumns}
                    minWidth={480}
                    size="small"
                    stickyHeader
                    tableContainerSx={{ maxHeight: 400 }}
                    cardSx={{ borderRadius: 2.5 }}
                    toolbar={
                        <Typography variant="h6" fontWeight={800}>
                            Dernières réponses
                        </Typography>
                    }
                    afterRows={
                        (responses?.length ?? 0) === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={responseColumns.length}
                                    align="center"
                                    sx={{ py: 4, color: 'text.secondary' }}
                                >
                                    Aucune réponse pour cette campagne.
                                </TableCell>
                            </TableRow>
                        ) : null
                    }
                />

                <DataTable
                    data={filteredParticipants}
                    columns={participantColumns}
                    minWidth={520}
                    size="small"
                    stickyHeader
                    tableContainerSx={{ maxHeight: 400 }}
                    cardSx={{ borderRadius: 2.5 }}
                    toolbar={
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: 2,
                            }}
                        >
                            <Typography variant="h6" fontWeight={800}>
                                Suivi des participants
                            </Typography>
                            <TextField
                                size="small"
                                placeholder="Rechercher un participant..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                sx={{ width: { xs: '100%', sm: 250 } }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
                                            <Search size={18} />
                                        </InputAdornment>
                                    ),
                                    sx: { borderRadius: 2, bgcolor: 'background.default' },
                                }}
                            />
                        </Box>
                    }
                    afterRows={
                        filteredParticipants.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={participantColumns.length}
                                    align="center"
                                    sx={{ py: 4, color: 'text.secondary' }}
                                >
                                    Aucun participant trouvé.
                                </TableCell>
                            </TableRow>
                        ) : null
                    }
                />
            </Box>

            <Dialog
                open={earlyActiveDialogOpen}
                onClose={() => {
                    if (!updateStatus.isPending) {
                        setEarlyActiveDialogOpen(false);
                    }
                }}
                disableEscapeKeyDown={updateStatus.isPending}
                aria-labelledby="early-active-dialog-title"
            >
                <DialogTitle id="early-active-dialog-title">Activer avant la date de début ?</DialogTitle>
                <DialogContent>
                    <DialogContentText component="div">
                        La date de début prévue (
                        {campaign.startsAt
                            ? new Date(campaign.startsAt).toLocaleString('fr-FR', {
                                  dateStyle: 'long',
                                  timeStyle: 'short',
                              })
                            : '—'}
                        ) n&apos;est pas encore atteinte.
                        <Box component="span" sx={{ display: 'block', mt: 1.5 }}>
                            Si vous confirmez, la campagne passera en <strong>Active</strong> et la{' '}
                            <strong>date de début sera mise à maintenant</strong> (heure du serveur).
                        </Box>
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setEarlyActiveDialogOpen(false)} disabled={updateStatus.isPending}>
                        Annuler
                    </Button>
                    <Button
                        onClick={handleConfirmEarlyActivation}
                        variant="contained"
                        color="primary"
                        disabled={updateStatus.isPending}
                    >
                        {updateStatus.isPending ? 'Mise à jour…' : 'Confirmer et activer'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={reassignCoachOpen}
                onClose={() => !reassignCampaignCoach.isPending && setReassignCoachOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: 'primary.main' }}>
                    Réaffecter la campagne à un coach
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            La campagne <strong>{campaign.name}</strong> sera associée au coach sélectionné.
                        </Typography>
                        <FormControl fullWidth size="small">
                            <InputLabel id="reassign-coach-label">Coach</InputLabel>
                            <Select
                                labelId="reassign-coach-label"
                                label="Coach"
                                value={reassignCoachSelect}
                                onChange={e => setReassignCoachSelect(String(e.target.value))}
                            >
                                {(coaches ?? [])
                                    .filter(c => c.isActive)
                                    .map(c => (
                                        <MenuItem key={c.id} value={String(c.id)}>
                                            {c.displayName} ({c.username})
                                        </MenuItem>
                                    ))}
                            </Select>
                        </FormControl>
                        {reassignCoachError ? <Alert severity="error">{reassignCoachError}</Alert> : null}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setReassignCoachOpen(false)} disabled={reassignCampaignCoach.isPending}>
                        Annuler
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        disabled={
                            reassignCampaignCoach.isPending ||
                            !reassignCoachSelect ||
                            Number(reassignCoachSelect) === campaign.coachId
                        }
                        onClick={async () => {
                            setReassignCoachError(null);
                            try {
                                await reassignCampaignCoach.mutateAsync({
                                    campaignId: campaign.id,
                                    coachId: Number(reassignCoachSelect),
                                });
                                setReassignCoachOpen(false);
                            } catch (e) {
                                setReassignCoachError(readApiError(e));
                            }
                        }}
                    >
                        {reassignCampaignCoach.isPending ? 'Enregistrement…' : 'Enregistrer'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
