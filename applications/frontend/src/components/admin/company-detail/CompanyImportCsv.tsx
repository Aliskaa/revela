// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { Upload } from 'lucide-react';
import * as React from 'react';

import { useImportParticipantsToCompany } from '@/hooks/admin';
import {
    type ParticipantImportPreviewRow,
    buildParticipantImportPreview,
    parseSemicolonCsvText,
} from '@/lib/parseCsv';

export type CompanyImportCsvProps = {
    companyId: number;
    companyName: string;
};

type CsvPreviewState = {
    file: File;
    rows: ParticipantImportPreviewRow[];
    parseError: string | null;
};

export function CompanyImportCsv({ companyId, companyName }: CompanyImportCsvProps) {
    const importParticipants = useImportParticipantsToCompany();
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [preview, setPreview] = React.useState<CsvPreviewState | null>(null);

    const isImporting = importParticipants.isPending;
    const validCount = preview?.rows.filter(r => r.valid).length ?? 0;
    const invalidCount = (preview?.rows.length ?? 0) - validCount;

    const resetFileInput = () => {
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            const rows = parseSemicolonCsvText(text);
            const built = buildParticipantImportPreview(rows);
            setPreview({
                file,
                rows: built,
                parseError:
                    built.length === 0
                        ? 'Le fichier est vide ou ne contient pas d’en-tête (séparateur attendu : « ; »).'
                        : null,
            });
        } catch (err) {
            setPreview({
                file,
                rows: [],
                parseError: err instanceof Error ? err.message : 'Impossible de lire le fichier.',
            });
        }
    };

    const handleCancel = () => {
        setPreview(null);
        resetFileInput();
    };

    const handleConfirm = () => {
        if (!preview) return;
        const formData = new FormData();
        formData.append('file', preview.file);
        importParticipants.mutate(
            { companyId, formData },
            {
                onSettled: resetFileInput,
                onSuccess: () => setPreview(null),
            }
        );
    };

    return (
        <>
            <input ref={fileInputRef} type="file" accept=".csv" hidden onChange={handleFileChange} />
            <Button
                variant="outlined"
                startIcon={<Upload size={16} />}
                disabled={isImporting}
                onClick={() => fileInputRef.current?.click()}
                sx={{ borderRadius: 3, flexShrink: 0 }}
            >
                {isImporting ? 'Import en cours…' : 'Importer un CSV'}
            </Button>

            <Dialog
                open={preview !== null}
                onClose={isImporting ? undefined : handleCancel}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Confirmer l'import</DialogTitle>
                <DialogContent dividers>
                    {preview?.parseError ? (
                        <Alert severity="error">{preview.parseError}</Alert>
                    ) : (
                        <Stack spacing={1.5}>
                            <DialogContentText>
                                Fichier <strong>{preview?.file.name}</strong> — {preview?.rows.length ?? 0} ligne(s)
                                détectée(s) ({validCount} valide(s)
                                {invalidCount > 0 ? `, ${invalidCount} ignorée(s)` : ''}). Tous les participants
                                valides seront rattachés à <strong>{companyName}</strong>.
                            </DialogContentText>
                            <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
                                <Table size="small" stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Ligne</TableCell>
                                            <TableCell>Prénom</TableCell>
                                            <TableCell>Nom</TableCell>
                                            <TableCell>Email</TableCell>
                                            <TableCell>Statut</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {preview?.rows.map(row => (
                                            <TableRow
                                                key={`${row.line}-${row.email}`}
                                                sx={!row.valid ? { bgcolor: 'tint.warningBg' } : undefined}
                                            >
                                                <TableCell>{row.line}</TableCell>
                                                <TableCell>{row.firstName || '—'}</TableCell>
                                                <TableCell>{row.lastName || '—'}</TableCell>
                                                <TableCell>{row.email || '—'}</TableCell>
                                                <TableCell>
                                                    {row.valid ? (
                                                        <Typography variant="caption" color="success.main">
                                                            OK
                                                        </Typography>
                                                    ) : (
                                                        <Typography variant="caption" color="warning.main">
                                                            {row.error}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancel} disabled={isImporting}>
                        Annuler
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        variant="contained"
                        disableElevation
                        disabled={isImporting || preview?.parseError !== null || validCount === 0}
                    >
                        {isImporting
                            ? 'Import en cours…'
                            : `Importer ${validCount} participant${validCount > 1 ? 's' : ''}`}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
