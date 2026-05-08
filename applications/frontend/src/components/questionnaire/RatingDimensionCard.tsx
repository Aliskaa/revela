import type { DimensionBlock } from '@/hooks/useBuildDimensions';
import { Box, Card, CardContent, Chip, IconButton, Stack, TextField, Tooltip, Typography } from '@mui/material';
import { Minus, Plus } from 'lucide-react';
import * as React from 'react';
import { RatingScale } from './RatingScale';

const MAX_COMMENT_LENGTH = 150;

type RatingDimensionCardProps = {
    block: DimensionBlock;
    scores: Record<string, number | null>;
    onScoreChange: (scoreKey: string, value: number) => void;
    chipLabel?: string;
    chipVariant?: 'primary' | 'secondary';
    /**
     * Optionnel : commentaires saisis par scoreKey (peer_rating uniquement).
     * Quand `comments` ET `onCommentChange` sont fournis, un bouton « + » apparaît
     * sous chaque note pour ouvrir un champ texte limité à 150 caractères.
     */
    comments?: Record<string, string>;
    onCommentChange?: (scoreKey: string, value: string) => void;
};

export const RatingDimensionCard = ({
    block,
    scores,
    onScoreChange,
    chipLabel = 'Regard sur soi',
    chipVariant = 'primary',
    comments,
    onCommentChange,
}: RatingDimensionCardProps) => {
    const commentsEnabled = comments !== undefined && onCommentChange !== undefined;
    const [openComments, setOpenComments] = React.useState<Record<string, boolean>>({});

    const chipSx =
        chipVariant === 'primary'
            ? { borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main' }
            : { borderRadius: 99, bgcolor: 'tint.secondaryBg', color: 'tint.secondaryText' };

    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                        <Typography variant="h6" fontWeight={800} color="text.primary">
                            {block.dimension}
                        </Typography>
                        <Chip label={chipLabel} size="small" sx={chipSx} />
                    </Stack>
                    <Stack spacing={1.5}>
                        {block.items.map(item => {
                            const key = String(item.scoreKey);
                            const commentValue = comments?.[key] ?? '';
                            // Le champ reste ouvert tant qu'un commentaire non vide est saisi
                            // (sécurité contre une fermeture accidentelle qui viderait le texte).
                            const isOpen = commentsEnabled && (openComments[key] === true || commentValue.length > 0);
                            return (
                                <Box
                                    key={key}
                                    sx={{ border: '1px solid', borderColor: 'border', borderRadius: 4, p: 1.8 }}
                                >
                                    <Stack spacing={1.4}>
                                        <Stack
                                            direction="row"
                                            justifyContent="space-between"
                                            spacing={2}
                                            alignItems="start"
                                        >
                                            <Typography
                                                variant="body2"
                                                fontWeight={700}
                                                color="text.primary"
                                                sx={{ lineHeight: 1.6 }}
                                            >
                                                {item.label}
                                            </Typography>
                                            <Chip
                                                label={scores[key] ?? '—'}
                                                size="small"
                                                sx={{
                                                    borderRadius: 99,
                                                    bgcolor: 'tint.secondaryBg',
                                                    color: 'tint.secondaryText',
                                                }}
                                            />
                                        </Stack>
                                        <RatingScale
                                            value={scores[key] ?? null}
                                            onChange={v => {
                                                if (v !== null) onScoreChange(key, v);
                                            }}
                                            ariaLabel={item.label}
                                        />
                                        {commentsEnabled && (
                                            <Stack spacing={1}>
                                                {!isOpen ? (
                                                    <Box>
                                                        <Tooltip title="Ajouter un commentaire (optionnel, 150 caractères max)">
                                                            <span>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() =>
                                                                        setOpenComments(prev => ({
                                                                            ...prev,
                                                                            [key]: true,
                                                                        }))
                                                                    }
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
                                                                    aria-label={`Ajouter un commentaire pour ${item.label}`}
                                                                >
                                                                    <Plus size={14} />
                                                                </IconButton>
                                                            </span>
                                                        </Tooltip>
                                                    </Box>
                                                ) : (
                                                    <Stack spacing={0.6}>
                                                        <TextField
                                                            value={commentValue}
                                                            onChange={e => {
                                                                const next = e.target.value.slice(
                                                                    0,
                                                                    MAX_COMMENT_LENGTH
                                                                );
                                                                onCommentChange?.(key, next);
                                                            }}
                                                            placeholder="Justifiez cette note (optionnel)"
                                                            multiline
                                                            minRows={2}
                                                            maxRows={4}
                                                            slotProps={{
                                                                htmlInput: { maxLength: MAX_COMMENT_LENGTH },
                                                            }}
                                                            size="small"
                                                            fullWidth
                                                        />
                                                        <Stack
                                                            direction="row"
                                                            justifyContent="space-between"
                                                            alignItems="center"
                                                        >
                                                            <Typography variant="caption" color="text.secondary">
                                                                {commentValue.length} / {MAX_COMMENT_LENGTH}
                                                            </Typography>
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => {
                                                                    onCommentChange?.(key, '');
                                                                    setOpenComments(prev => ({
                                                                        ...prev,
                                                                        [key]: false,
                                                                    }));
                                                                }}
                                                                aria-label={`Retirer le commentaire pour ${item.label}`}
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
                        })}
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
};
