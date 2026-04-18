import type { DimensionBlock } from '@/hooks/useBuildDimensions';
import { RatingScale } from './RatingScale';
import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';

type RatingDimensionCardProps = {
    block: DimensionBlock;
    scores: Record<string, number | null>;
    onScoreChange: (scoreKey: string, value: number) => void;
    chipLabel?: string;
    chipVariant?: 'primary' | 'secondary';
};

export const RatingDimensionCard = ({
    block,
    scores,
    onScoreChange,
    chipLabel = 'Auto-évaluation',
    chipVariant = 'primary',
}: RatingDimensionCardProps) => {
    const chipSx = chipVariant === 'primary'
        ? { borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main' }
        : { borderRadius: 99, bgcolor: 'tint.secondaryBg', color: 'tint.secondaryText' };

    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                        <Typography variant="h6" fontWeight={800} color="text.primary">{block.dimension}</Typography>
                        <Chip label={chipLabel} size="small" sx={chipSx} />
                    </Stack>
                    <Stack spacing={1.5}>
                        {block.items.map(item => {
                            const key = String(item.scoreKey);
                            return (
                                <Box key={key} sx={{ border: '1px solid', borderColor: 'border', borderRadius: 4, p: 1.8 }}>
                                    <Stack spacing={1.4}>
                                        <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="start">
                                            <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.6 }}>{item.label}</Typography>
                                            <Chip label={scores[key] ?? '—'} size="small" sx={{ borderRadius: 99, bgcolor: 'tint.secondaryBg', color: 'tint.secondaryText' }} />
                                        </Stack>
                                        <RatingScale value={scores[key] ?? null} onChange={v => { if (v !== null) onScoreChange(key, v); }} />
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
