import { downloadAdminBlob } from '@/api/downloads';
import type { Company } from '@/api/types';
import { DataTable } from '@/components/common/DataTable';
import CompanyForm, { type CompanyFormHandle } from '@/components/company/form';
import { useCompanies, useDeleteCompany, useUpdateCompany } from '@/hooks/admin';
import { useAdminQuestionnaires } from '@/hooks/questionnaires';
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TableCell,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { Link, createFileRoute } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { Building2, Download, Filter, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

export const Route = createFileRoute('/admin/companies/')({
    component: AdminCompaniesPage,
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

function AdminCompaniesPage() {
    const { data, isLoading } = useCompanies();
    const { data: questionnaires } = useAdminQuestionnaires();
    const updateCompany = useUpdateCompany();
    const deleteCompany = useDeleteCompany();
    const companyFormRef = useRef<CompanyFormHandle>(null);

    // États de l'export
    const [exportCompany, setExportCompany] = useState<Company | null>(null);
    const [exportQid, setExportQid] = useState('');
    const [exportLoading, setExportLoading] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [companyFormOpen, setCompanyFormOpen] = useState(false);
    const [editingCompanyId, setEditingCompanyId] = useState<number | null>(null);
    const [formName, setFormName] = useState('');
    const [formContactName, setFormContactName] = useState('');
    const [formContactEmail, setFormContactEmail] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    // Filtrage des données
    const filteredData = useMemo(() => {
        if (!data) return [];
        if (!searchQuery.trim()) return data;
        const lowerQuery = searchQuery.toLowerCase();
        return data.filter(c => c.name.toLowerCase().includes(lowerQuery));
    }, [data, searchQuery]);

    const columns = useMemo<ColumnDef<Company>[]>(
        () => [
            {
                accessorKey: 'name',
                header: 'Entreprise',
                cell: ({ row }) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                            sx={{
                                p: 1.2,
                                borderRadius: 2,
                                bgcolor: 'rgba(21, 21, 176, 0.08)', // primary main avec opacité
                                color: 'primary.main',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Building2 size={20} />
                        </Box>
                        <Typography variant="body1" fontWeight={700} sx={{ color: 'text.primary' }}>
                            {row.original.name}
                        </Typography>
                    </Box>
                ),
            },
            {
                id: 'contact',
                header: 'Contact Principal',
                cell: ({ row }) => {
                    const c = row.original;
                    if (!c.contact_name && !c.contact_email) {
                        return (
                            <Typography variant="body2" color="text.disabled" fontStyle="italic">
                                Non renseigné
                            </Typography>
                        );
                    }
                    return (
                        <Box>
                            {c.contact_name && (
                                <Typography variant="body2" fontWeight={600} color="text.primary">
                                    {c.contact_name}
                                </Typography>
                            )}
                            {c.contact_email && (
                                <Typography variant="caption" color="text.secondary">
                                    {c.contact_email}
                                </Typography>
                            )}
                        </Box>
                    );
                },
            },
            {
                accessorKey: 'participant_count',
                header: 'Participants',
                cell: ({ getValue }) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Users size={16} className="text-secondary" color="#6b7280" />
                        <Typography variant="body2" fontWeight={700} color="primary.main">
                            {getValue() as number}
                        </Typography>
                    </Box>
                ),
            },
            {
                id: 'actions',
                header: '',
                cell: ({ row }) => (
                    <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
                        <Tooltip title="Modifier">
                            <IconButton
                                size="small"
                                onClick={() => {
                                    setEditingCompanyId(row.original.id);
                                    setFormName(row.original.name);
                                    setFormContactName(row.original.contact_name ?? '');
                                    setFormContactEmail(row.original.contact_email ?? '');
                                    setFormError(null);
                                    setCompanyFormOpen(true);
                                }}
                                sx={{
                                    color: 'text.disabled',
                                    '&:hover': { color: 'primary.main', bgcolor: 'primary.lighter' },
                                }}
                            >
                                <Pencil size={18} />
                            </IconButton>
                        </Tooltip>
                        <Link
                            to="/admin/participants"
                            search={{ companyId: row.original.id }}
                            style={{ textDecoration: 'none' }}
                        >
                            <Tooltip title="Voir les participants">
                                <IconButton
                                    size="small"
                                    sx={{
                                        color: 'text.disabled',
                                        '&:hover': { color: 'primary.main', bgcolor: 'primary.lighter' },
                                    }}
                                >
                                    <Users size={18} />
                                </IconButton>
                            </Tooltip>
                        </Link>
                        <Tooltip title="Export">
                            <IconButton
                                size="small"
                                onClick={() => {
                                    setExportCompany(row.original);
                                    setExportQid('');
                                    setExportError(null);
                                }}
                                sx={{
                                    color: 'text.disabled',
                                    '&:hover': { color: 'primary.main', bgcolor: 'primary.lighter' },
                                }}
                            >
                                <Download size={18} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Supprimer (RGPD)">
                            <IconButton
                                size="small"
                                onClick={() => {
                                    setDeleteTarget(row.original);
                                    setDeleteError(null);
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

    const closeCompanyForm = () => {
        setCompanyFormOpen(false);
        setEditingCompanyId(null);
        setFormError(null);
    };

    const openCreateCompany = () => {
        companyFormRef.current?.open();
    };

    const handleSaveCompany = async () => {
        if (editingCompanyId === null) {
            return;
        }
        setFormError(null);
        try {
            await updateCompany.mutateAsync({
                companyId: editingCompanyId,
                name: formName.trim(),
                contactName: formContactName.trim() || null,
                contactEmail: formContactEmail.trim() || null,
            });
            closeCompanyForm();
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
            await deleteCompany.mutateAsync({ companyId: deleteTarget.id });
            setDeleteTarget(null);
        } catch (e) {
            setDeleteError(readApiError(e));
        }
    };

    async function handleExportAnonymized() {
        if (!exportCompany || !exportQid) return;
        setExportLoading(true);
        setExportError(null);
        try {
            await downloadAdminBlob('/admin/export/responses/anonymized', {
                qid: exportQid,
                company_id: exportCompany.id,
            });
            setExportCompany(null);
        } catch {
            setExportError('Échec du téléchargement. Vérifiez le questionnaire et votre session.');
        } finally {
            setExportLoading(false);
        }
    }

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, sm: 3, md: 4 } }}>
            {/* En-tête avec barre de recherche */}
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', md: 'flex-end' }}
                spacing={3}
                sx={{ mb: 4 }}
            >
                <Box>
                    <Typography variant="h4" fontWeight={800} sx={{ color: 'primary.main', mb: 0.5 }}>
                        Entreprises
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Gérez vos {data?.length ?? 0} entreprise{(data?.length ?? 0) > 1 ? 's' : ''} clientes et
                        exportez les données anonymisées.
                    </Typography>
                </Box>
                <CompanyForm ref={companyFormRef} />
            </Stack>

            <DataTable
                data={filteredData}
                columns={columns}
                isLoading={isLoading}
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
                            placeholder="Rechercher une entreprise..."
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
                            sx={{ width: { xs: '100%', md: 400 } }}
                        />
                    </Box>
                }
                afterRows={
                    <>
                        {!isLoading && (data?.length ?? 0) === 0 && (
                            <TableRow>
                                <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                                    <Building2 size={48} color="#e5e7eb" style={{ marginBottom: 16 }} />
                                    <Typography variant="h6" color="text.primary" fontWeight={700} gutterBottom>
                                        Aucune entreprise
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Importez un fichier CSV de participants contenant une colonne{' '}
                                        <code>company_name</code> pour créer votre première entreprise, ou utilisez le
                                        bouton « Nouvelle entreprise ».
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<Plus size={18} />}
                                        onClick={openCreateCompany}
                                    >
                                        Nouvelle entreprise
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )}
                        {!isLoading && (data?.length ?? 0) > 0 && filteredData.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                                    <Search size={48} color="#e5e7eb" style={{ marginBottom: 16 }} />
                                    <Typography variant="body1" color="text.secondary">
                                        Aucune entreprise ne correspond à "<strong>{searchQuery}</strong>".
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </>
                }
            />

            <Dialog
                open={companyFormOpen}
                onClose={closeCompanyForm}
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
                    {"Modifier l'entreprise"}
                </DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <TextField
                            label="Nom"
                            fullWidth
                            required
                            value={formName}
                            onChange={e => setFormName(e.target.value)}
                        />
                        <TextField
                            label="Contact principal (nom)"
                            fullWidth
                            value={formContactName}
                            onChange={e => setFormContactName(e.target.value)}
                        />
                        <TextField
                            label="Contact principal (e-mail)"
                            fullWidth
                            type="email"
                            value={formContactEmail}
                            onChange={e => setFormContactEmail(e.target.value)}
                        />
                        {formError && (
                            <Alert severity="error" sx={{ borderRadius: 2 }}>
                                {formError}
                            </Alert>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
                    <Button
                        onClick={closeCompanyForm}
                        color="inherit"
                        variant="outlined"
                        sx={{ borderColor: 'divider' }}
                    >
                        Annuler
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        disabled={updateCompany.isPending || formName.trim().length === 0}
                        onClick={handleSaveCompany}
                        sx={{ fontWeight: 700 }}
                    >
                        {updateCompany.isPending ? 'Enregistrement…' : 'Enregistrer'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={!!deleteTarget}
                onClose={() => !deleteCompany.isPending && setDeleteTarget(null)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: 'error.main' }}>{"Supprimer l'entreprise ?"}</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        L&apos;entreprise <strong>{deleteTarget?.name}</strong> sera supprimée définitivement, ainsi que
                        toutes ses campagnes. Les réponses déjà enregistrées sont conservées, sans lien vers une
                        campagne. Impossible tant qu&apos;il reste des participants rattachés à cette entreprise.
                    </Typography>
                    {deleteError && (
                        <Alert severity="error" sx={{ borderRadius: 2 }}>
                            {deleteError}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteTarget(null)} disabled={deleteCompany.isPending} color="inherit">
                        Annuler
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        disabled={deleteCompany.isPending}
                        onClick={handleConfirmDelete}
                    >
                        {deleteCompany.isPending ? 'Suppression…' : 'Supprimer'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Modale d'export */}
            <Dialog
                open={!!exportCompany}
                onClose={() => !exportLoading && setExportCompany(null)}
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
                    Export anonymisé — {exportCompany?.name}
                </DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    <Alert
                        severity="info"
                        sx={{ mb: 3, mt: 1, borderRadius: 2, '& .MuiAlert-message': { fontWeight: 500 } }}
                    >
                        Le fichier CSV généré contiendra uniquement un numéro de ligne, la date de soumission et les
                        scores finaux. <strong>Aucune donnée nominative</strong> (nom, email) ne sera incluse.
                    </Alert>

                    <Box sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: 'text.primary' }}>
                            Sélectionnez la source des données :
                        </Typography>
                        <FormControl fullWidth size="medium">
                            <InputLabel>Questionnaire cible</InputLabel>
                            <Select
                                label="Questionnaire cible"
                                value={exportQid}
                                onChange={e => setExportQid(e.target.value)}
                                sx={{ borderRadius: 2 }}
                            >
                                <MenuItem value="" disabled>
                                    <em>Choisir un questionnaire...</em>
                                </MenuItem>
                                {questionnaires?.map(q => (
                                    <MenuItem key={q.id} value={q.id} sx={{ py: 1.5 }}>
                                        <Box>
                                            <Typography variant="body2" fontWeight={700}>
                                                {q.title}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                ID: {q.id}
                                            </Typography>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>

                    {exportError && (
                        <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
                            {exportError}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
                    <Button
                        onClick={() => setExportCompany(null)}
                        disabled={exportLoading}
                        color="inherit"
                        variant="outlined"
                        sx={{ borderColor: 'divider' }}
                    >
                        Annuler
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Download size={18} />}
                        disabled={!exportQid || exportLoading}
                        onClick={handleExportAnonymized}
                        sx={{ fontWeight: 700 }}
                    >
                        {exportLoading ? 'Génération en cours...' : 'Télécharger le fichier'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
