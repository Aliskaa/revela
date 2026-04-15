import type { Coach } from '@/api/types';
import CoachForm from '@/components/coach/form';
import { DataTable } from '@/components/common/DataTable';
import { useAdminCoach, useCoaches, useDeleteCoach, useUpdateCoach } from '@/hooks/admin';
import { parseAdminJwtClaims } from '@/lib/auth';
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    InputAdornment,
    Stack,
    Switch,
    TableCell,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { Link, createFileRoute } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { Filter, Pencil, Search, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

export const Route = createFileRoute('/admin/coachs/')({
    component: RouteComponent,
});

const readApiError = (err: unknown): string => {
    if (typeof err === 'object' && err !== null && 'response' in err) {
        const data = (err as { response?: { data?: { error?: string } } }).response?.data;
        if (data?.error) {
            return data.error;
        }
    }
    return err instanceof Error ? err.message : 'Erreur inconnue.';
};

function RouteComponent() {
    const claims = parseAdminJwtClaims();
    const isSuperAdmin = claims?.scope === 'super-admin';

    const { data: coaches, isLoading } = useCoaches();
    const updateCoach = useUpdateCoach();
    const deleteCoach = useDeleteCoach();

    const [searchQuery, setSearchQuery] = useState('');
    const [editOpen, setEditOpen] = useState(false);
    const [editingCoachId, setEditingCoachId] = useState<number | null>(null);
    const [formUsername, setFormUsername] = useState('');
    const [formDisplayName, setFormDisplayName] = useState('');
    const [formPassword, setFormPassword] = useState('');
    const [formIsActive, setFormIsActive] = useState(true);
    const [formError, setFormError] = useState<string | null>(null);

    const [deleteTarget, setDeleteTarget] = useState<Coach | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const detailCoachId = editingCoachId ?? deleteTarget?.id ?? 0;
    const detailQueryEnabled =
        detailCoachId > 0 && (editOpen || deleteTarget !== null) && (isSuperAdmin || detailCoachId === claims?.coachId);
    const { data: coachDetail, isLoading: detailLoading } = useAdminCoach(detailCoachId, {
        enabled: detailQueryEnabled,
    });

    const filteredData = useMemo(() => {
        if (!coaches) {
            return [];
        }
        if (!searchQuery.trim()) {
            return coaches;
        }
        const q = searchQuery.toLowerCase();
        return coaches.filter(c => c.username.toLowerCase().includes(q) || c.displayName.toLowerCase().includes(q));
    }, [coaches, searchQuery]);

    const openEdit = useCallback((c: Coach) => {
        setEditingCoachId(c.id);
        setFormUsername(c.username);
        setFormDisplayName(c.displayName);
        setFormPassword('');
        setFormIsActive(c.isActive);
        setFormError(null);
        setEditOpen(true);
    }, []);

    const closeEdit = () => {
        setEditOpen(false);
        setEditingCoachId(null);
        setFormError(null);
    };

    const handleSaveCoach = async () => {
        if (editingCoachId === null) {
            return;
        }
        setFormError(null);
        const username = formUsername.trim().toLowerCase();
        const displayName = formDisplayName.trim();
        if (username.length < 3) {
            setFormError('Le username doit contenir au moins 3 caractères.');
            return;
        }
        if (displayName.length < 2) {
            setFormError('Le nom affiché doit contenir au moins 2 caractères.');
            return;
        }
        const passwordTrim = formPassword.trim();
        if (passwordTrim.length > 0 && passwordTrim.length < 6) {
            setFormError('Le mot de passe doit contenir au moins 6 caractères.');
            return;
        }
        try {
            await updateCoach.mutateAsync({
                coachId: editingCoachId,
                username,
                displayName,
                ...(isSuperAdmin ? { isActive: formIsActive } : {}),
                ...(passwordTrim.length > 0 ? { password: passwordTrim } : {}),
            });
            closeEdit();
        } catch (e) {
            setFormError(readApiError(e));
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) {
            return;
        }
        setDeleteError(null);
        try {
            await deleteCoach.mutateAsync({ coachId: deleteTarget.id });
            setDeleteTarget(null);
        } catch (e) {
            setDeleteError(readApiError(e));
        }
    };

    const columns = useMemo<ColumnDef<Coach>[]>(
        () => [
            { accessorKey: 'username', header: 'Username', enableSorting: false },
            { accessorKey: 'displayName', header: 'Nom affiché', enableSorting: false },
            {
                accessorKey: 'isActive',
                header: 'Actif',
                enableSorting: false,
                cell: ({ getValue }) => ((getValue() as boolean) ? 'Oui' : 'Non'),
            },
            {
                id: 'actions',
                header: '',
                cell: ({ row }) => (
                    <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
                        <Tooltip title="Modifier">
                            <IconButton
                                size="small"
                                onClick={() => openEdit(row.original)}
                                sx={{
                                    color: 'text.disabled',
                                    '&:hover': { color: 'primary.main', bgcolor: 'primary.lighter' },
                                }}
                            >
                                <Pencil size={18} />
                            </IconButton>
                        </Tooltip>
                        {isSuperAdmin ? (
                            <Tooltip title="Supprimer">
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        setDeleteTarget(row.original);
                                        setDeleteError(null);
                                    }}
                                    sx={{
                                        color: 'text.disabled', '&:hover': { color: 'error.main', bgcolor: 'error.lighter' },
                                    }}
                                >
                                    <Trash2 size={18} />
                                </IconButton>
                            </Tooltip>
                        ) : null}
                    </Stack>
                ),
            },
        ],
        [isSuperAdmin, openEdit]
    );

    const linkedCampaignsCount = coachDetail?.campaigns.length ?? 0;
    const canConfirmDelete = isSuperAdmin && deleteTarget !== null && linkedCampaignsCount === 0 && !detailLoading;

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, sm: 3, md: 4 } }}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    mb: 4,
                    gap: 2,
                }}
            >
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main' }}>
                        Coachs
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        {isSuperAdmin
                            ? 'Visualisez les coachs existants et gérez vos nouveaux utilisateurs.'
                            : 'Consultez et modifiez votre profil coach.'}
                    </Typography>
                </Box>
                {isSuperAdmin ? <CoachForm /> : null}
            </Box>

            <DataTable
                data={filteredData}
                columns={columns}
                isLoading={isLoading}
                minWidth={640}
                cardSx={{ boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}
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
                            placeholder="Username ou nom affiché…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search size={18} />
                                    </InputAdornment>
                                ),
                                sx: { borderRadius: 2, bgcolor: 'background.default' },
                            }}
                            sx={{ width: { xs: '100%', md: 360 } }}
                        />
                    </Box>
                }
                afterRows={
                    <>
                        {!isLoading && (coaches?.length ?? 0) === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    align="center"
                                    sx={{ py: 6, color: 'text.secondary' }}
                                >
                                    Aucun coach enregistré pour le moment.
                                </TableCell>
                            </TableRow>
                        ) : null}
                        {!isLoading && (coaches?.length ?? 0) > 0 && filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    align="center"
                                    sx={{ py: 6, color: 'text.secondary' }}
                                >
                                    Aucun coach ne correspond à « {searchQuery} ».
                                </TableCell>
                            </TableRow>
                        ) : null}
                    </>
                }
            />

            <Dialog
                open={editOpen}
                onClose={closeEdit}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    },
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, pb: 1, pt: 3, px: 3, color: 'primary.main' }}>
                    Modifier le coach
                </DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <TextField
                            label="Username"
                            fullWidth
                            required
                            value={formUsername}
                            onChange={e => setFormUsername(e.target.value)}
                        />
                        <TextField
                            label="Nom affiché"
                            fullWidth
                            required
                            value={formDisplayName}
                            onChange={e => setFormDisplayName(e.target.value)}
                        />
                        <TextField
                            label="Nouveau mot de passe (optionnel)"
                            type="password"
                            fullWidth
                            value={formPassword}
                            onChange={e => setFormPassword(e.target.value)}
                            autoComplete="new-password"
                            helperText="Laissez vide pour ne pas changer le mot de passe."
                        />
                        {isSuperAdmin ? (
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={formIsActive}
                                        onChange={e => setFormIsActive(e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label="Compte actif"
                            />
                        ) : null}
                        {detailLoading && editOpen ? (
                            <Typography variant="body2" color="text.secondary">
                                Chargement des campagnes liées…
                            </Typography>
                        ) : null}
                        {!detailLoading && coachDetail && editOpen ? (
                            <Box>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                                    Campagnes liées ({coachDetail.campaigns.length})
                                </Typography>
                                {coachDetail.campaigns.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary">
                                        Aucune campagne.
                                    </Typography>
                                ) : (
                                    <Stack spacing={0.5}>
                                        {coachDetail.campaigns.slice(0, 8).map(camp => (
                                            <Typography key={camp.id} variant="body2">
                                                <Link
                                                    to="/admin/campaigns/$campaignId"
                                                    params={{ campaignId: String(camp.id) }}
                                                    style={{ color: 'inherit', fontWeight: 600 }}
                                                >
                                                    {camp.name}
                                                </Link>
                                            </Typography>
                                        ))}
                                        {coachDetail.campaigns.length > 8 ? (
                                            <Typography variant="caption" color="text.secondary">
                                                … et {coachDetail.campaigns.length - 8} autre(s)
                                            </Typography>
                                        ) : null}
                                    </Stack>
                                )}
                            </Box>
                        ) : null}
                        {formError ? (
                            <Alert severity="error" sx={{ borderRadius: 2 }}>
                                {formError}
                            </Alert>
                        ) : null}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
                    <Button onClick={closeEdit} color="inherit" variant="outlined" sx={{ borderColor: 'divider' }}>
                        Annuler
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        disabled={
                            updateCoach.isPending || formUsername.trim().length < 3 || formDisplayName.trim().length < 2
                        }
                        onClick={handleSaveCoach}
                        sx={{ fontWeight: 700 }}
                    >
                        {updateCoach.isPending ? 'Enregistrement…' : 'Enregistrer'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={deleteTarget !== null}
                onClose={() => !deleteCoach.isPending && setDeleteTarget(null)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: 'error.main' }}>Supprimer le coach ?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Le compte <strong>{deleteTarget?.displayName}</strong> ({deleteTarget?.username}) sera supprimé
                        définitivement. Cette action est irréversible.
                    </Typography>
                    {detailLoading ? (
                        <Typography variant="body2" color="text.secondary">
                            Vérification des campagnes liées…
                        </Typography>
                    ) : null}
                    {!detailLoading && linkedCampaignsCount > 0 ? (
                        <Alert severity="warning" sx={{ borderRadius: 2 }}>
                            Ce coach a encore {linkedCampaignsCount} campagne(s) : la suppression est bloquée côté
                            serveur. Supprimez ou réaffectez les campagnes d&apos;abord.
                        </Alert>
                    ) : null}
                    {deleteError ? (
                        <Alert severity="error" sx={{ borderRadius: 2, mt: 2 }}>
                            {deleteError}
                        </Alert>
                    ) : null}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteTarget(null)} disabled={deleteCoach.isPending} color="inherit">
                        Annuler
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        disabled={deleteCoach.isPending || !canConfirmDelete}
                        onClick={handleConfirmDelete}
                    >
                        {deleteCoach.isPending ? 'Suppression…' : 'Supprimer'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
