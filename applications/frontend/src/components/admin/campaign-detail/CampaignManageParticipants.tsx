// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Chip,
    FormControlLabel,
    LinearProgress,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Skeleton,
    Stack,
    Typography,
} from '@mui/material';
import { Send, Upload } from 'lucide-react';
import * as React from 'react';

import { SectionTitle } from '@/components/common/SectionTitle';
import { useImportParticipantsToCampaign, useInviteCampaignParticipants, useParticipants } from '@/hooks/admin';
import type { AdminCampaign } from '@aor/types';

export type CampaignManageParticipantsProps = {
    campaign: AdminCampaign;
    /**
     * Set des participantId déjà invités (ou ayant rejoint) cette campagne. Calculé par
     * le parent à partir de `participant_progress` pour pré-griser les checkboxes.
     */
    alreadyInvitedIds: ReadonlySet<number>;
};

export function CampaignManageParticipants({ campaign, alreadyInvitedIds }: CampaignManageParticipantsProps) {
    const inviteParticipants = useInviteCampaignParticipants();
    const importParticipants = useImportParticipantsToCampaign();
    const { data: companyParticipants, isLoading: participantsLoading } = useParticipants(1, campaign.companyId, 200);

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [csvFileName, setCsvFileName] = React.useState<string | null>(null);
    const [selectedIds, setSelectedIds] = React.useState<ReadonlySet<number>>(() => new Set());

    const isArchived = campaign.status === 'archived';
    const isImporting = importParticipants.isPending;
    const items = companyParticipants?.items ?? [];

    // Participants invitables = ceux de l'entreprise pas encore invités sur cette campagne.
    const invitableItems = items.filter(p => !alreadyInvitedIds.has(p.id));
    const invitableIds = React.useMemo(() => new Set(invitableItems.map(p => p.id)), [invitableItems]);

    // Nettoie la sélection des IDs disparus ou désormais invités (après refresh de la liste).
    React.useEffect(() => {
        setSelectedIds(prev => {
            const next = new Set<number>();
            for (const id of prev) {
                if (invitableIds.has(id)) {
                    next.add(id);
                }
            }
            return next.size === prev.size ? prev : next;
        });
    }, [invitableIds]);

    const allSelected = invitableIds.size > 0 && selectedIds.size === invitableIds.size;
    const someSelected = selectedIds.size > 0 && !allSelected;

    const toggleOne = (id: number) =>
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });

    const toggleAll = () => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(invitableIds));
        }
    };

    const handleInvite = () => {
        if (selectedIds.size === 0) {
            return;
        }
        inviteParticipants.mutate(
            { campaignId: campaign.id, participantIds: [...selectedIds] },
            {
                onSuccess: () => {
                    setSelectedIds(new Set());
                },
            }
        );
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }
        setCsvFileName(file.name);
        const formData = new FormData();
        formData.append('file', file);
        importParticipants.mutate(
            { campaignId: campaign.id, formData },
            {
                onSettled: () => {
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                },
                onSuccess: () => {
                    setCsvFileName(null);
                },
            }
        );
    };

    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
                <SectionTitle
                    title="Inviter des participants"
                    subtitle="Sélectionnez les participants de l'entreprise à inviter, ou importez un CSV."
                />

                <Stack spacing={1.5} sx={{ mt: 1 }}>
                    {participantsLoading ? (
                        <Stack spacing={1}>
                            <Skeleton variant="rounded" height={32} />
                            <Skeleton variant="rounded" height={32} />
                            <Skeleton variant="rounded" height={32} />
                        </Stack>
                    ) : items.length === 0 ? (
                        <Box sx={{ borderRadius: 3, bgcolor: 'tint.subtleBg', p: 1.8, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                Aucun participant rattaché à l'entreprise. Importez un CSV pour commencer.
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ pl: 0.5 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={allSelected}
                                            indeterminate={someSelected}
                                            onChange={toggleAll}
                                            disabled={invitableIds.size === 0 || isArchived}
                                        />
                                    }
                                    label={
                                        <Typography variant="body2" fontWeight={600}>
                                            {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                                        </Typography>
                                    }
                                />
                                <Typography variant="caption" color="text.secondary">
                                    {selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''} /{' '}
                                    {invitableIds.size} disponible{invitableIds.size > 1 ? 's' : ''}
                                </Typography>
                            </Stack>

                            <List
                                dense
                                disablePadding
                                sx={{
                                    maxHeight: 320,
                                    overflowY: 'auto',
                                    border: '1px solid',
                                    borderColor: 'border',
                                    borderRadius: 3,
                                }}
                            >
                                {items.map(p => {
                                    const alreadyInvited = alreadyInvitedIds.has(p.id);
                                    const checked = selectedIds.has(p.id);
                                    const disabled = alreadyInvited || isArchived;
                                    return (
                                        <ListItem
                                            key={p.id}
                                            disablePadding
                                            sx={{
                                                borderBottom: '1px solid',
                                                borderBottomColor: 'border',
                                                '&:last-of-type': { borderBottom: 'none' },
                                            }}
                                            secondaryAction={
                                                alreadyInvited ? (
                                                    <Chip
                                                        label="Déjà invité"
                                                        size="small"
                                                        sx={{
                                                            borderRadius: 99,
                                                            bgcolor: 'tint.successBg',
                                                            color: 'tint.successText',
                                                            fontWeight: 600,
                                                        }}
                                                    />
                                                ) : null
                                            }
                                        >
                                            <ListItemButton
                                                onClick={() => {
                                                    if (!disabled) toggleOne(p.id);
                                                }}
                                                disabled={disabled}
                                                dense
                                                sx={{ py: 0.5, px: 1.5, opacity: alreadyInvited ? 0.6 : 1 }}
                                            >
                                                <ListItemIcon sx={{ minWidth: 36 }}>
                                                    <Checkbox
                                                        edge="start"
                                                        size="small"
                                                        checked={checked}
                                                        tabIndex={-1}
                                                        disableRipple
                                                        disabled={disabled}
                                                    />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        <Typography fontWeight={600} color="text.primary">
                                                            {p.full_name}
                                                        </Typography>
                                                    }
                                                    secondary={p.email}
                                                    slotProps={{ secondary: { sx: { color: 'text.secondary' } } }}
                                                />
                                            </ListItemButton>
                                        </ListItem>
                                    );
                                })}
                            </List>
                        </>
                    )}

                    <Button
                        variant="contained"
                        disableElevation
                        startIcon={<Send size={16} />}
                        disabled={inviteParticipants.isPending || isArchived || selectedIds.size === 0}
                        onClick={handleInvite}
                        sx={{ borderRadius: 3, mt: 1 }}
                    >
                        {inviteParticipants.isPending
                            ? 'Envoi…'
                            : selectedIds.size === 0
                              ? 'Inviter les sélectionnés'
                              : `Inviter (${selectedIds.size})`}
                    </Button>

                    <input ref={fileInputRef} type="file" accept=".csv" hidden onChange={handleFileChange} />
                    <Button
                        variant="outlined"
                        startIcon={<Upload size={16} />}
                        disabled={isImporting || isArchived}
                        onClick={() => fileInputRef.current?.click()}
                        sx={{ borderRadius: 3 }}
                    >
                        {isImporting ? 'Import en cours…' : 'Importer un CSV'}
                    </Button>
                    {isImporting && csvFileName && (
                        // biome-ignore lint/a11y/useSemanticElements: role="status" sur Box volontaire — pas de progress numérique à exposer via <output>.
                        <Box
                            role="status"
                            aria-live="polite"
                            aria-busy="true"
                            sx={{ borderRadius: 3, bgcolor: 'tint.subtleBg', p: 1.5 }}
                        >
                            <Typography variant="caption" color="text.secondary">
                                Lecture & invitation des participants
                            </Typography>
                            <Typography
                                variant="body2"
                                fontWeight={700}
                                color="text.primary"
                                sx={{
                                    mt: 0.4,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {csvFileName}
                            </Typography>
                            <LinearProgress
                                aria-label="Import du fichier CSV"
                                sx={{
                                    mt: 1,
                                    height: 6,
                                    borderRadius: 99,
                                    bgcolor: 'tint.subtleBg',
                                    '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' },
                                }}
                            />
                        </Box>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
}
