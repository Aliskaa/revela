// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Chip, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { Minus, Plus } from 'lucide-react';
import * as React from 'react';

import { RatingScale } from './RatingScale';
import { LIKERT_SHORT_LABEL } from './questionnaireScales';

const MAX_COMMENT_LENGTH = 150;

export type RatingItemRowProps = {
    scoreKey: string;
    label: string;
    value: number | null;
    onScoreChange: (scoreKey: string, value: number) => void;
    min?: number;
    max?: number;
    /**
     * Commentaire courant (peer_rating). Sa seule présence (avec `onCommentChange`)
     * active le bouton « Ajouter un commentaire ».
     */
    comment?: string;
    onCommentChange?: (scoreKey: string, value: string) => void;
};

/**
 * Ligne d'item notée : libellé + pastille de note + échelle, plus un champ
 * commentaire optionnel. Factorise le rendu partagé entre la carte empilée
 * (`RatingDimensionCard`) et l'accordéon (`RatingDimensionAccordion`).
 */
export function RatingItemRow({
    scoreKey,
    label,
    value,
    onScoreChange,
    min = LIKERT_SHORT_LABEL.min,
    max = LIKERT_SHORT_LABEL.max,
    comment,
    onCommentChange,
}: RatingItemRowProps) {
    const commentsEnabled = onCommentChange !== undefined && comment !== undefined;
    const commentValue = comment ?? '';
    const [localOpen, setLocalOpen] = React.useState(false);
    // Le champ reste ouvert tant qu'un commentaire non vide est saisi (évite une
    // fermeture accidentelle qui viderait le texte).
    const isOpen = commentsEnabled && (localOpen || commentValue.length > 0);
    const hasValue = value !== null && value !== undefined;

    return (
        <Box
            sx={{
                border: '1px solid',
                borderColor: hasValue ? 'primary.main' : 'border',
                borderRadius: 2,
                p: 1.8,
                bgcolor: hasValue ? 'tint.primaryHover' : 'background.paper',
                transition: 'border-color 0.15s ease, background-color 0.15s ease',
            }}
        >
            <Stack spacing={1.4}>
                <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="start">
                    <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.6 }}>
                        {label}
                    </Typography>
                    <Chip
                        label={hasValue ? value : '—'}
                        size="small"
                        sx={{
                            borderRadius: 99,
                            fontWeight: 700,
                            bgcolor: hasValue ? 'tint.primaryBg' : 'tint.secondaryBg',
                            color: hasValue ? 'primary.main' : 'tint.secondaryText',
                        }}
                    />
                </Stack>
                <RatingScale
                    value={value ?? null}
                    onChange={v => {
                        if (v !== null) onScoreChange(scoreKey, v);
                    }}
                    min={min}
                    max={max}
                    ariaLabel={label}
                />
                {commentsEnabled && (
                    <Stack spacing={1}>
                        {!isOpen ? (
                            <Box>
                                <Tooltip title="Ajouter un commentaire (optionnel, 150 caractères max)">
                                    <span>
                                        <IconButton
                                            size="small"
                                            onClick={() => setLocalOpen(true)}
                                            sx={{
                                                border: '1px dashed',
                                                borderColor: 'border',
                                                borderRadius: 2,
                                                color: 'text.secondary',
                                                '&:hover': {
                                                    borderColor: 'primary.main',
                                                    color: 'primary.main',
                                                    bgcolor: 'tint.primaryBg',
                                                },
                                            }}
                                            aria-label={`Ajouter un commentaire pour ${label}`}
                                        >
                                            <Plus size={14} />
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 12 }}>
                                                Ajouter un commentaire
                                            </Typography>
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            </Box>
                        ) : (
                            <Stack spacing={0.6}>
                                <TextField
                                    value={commentValue}
                                    onChange={e => {
                                        const next = e.target.value.slice(0, MAX_COMMENT_LENGTH);
                                        onCommentChange?.(scoreKey, next);
                                    }}
                                    placeholder="Justifiez cette note (optionnel)"
                                    multiline
                                    minRows={2}
                                    maxRows={4}
                                    slotProps={{ htmlInput: { maxLength: MAX_COMMENT_LENGTH } }}
                                    size="small"
                                    fullWidth
                                />
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="caption" color="text.secondary">
                                        {commentValue.length} / {MAX_COMMENT_LENGTH}
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            onCommentChange?.(scoreKey, '');
                                            setLocalOpen(false);
                                        }}
                                        aria-label={`Retirer le commentaire pour ${label}`}
                                        sx={{ color: 'text.secondary' }}
                                    >
                                        <Minus size={14} />
                                    </IconButton>
                                </Stack>
                            </Stack>
                        )}
                    </Stack>
                )}
            </Stack>
        </Box>
    );
}
