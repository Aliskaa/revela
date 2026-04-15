import { downloadAdminBlob } from '@/api/downloads';
import type { AdminResponse } from '@/api/types';
import { DataTable } from '@/components/common/DataTable';
import { useAdminResponses, useDeleteResponse } from '@/hooks/admin';
import { useAdminQuestionnaires } from '@/hooks/questionnaires';
import {
    Alert,
    Box,
    Button,
    Chip,
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
import { type ColumnDef, type SortingState, getFilteredRowModel, getSortedRowModel } from '@tanstack/react-table';
import { AlertCircle, ChevronRight, Download, Eye, FileText, Filter, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

const ERASE_CONFIRM_PHRASE = 'SUPPRIMER';

// Thème des questionnaires pour harmoniser avec le tableau de bord
const QID_THEME: Record<string, { bg: string; text: string }> = {
    B: { bg: 'rgba(21, 21, 176, 0.08)', text: '#1515B0' },
    F: { bg: '#f0fdf4', text: '#166534' },
    S: { bg: '#fffbeb', text: '#b45309' },
    C: { bg: '#f5f3ff', text: '#6d28d9' },
};

type SearchParams = { qid?: string; campaignId?: number };

export const Route = createFileRoute('/admin/responses')({
    validateSearch: (search: Record<string, unknown>): SearchParams => {
        const rawCampaignId = search.campaignId ?? search.campaign_id;
        const parsedCampaignId =
            typeof rawCampaignId === 'number'
                ? rawCampaignId
                : typeof rawCampaignId === 'string' && rawCampaignId.trim().length > 0
                  ? Number.parseInt(rawCampaignId, 10)
                  : undefined;
        return {
            qid: search.qid as string | undefined,
            campaignId: Number.isFinite(parsedCampaignId) ? parsedCampaignId : undefined,
        };
    },
    component: AdminResponsesPage,
});

function AdminResponsesPage() {
    const search = Route.useSearch();
    const [selectedQid, setSelectedQid] = useState<string>(search.qid ?? '');
    const selectedCampaignId = search.campaignId;
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState<SortingState>([{ id: 'submitted_at', desc: true }]);
    const [page, setPage] = useState(1);
    const [eraseRow, setEraseRow] = useState<AdminResponse | null>(null);
    const [eraseConfirmText, setEraseConfirmText] = useState('');
    const [exportLoading, setExportLoading] = useState(false);

    const { data: questionnaires } = useAdminQuestionnaires();
    const { data, isLoading } = useAdminResponses(selectedQid || undefined, page, 50, selectedCampaignId);
    const deleteMut = useDeleteResponse();

    const columns = useMemo<ColumnDef<AdminResponse>[]>(
        () => [
            {
                accessorKey: 'name',
                header: 'Participant',
                cell: ({ row }) => (
                    <Box>
                        <Typography variant="body2" fontWeight={700} color="text.primary">
                            {row.original.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                            {row.original.email}
                        </Typography>
                    </Box>
                ),
            },
            {
                accessorKey: 'organisation',
                header: 'Organisation',
                cell: ({ getValue }) => (
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        {(getValue() as string) || '—'}
                    </Typography>
                ),
            },
            {
                accessorKey: 'questionnaire_id',
                header: 'Type',
                cell: ({ getValue }) => {
                    const val = getValue() as string;
                    const theme = QID_THEME[val] || { bg: '#f3f4f6', text: '#4b5563' };
                    return (
                        <Chip
                            label={val}
                            size="small"
                            sx={{
                                bgcolor: theme.bg,
                                color: theme.text,
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                borderRadius: 1.5,
                                px: 0.5,
                            }}
                        />
                    );
                },
            },
            {
                accessorKey: 'submitted_at',
                header: 'Date de soumission',
                cell: ({ getValue }) => (
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        {new Date(getValue() as string).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                        })}
                    </Typography>
                ),
            },
            {
                id: 'actions',
                header: '',
                enableSorting: false,
                cell: ({ row }) => (
                    <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                        <Tooltip title="Ouvrir le rapport détaillé" placement="left">
                            <Link
                                to="/results/$qid/$responseId"
                                params={{ qid: row.original.questionnaire_id, responseId: String(row.original.id) }}
                                style={{ textDecoration: 'none' }}
                            >
                                <IconButton
                                    size="small"
                                    sx={{
                                        color: 'text.disabled',
                                        '&:hover': { color: 'primary.main', bgcolor: 'primary.lighter' },
                                    }}
                                >
                                    <Eye size={18} />
                                </IconButton>
                            </Link>
                        </Tooltip>
                        <Tooltip title="Supprimer (RGPD)">
                            <IconButton
                                size="small"
                                onClick={() => {
                                    setEraseRow(row.original);
                                    setEraseConfirmText('');
                                }}
                                sx={{
                                    color: 'text.disabled',
                                    '&:hover': { color: 'error.main', bgcolor: 'error.lighter' },
                                }}
                            >
                                <Trash2 size={16} />
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
            {/* En-tête de la page */}
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
                        <FileText size={28} />
                        Réponses
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Gérez et consultez les {data?.total ?? 0} soumissions de vos participants.
                    </Typography>
                    {selectedCampaignId && (
                        <Chip
                            label={`Filtre campagne actif : #${selectedCampaignId}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ mt: 1, fontWeight: 600 }}
                        />
                    )}
                </Box>

                {selectedQid && (
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<Download size={18} />}
                        disabled={exportLoading}
                        onClick={async () => {
                            if (!selectedQid) return;
                            setExportLoading(true);
                            try {
                                await downloadAdminBlob('/admin/export/responses', { qid: selectedQid });
                            } finally {
                                setExportLoading(false);
                            }
                        }}
                        sx={{ fontWeight: 600, boxShadow: 1 }}
                    >
                        {exportLoading ? "Génération de l'export…" : 'Exporter en CSV'}
                    </Button>
                )}
            </Stack>

            <DataTable
                data={data?.items ?? []}
                columns={columns}
                isLoading={isLoading}
                skeletonRowCount={5}
                minWidth={700}
                sortableHeaders
                cardSx={{ borderRadius: 2.5, boxShadow: '0 2px 10px rgba(0,0,0,0.02)', overflow: 'hidden' }}
                tableOptions={{
                    state: { sorting, globalFilter },
                    onSortingChange: setSorting,
                    onGlobalFilterChange: setGlobalFilter,
                    getSortedRowModel: getSortedRowModel(),
                    getFilteredRowModel: getFilteredRowModel(),
                    manualPagination: true,
                    pageCount: data?.pages ?? 1,
                }}
                toolbar={
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 2,
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                            <Filter size={18} />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', width: { xs: '100%', md: 'auto' } }}>
                            <FormControl size="small" sx={{ minWidth: 220, flexGrow: { xs: 1, sm: 0 } }}>
                                <InputLabel>Type de questionnaire</InputLabel>
                                <Select
                                    label="Type de questionnaire"
                                    value={selectedQid}
                                    onChange={e => {
                                        setSelectedQid(e.target.value);
                                        setPage(1);
                                    }}
                                    sx={{ borderRadius: 2 }}
                                >
                                    <MenuItem value="">
                                        <em>Tous les questionnaires</em>
                                    </MenuItem>
                                    {questionnaires?.map(q => (
                                        <MenuItem key={q.id} value={q.id}>
                                            {q.id} — {q.title.split('—')[1]?.trim() || q.title}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                size="small"
                                placeholder="Rechercher (nom, email)..."
                                value={globalFilter}
                                onChange={e => setGlobalFilter(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search size={18} />
                                        </InputAdornment>
                                    ),
                                    sx: { borderRadius: 2 },
                                }}
                                sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 280 } }}
                            />
                        </Box>
                    </Box>
                }
                afterRows={
                    !isLoading && (data?.items?.length ?? 0) === 0 ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} align="center" sx={{ py: 8 }}>
                                <FileText size={48} color="#e5e7eb" style={{ marginBottom: 16 }} />
                                <Typography variant="h6" color="text.primary" fontWeight={700} gutterBottom>
                                    Aucune réponse trouvée
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Modifiez vos filtres ou attendez que les participants soumettent leurs évaluations.
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

            {/* Modale de Suppression */}
            <Dialog
                open={!!eraseRow}
                onClose={() => !deleteMut.isPending && setEraseRow(null)}
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
                    Suppression définitive
                </DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    <Alert severity="error" sx={{ mb: 3, mt: 1, borderRadius: 2 }}>
                        La soumission du{' '}
                        <strong>{eraseRow && new Date(eraseRow.submitted_at).toLocaleDateString('fr-FR')}</strong> pour{' '}
                        <strong>{eraseRow?.name}</strong> ({eraseRow?.email}) et tous les scores associés seront
                        supprimés de manière irréversible. Les liens publics existants cesseront de fonctionner.
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
                            Veuillez taper <strong>{ERASE_CONFIRM_PHRASE}</strong> pour confirmer cette action :
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
                        <Alert severity="error" sx={{ mt: 2 }}>
                            Impossible de supprimer la réponse. Veuillez réessayer.
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
                    <Button
                        onClick={() => setEraseRow(null)}
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
                        disabled={deleteMut.isPending || eraseConfirmText.trim() !== ERASE_CONFIRM_PHRASE}
                        onClick={async () => {
                            if (!eraseRow) return;
                            await deleteMut.mutateAsync({ responseId: eraseRow.id });
                            setEraseRow(null);
                            setEraseConfirmText('');
                        }}
                        sx={{ fontWeight: 700 }}
                    >
                        {deleteMut.isPending ? 'Suppression en cours…' : 'Supprimer définitivement'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
