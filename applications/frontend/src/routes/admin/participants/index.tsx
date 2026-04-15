import type { CreateInviteResult, Participant } from '@/api/types';
import { DataTable } from '@/components/common/DataTable';
import {
    useCompanies,
    useCreateInvite,
    useDeleteParticipant,
    useImportParticipants,
    useMailStatus,
    useParticipantTokens,
    useParticipants,
} from '@/hooks/admin';
import { useAdminQuestionnaires } from '@/hooks/questionnaires';
import {
    Alert,
    Box,
    Button,
    Checkbox,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Skeleton,
    Snackbar,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { Link, createFileRoute } from '@tanstack/react-router';
import { type ColumnDef, getFilteredRowModel } from '@tanstack/react-table';
import {
    AlertCircle,
    Copy,
    FileUp,
    Filter,
    Link as LinkIcon,
    List,
    Mail,
    Search,
    Table2,
    Trash2,
    Upload,
    Users2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type ParticipantsSearch = { companyId?: number };

export const Route = createFileRoute('/admin/participants/')({
    validateSearch: (search: Record<string, unknown>): ParticipantsSearch => {
        const raw = search.companyId;
        if (raw === undefined || raw === null || raw === '') return {};
        const n = typeof raw === 'number' ? raw : Number(raw);
        return Number.isFinite(n) ? { companyId: n } : {};
    },
    component: AdminParticipantsPage,
});

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'success' | 'error' | 'info'> = {
    pending: 'warning',
    confirmed: 'info',
    used: 'success',
    expired: 'error',
    inactive: 'default',
};

const STATUS_LABELS: Record<string, string> = {
    pending: 'En attente',
    confirmed: 'Participation confirmée',
    used: 'Complété',
    expired: 'Expiré',
    inactive: 'Inactif',
};

const ERASE_CONFIRM_PHRASE = 'SUPPRIMER';

function AdminParticipantsPage() {
    const search = Route.useSearch();
    const companyId = search.companyId;

    const [globalFilter, setGlobalFilter] = useState('');
    const [page, setPage] = useState(1);
    const [csvOpen, setCsvOpen] = useState(false);
    const [eraseParticipant, setEraseParticipant] = useState<Participant | null>(null);
    const [eraseConfirmText, setEraseConfirmText] = useState('');
    const [inviteParticipant, setInviteParticipant] = useState<Participant | null>(null);
    const [inviteQid, setInviteQid] = useState('');
    const [inviteCampaignId, setInviteCampaignId] = useState('');
    const [inviteSendEmail, setInviteSendEmail] = useState(false);
    const [inviteResult, setInviteResult] = useState<CreateInviteResult | null>(null);
    const [tokensParticipant, setTokensParticipant] = useState<Participant | null>(null);
    const [copySnackbar, setCopySnackbar] = useState(false);

    useEffect(() => {
        void companyId;
        setPage(1);
    }, [companyId]);

    const { data, isLoading } = useParticipants(page, companyId);
    const { data: companies } = useCompanies();
    const { data: questionnaires } = useAdminQuestionnaires();
    const { data: mailStatus } = useMailStatus();
    const { data: tokensData, isLoading: tokensLoading } = useParticipantTokens(tokensParticipant?.id ?? null);
    const importMut = useImportParticipants();
    const deleteMut = useDeleteParticipant();
    const inviteMut = useCreateInvite();

    const filteredCompanyName = companies?.find(c => c.id === companyId)?.name;

    const columns = useMemo<ColumnDef<Participant>[]>(
        () => [
            {
                accessorKey: 'full_name',
                header: 'Participant',
                cell: ({ row }) => (
                    <Box>
                        <Typography variant="body2" fontWeight={700} color="text.primary">
                            {row.original.full_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                            {row.original.email}
                        </Typography>
                    </Box>
                ),
            },
            {
                accessorFn: row => row.company?.name ?? '—',
                id: 'company',
                header: 'Entreprise',
                cell: ({ getValue }) => (
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        {getValue() as string}
                    </Typography>
                ),
            },
            {
                accessorKey: 'invite_status',
                header: 'État des Invitations',
                cell: ({ getValue }) => {
                    const statuses = getValue() as Record<string, string>;
                    return (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {Object.entries(statuses).map(([qid, status]) => (
                                <Chip
                                    key={qid}
                                    label={`${qid}: ${STATUS_LABELS[status] || status}`}
                                    size="small"
                                    color={STATUS_COLORS[status] ?? 'default'}
                                    variant={status === 'used' || status === 'confirmed' ? 'filled' : 'outlined'}
                                    sx={{
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        borderRadius: 1.5,
                                    }}
                                />
                            ))}
                            {Object.keys(statuses).length === 0 && (
                                <Typography variant="caption" color="text.disabled" fontStyle="italic">
                                    Aucune invitation
                                </Typography>
                            )}
                        </Box>
                    );
                },
            },
            {
                accessorKey: 'response_count',
                header: 'Réponses',
                cell: ({ getValue }) => {
                    const count = getValue() as number;
                    return (
                        <Chip
                            label={count > 0 ? `${count} validée(s)` : '0'}
                            size="small"
                            sx={{
                                bgcolor: count > 0 ? 'rgba(21, 21, 176, 0.08)' : 'background.default',
                                color: count > 0 ? 'primary.main' : 'text.secondary',
                                fontWeight: 700,
                                borderRadius: 1.5,
                            }}
                        />
                    );
                },
            },
            {
                id: 'actions',
                header: '',
                cell: ({ row }) => (
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Inviter ce participant">
                            <IconButton
                                size="small"
                                onClick={() => {
                                    setInviteParticipant(row.original);
                                    setInviteQid('');
                                    setInviteCampaignId('');
                                    setInviteSendEmail(false);
                                    setInviteResult(null);
                                }}
                                sx={{ color: 'primary.main', '&:hover': { bgcolor: 'rgba(21, 21, 176, 0.08)' } }}
                            >
                                <Mail size={18} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Matrice des scores">
                            <Link
                                to="/admin/participants/$participantId/matrix"
                                params={{ participantId: String(row.original.id) }}
                                search={{ qid: 'B' }}
                                style={{ display: 'inline-flex', textDecoration: 'none' }}
                            >
                                <IconButton size="small" sx={{ color: 'text.secondary' }}>
                                    <Table2 size={18} />
                                </IconButton>
                            </Link>
                        </Tooltip>
                        <Tooltip title="Gérer les liens générés">
                            <IconButton
                                size="small"
                                onClick={() => setTokensParticipant(row.original)}
                                sx={{ color: 'text.secondary' }}
                            >
                                <List size={18} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer (RGPD)">
                            <IconButton
                                size="small"
                                onClick={() => {
                                    setEraseParticipant(row.original);
                                    setEraseConfirmText('');
                                }}
                                sx={{
                                    color: 'text.disabled',
                                    '&:hover': { color: 'error.main', bgcolor: 'error.lighter' },
                                }}
                            >
                                <Trash2 size={18} />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                ),
            },
        ],
        []
    );

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, sm: 3, md: 4 } }}>
            {/* En-tête de page */}
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', md: 'flex-end' }}
                spacing={3}
                sx={{ mb: 4 }}
            >
                <Box>
                    <Typography
                        variant="h4"
                        fontWeight={800}
                        sx={{ color: 'primary.main', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1.5 }}
                    >
                        <Users2 size={28} />
                        Participants
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Annuaire global des {data?.total ?? 0} participants et gestion des accès.
                    </Typography>

                    {companyId != null && (
                        <Alert
                            severity="info"
                            sx={{
                                mt: 2,
                                borderRadius: 2,
                                '& .MuiAlert-message': {
                                    display: 'flex',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: 1,
                                },
                            }}
                        >
                            Filtre actif : <strong>{filteredCompanyName ?? `Entreprise #${companyId}`}</strong>
                            <Link to="/admin/participants" style={{ textDecoration: 'none' }}>
                                <Chip
                                    label="Effacer le filtre"
                                    size="small"
                                    onClick={() => {}}
                                    sx={{ cursor: 'pointer', ml: 1, fontWeight: 600 }}
                                />
                            </Link>
                        </Alert>
                    )}
                </Box>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Upload size={18} />}
                    onClick={() => setCsvOpen(true)}
                    sx={{ fontWeight: 600, boxShadow: 1 }}
                >
                    Importer CSV
                </Button>
            </Stack>

            <DataTable
                data={data?.items ?? []}
                columns={columns}
                isLoading={isLoading}
                skeletonRowCount={6}
                minWidth={800}
                cardSx={{ borderRadius: 2.5, boxShadow: '0 2px 10px rgba(0,0,0,0.02)', overflow: 'hidden' }}
                tableOptions={{
                    state: { globalFilter },
                    onGlobalFilterChange: setGlobalFilter,
                    getFilteredRowModel: getFilteredRowModel(),
                    manualPagination: true,
                    pageCount: data?.pages ?? 1,
                }}
                toolbar={
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 2,
                            flexWrap: 'wrap',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                            <Filter size={18} />
                            <Typography variant="body2" fontWeight={600}>
                                Recherche :
                            </Typography>
                        </Box>

                        <TextField
                            size="small"
                            placeholder="Nom, email, entreprise..."
                            value={globalFilter}
                            onChange={e => setGlobalFilter(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search size={18} />
                                    </InputAdornment>
                                ),
                                sx: { borderRadius: 2, bgcolor: 'background.default' },
                            }}
                            sx={{ width: { xs: '100%', md: 400 } }}
                        />
                    </Box>
                }
                afterRows={
                    !isLoading && (data?.items?.length ?? 0) === 0 ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} align="center" sx={{ py: 8 }}>
                                <Users2 size={48} color="#e5e7eb" style={{ marginBottom: 16 }} />
                                <Typography variant="h6" color="text.primary" fontWeight={700} gutterBottom>
                                    Aucun participant trouvé
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Modifiez votre recherche ou importez une liste de participants via CSV.
                                </Typography>
                            </TableCell>
                        </TableRow>
                    ) : null
                }
                footer={
                    (data?.pages ?? 1) > 1 ? (
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                p: 2,
                                bgcolor: 'background.default',
                                borderTop: '1px solid',
                                borderColor: 'divider',
                            }}
                        >
                            <Button
                                size="small"
                                variant="outlined"
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                sx={{ borderColor: 'divider', color: 'text.primary', bgcolor: 'background.paper' }}
                            >
                                Précédent
                            </Button>
                            <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                Page {page} sur {data?.pages}
                            </Typography>
                            <Button
                                size="small"
                                variant="outlined"
                                disabled={page === data?.pages}
                                onClick={() => setPage(page + 1)}
                                sx={{ borderColor: 'divider', color: 'text.primary', bgcolor: 'background.paper' }}
                            >
                                Suivant
                            </Button>
                        </Box>
                    ) : null
                }
            />

            {/* Dialog Import CSV */}
            <CsvImportDialog open={csvOpen} onClose={() => setCsvOpen(false)} onImport={importMut} />

            {/* Dialog Suppression RGPD */}
            <Dialog
                open={!!eraseParticipant}
                onClose={() => !deleteMut.isPending && setEraseParticipant(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle
                    sx={{
                        fontWeight: 800,
                        color: 'error.main',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        pt: 3,
                        px: 3,
                    }}
                >
                    <AlertCircle size={24} />
                    Suppression du participant
                </DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    <Typography variant="body1" sx={{ mb: 2, color: 'text.primary' }}>
                        Vous êtes sur le point de supprimer <strong>{eraseParticipant?.full_name}</strong> (
                        {eraseParticipant?.email}).
                    </Typography>

                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                        <Typography variant="body2" fontWeight={700} gutterBottom>
                            Action irréversible (Droit à l'effacement - RGPD)
                        </Typography>
                        <Typography variant="body2">
                            Toutes les réponses, les scores et les liens d'invitation liés à cet utilisateur seront
                            détruits. Les données anonymisées ne pourront plus lui être rattachées.
                        </Typography>
                    </Alert>

                    <Box
                        sx={{
                            bgcolor: 'background.default',
                            p: 2,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Typography variant="body2" color="text.primary" sx={{ mb: 1 }}>
                            Veuillez taper <strong>{ERASE_CONFIRM_PHRASE}</strong> pour confirmer :
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            value={eraseConfirmText}
                            onChange={e => setEraseConfirmText(e.target.value)}
                            placeholder={ERASE_CONFIRM_PHRASE}
                            disabled={deleteMut.isPending}
                            autoFocus
                            sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
                        />
                    </Box>

                    {deleteMut.isError && (
                        <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                            Une erreur est survenue lors de la suppression. Veuillez réessayer.
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
                    <Button
                        onClick={() => setEraseParticipant(null)}
                        disabled={deleteMut.isPending}
                        variant="outlined"
                        color="inherit"
                        sx={{ borderColor: 'divider' }}
                    >
                        Annuler
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        startIcon={<Trash2 size={18} />}
                        disabled={deleteMut.isPending || eraseConfirmText !== ERASE_CONFIRM_PHRASE}
                        onClick={async () => {
                            if (!eraseParticipant) return;
                            await deleteMut.mutateAsync({ participantId: eraseParticipant.id });
                            setEraseParticipant(null);
                            setEraseConfirmText('');
                        }}
                        sx={{ fontWeight: 700 }}
                    >
                        {deleteMut.isPending ? 'Suppression en cours…' : 'Supprimer définitivement'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog : Générer une Invitation */}
            <Dialog
                open={!!inviteParticipant}
                onClose={() => {
                    if (!inviteMut.isPending) {
                        setInviteParticipant(null);
                        setInviteResult(null);
                        setInviteQid('');
                        setInviteCampaignId('');
                        setInviteSendEmail(false);
                    }
                }}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle
                    sx={{
                        fontWeight: 800,
                        pt: 3,
                        px: 3,
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    <Mail size={24} />
                    Générer une invitation
                </DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    {inviteParticipant && (
                        <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, mb: 3 }}>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                textTransform="uppercase"
                                fontWeight={700}
                            >
                                Destinataire
                            </Typography>
                            <Typography variant="body1" color="text.primary" fontWeight={600}>
                                {inviteParticipant.full_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {inviteParticipant.email}
                            </Typography>
                        </Box>
                    )}

                    <Stack spacing={2.5} sx={{ mb: 3 }}>
                        <FormControl fullWidth size="medium">
                            <InputLabel>Questionnaire cible</InputLabel>
                            <Select
                                label="Questionnaire cible"
                                value={inviteQid}
                                onChange={e => setInviteQid(e.target.value)}
                                disabled={inviteMut.isPending}
                                sx={{ borderRadius: 2 }}
                            >
                                <MenuItem value="" disabled>
                                    <em>Choisir un questionnaire…</em>
                                </MenuItem>
                                {questionnaires?.map(q => (
                                    <MenuItem key={q.id} value={q.id}>
                                        {q.id} — {q.title}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            fullWidth
                            size="medium"
                            type="number"
                            label="ID de la Campagne"
                            value={inviteCampaignId}
                            onChange={e => setInviteCampaignId(e.target.value)}
                            disabled={inviteMut.isPending}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                    </Stack>

                    <Box sx={{ border: '1px solid', borderColor: 'divider', p: 1.5, borderRadius: 2, mb: 3 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={inviteSendEmail}
                                    onChange={(_, c) => setInviteSendEmail(c)}
                                    disabled={inviteMut.isPending || !mailStatus?.configured}
                                    color="primary"
                                />
                            }
                            label={
                                <Typography variant="body2" fontWeight={600}>
                                    Envoyer l'invitation par e-mail
                                </Typography>
                            }
                        />
                        {!mailStatus?.configured && (
                            <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 0.5, ml: 4 }}>
                                Le serveur SMTP n'est pas configuré. Génération de lien uniquement.
                            </Typography>
                        )}
                    </Box>

                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        size="large"
                        startIcon={<LinkIcon size={18} />}
                        disabled={!inviteQid || !inviteCampaignId || inviteMut.isPending}
                        onClick={async () => {
                            const parsedCampaignId = Number.parseInt(inviteCampaignId, 10);
                            if (!inviteParticipant || !inviteQid || !Number.isFinite(parsedCampaignId)) return;
                            const res = await inviteMut.mutateAsync({
                                participantId: inviteParticipant.id,
                                campaignId: parsedCampaignId,
                                questionnaireId: inviteQid,
                                sendEmail: inviteSendEmail,
                            });
                            setInviteResult(res);
                        }}
                        sx={{ fontWeight: 700, borderRadius: 2 }}
                    >
                        {inviteMut.isPending ? 'Génération en cours…' : "Créer le lien d'accès"}
                    </Button>

                    {inviteResult && (
                        <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                                Lien généré avec succès :
                            </Typography>
                            <TextField
                                fullWidth
                                size="small"
                                value={inviteResult.invite_url}
                                InputProps={{
                                    readOnly: true,
                                    sx: {
                                        bgcolor: 'background.default',
                                        borderRadius: 2,
                                        fontFamily: 'monospace',
                                        fontSize: '0.85rem',
                                    },
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <Tooltip title="Copier le lien">
                                                <IconButton
                                                    color="primary"
                                                    edge="end"
                                                    onClick={async () => {
                                                        try {
                                                            await navigator.clipboard.writeText(
                                                                inviteResult.invite_url
                                                            );
                                                            setCopySnackbar(true);
                                                        } catch {
                                                            /* ignore */
                                                        }
                                                    }}
                                                >
                                                    <Copy size={18} />
                                                </IconButton>
                                            </Tooltip>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            {inviteResult.mail_sent && (
                                <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
                                    L'e-mail a été envoyé à {inviteParticipant?.email}.
                                </Alert>
                            )}
                            {inviteResult.mail_error && (
                                <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                                    Lien créé, mais échec de l'envoi e-mail : {inviteResult.mail_error}
                                </Alert>
                            )}
                        </Box>
                    )}

                    {inviteMut.isError && (
                        <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                            Erreur lors de la création de l'invitation.
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
                    <Button
                        onClick={() => {
                            setInviteParticipant(null);
                            setInviteResult(null);
                            setInviteQid('');
                            setInviteCampaignId('');
                            setInviteSendEmail(false);
                        }}
                        disabled={inviteMut.isPending}
                        color="inherit"
                        variant="outlined"
                        sx={{ borderColor: 'divider' }}
                    >
                        Fermer
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Liste des jetons générés */}
            <Dialog
                open={!!tokensParticipant}
                onClose={() => setTokensParticipant(null)}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 800, pt: 3, px: 3 }}>
                    Liens d'accès — {tokensParticipant?.full_name}
                </DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    {tokensLoading ? (
                        <Skeleton variant="rounded" height={150} />
                    ) : !tokensData?.length ? (
                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                            Ce participant n'a reçu aucun lien d'accès pour le moment.
                        </Alert>
                    ) : (
                        <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                            <Table size="small">
                                <TableHead sx={{ bgcolor: 'background.default' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Questionnaire</TableCell>
                                        <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Statut</TableCell>
                                        <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Date de création</TableCell>
                                        <TableCell sx={{ fontWeight: 700, py: 1.5 }}>Date d'expiration</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, py: 1.5 }}>
                                            Lien
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {tokensData.map(t => (
                                        <TableRow key={t.id} hover>
                                            <TableCell sx={{ fontWeight: 600 }}>{t.questionnaire_id}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={STATUS_LABELS[t.status] ?? t.status}
                                                    size="small"
                                                    color={STATUS_COLORS[t.status] ?? 'default'}
                                                    variant={
                                                        t.status === 'used' || t.status === 'confirmed'
                                                            ? 'filled'
                                                            : 'outlined'
                                                    }
                                                    sx={{ fontSize: '0.7rem', fontWeight: 700 }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ color: 'text.secondary' }}>
                                                {new Date(t.created_at).toLocaleDateString('fr-FR')}
                                            </TableCell>
                                            <TableCell sx={{ color: 'text.secondary' }}>
                                                {t.expires_at
                                                    ? new Date(t.expires_at).toLocaleDateString('fr-FR')
                                                    : '—'}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="Copier le lien public">
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={async () => {
                                                            try {
                                                                await navigator.clipboard.writeText(t.invite_url);
                                                                setCopySnackbar(true);
                                                            } catch {
                                                                /* ignore */
                                                            }
                                                        }}
                                                    >
                                                        <Copy size={16} />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
                    <Button
                        onClick={() => setTokensParticipant(null)}
                        color="inherit"
                        variant="outlined"
                        sx={{ borderColor: 'divider' }}
                    >
                        Fermer
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={copySnackbar}
                autoHideDuration={2500}
                onClose={() => setCopySnackbar(false)}
                message="Lien copié dans le presse-papiers"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
        </Box>
    );
}

// Composant d'import CSV repensé
function CsvImportDialog({
    open,
    onClose,
    onImport,
}: {
    open: boolean;
    onClose: () => void;
    onImport: ReturnType<typeof useImportParticipants>;
}) {
    const [file, setFile] = useState<File | null>(null);

    async function handleSubmit() {
        if (!file) return;
        const form = new FormData();
        form.append('file', file);
        await onImport.mutateAsync(form);

        if (onImport.isSuccess) {
            setTimeout(() => {
                onClose();
                setFile(null);
            }, 2500);
        }
    }

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setFile(null);
            onImport.reset();
        }, 300);
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pt: 3, px: 3, color: 'primary.main' }}>
                <FileUp size={24} />
                <Typography variant="h6" fontWeight={800}>
                    Importer des participants
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ px: 3 }}>
                <Typography variant="body2" color="text.secondary" mb={1.5}>
                    Veuillez uploader un fichier au format CSV (séparateur point-virgule <code>;</code>) contenant
                    obligatoirement les colonnes suivantes :
                </Typography>

                <Box
                    sx={{
                        p: 1.5,
                        bgcolor: 'background.default',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        mb: 3,
                        overflowX: 'auto',
                    }}
                >
                    <Typography
                        variant="body2"
                        sx={{ fontFamily: 'monospace', color: 'primary.main', fontWeight: 600 }}
                    >
                        company_name;first_name;last_name;email;questionnaire_type
                    </Typography>
                </Box>

                <Box
                    sx={{
                        border: '2px dashed',
                        borderColor: file ? 'primary.main' : 'divider',
                        borderRadius: 2,
                        p: 4,
                        textAlign: 'center',
                        bgcolor: file ? 'rgba(21, 21, 176, 0.03)' : 'background.default',
                        transition: 'all 0.2s',
                        '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(21, 21, 176, 0.03)' },
                    }}
                >
                    <input
                        type="file"
                        id="csv-upload"
                        accept=".csv"
                        hidden
                        onChange={e => setFile(e.target.files?.[0] ?? null)}
                    />
                    <label
                        htmlFor="csv-upload"
                        style={{
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '12px',
                            width: '100%',
                        }}
                    >
                        <Upload size={36} color={file ? '#1515B0' : '#9ca3af'} />
                        <Box>
                            <Typography variant="body1" fontWeight={700} color={file ? 'primary.main' : 'text.primary'}>
                                {file ? file.name : 'Sélectionner un fichier CSV'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {file
                                    ? `Taille : ${(file.size / 1024).toFixed(1)} KB`
                                    : 'ou glissez-déposez le fichier ici'}
                            </Typography>
                        </Box>
                    </label>
                </Box>

                {onImport.isSuccess && (
                    <Alert severity="success" sx={{ mt: 3, borderRadius: 2 }}>
                        <strong>Import réussi !</strong> {onImport.data.created} compte(s) créé(s),{' '}
                        {onImport.data.updated} mis à jour.
                        {onImport.data.errors.length > 0 &&
                            ` Attention : ${onImport.data.errors.length} erreur(s) signalée(s).`}
                    </Alert>
                )}
                {onImport.isError && (
                    <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
                        Le format du fichier semble invalide ou une erreur système est survenue.
                    </Alert>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
                <Button onClick={handleClose} color="inherit" variant="outlined" sx={{ borderColor: 'divider' }}>
                    Annuler
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    disabled={!file || onImport.isPending}
                    startIcon={<FileUp size={18} />}
                    sx={{ fontWeight: 700 }}
                >
                    {onImport.isPending ? 'Traitement en cours...' : "Lancer l'import"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
