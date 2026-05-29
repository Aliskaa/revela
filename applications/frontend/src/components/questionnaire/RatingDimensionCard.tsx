import type { DimensionBlock } from '@/hooks/useBuildDimensions';
import { Card, CardContent, Chip, Stack, Typography } from '@mui/material';

import { RatingItemRow } from './RatingItemRow';
import { LIKERT_SHORT_LABEL } from './questionnaireScales';

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
                            return (
                                <RatingItemRow
                                    key={key}
                                    scoreKey={key}
                                    label={item.label}
                                    value={scores[key] ?? null}
                                    onScoreChange={onScoreChange}
                                    min={LIKERT_SHORT_LABEL.min}
                                    max={LIKERT_SHORT_LABEL.max}
                                    comment={comments?.[key]}
                                    onCommentChange={onCommentChange}
                                />
                            );
                        })}
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
};
