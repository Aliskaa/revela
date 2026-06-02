// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { DimensionBlock } from '@/hooks/useBuildDimensions';
import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, Stack, Typography } from '@mui/material';
import { Check, ChevronDown } from 'lucide-react';
import * as React from 'react';

import { RatingItemRow } from './RatingItemRow';
import { LIKERT_SHORT_LABEL } from './questionnaireScales';

export type RatingDimensionAccordionProps = {
    dimensions: DimensionBlock[];
    scores: Record<string, number | null>;
    onScoreChange: (scoreKey: string, value: number) => void;
    min?: number;
    max?: number;
    /** Commentaires par scoreKey (peer_rating). Active le champ commentaire si `onCommentChange` est fourni. */
    comments?: Record<string, string>;
    onCommentChange?: (scoreKey: string, value: string) => void;
};

const filledInBlock = (block: DimensionBlock, scores: Record<string, number | null>): number =>
    block.items.filter(item => {
        const value = scores[String(item.scoreKey)];
        return value !== null && value !== undefined;
    }).length;

/**
 * Liste des dimensions sous forme d'accordéon : une seule dimension ouverte à la fois,
 * compteur de progression par dimension, coche de complétion et auto-avance douce vers
 * la dimension suivante non terminée. Conserve la vue d'ensemble (toutes les dimensions
 * restent visibles, repliées) tout en réduisant la charge cognitive.
 */
export function RatingDimensionAccordion({
    dimensions,
    scores,
    onScoreChange,
    min = LIKERT_SHORT_LABEL.min,
    max = LIKERT_SHORT_LABEL.max,
    comments,
    onCommentChange,
}: RatingDimensionAccordionProps) {
    const [expanded, setExpanded] = React.useState<string | false>(dimensions[0]?.dimension ?? false);

    const handleChange = (dimension: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpanded(isExpanded ? dimension : false);
    };

    const handleScoreChange = (block: DimensionBlock) => (scoreKey: string, value: number) => {
        const prevFilled = filledInBlock(block, scores);
        onScoreChange(scoreKey, value);

        // Auto-avance douce : uniquement lors de la transition incomplet → complet,
        // jamais lors de la ré-édition d'une dimension déjà terminée.
        const total = block.items.length;
        const wasIncomplete = prevFilled < total;
        const nowComplete =
            block.items.every(item => {
                const key = String(item.scoreKey);
                return key === scoreKey ? true : scores[key] !== null && scores[key] !== undefined;
            }) && total > 0;

        if (wasIncomplete && nowComplete) {
            const currentIndex = dimensions.findIndex(d => d.dimension === block.dimension);
            const nextIncomplete = dimensions
                .slice(currentIndex + 1)
                .find(d => filledInBlock(d, scores) < d.items.length);
            if (nextIncomplete) {
                setExpanded(nextIncomplete.dimension);
            } else {
                setExpanded(false);
            }
        }
    };

    return (
        <Stack spacing={2.5}>
            {dimensions.map(block => {
                const filled = filledInBlock(block, scores);
                const total = block.items.length;
                const isComplete = total > 0 && filled === total;
                const isExpanded = expanded === block.dimension;

                return (
                    <Accordion
                        key={block.dimension}
                        expanded={isExpanded}
                        onChange={handleChange(block.dimension)}
                        disableGutters
                        elevation={0}
                        square
                        sx={{
                            border: '1px solid',
                            borderColor: isExpanded ? 'primary.main' : 'surface.outlineVariant',
                            borderRadius: 2,
                            overflow: 'hidden',
                            transition: 'border-color 0.15s ease',
                            '&:before': { display: 'none' },
                            '&.Mui-expanded': { margin: 0 },
                        }}
                    >
                        <AccordionSummary
                            expandIcon={<ChevronDown size={18} />}
                            aria-controls={`dimension-${block.dimension}-content`}
                            sx={{
                                px: { xs: 2, md: 2.5 },
                                py: 0.5,
                                '& .MuiAccordionSummary-content': {
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 1.5,
                                    my: 1.5,
                                },
                            }}
                        >
                            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
                                <Box
                                    sx={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        flex: 'none',
                                        display: 'grid',
                                        placeItems: 'center',
                                        bgcolor: isComplete ? 'tint.successBg' : 'tint.primaryBg',
                                        color: isComplete ? 'tint.successText' : 'primary.main',
                                    }}
                                    aria-hidden
                                >
                                    {isComplete ? <Check size={16} /> : null}
                                </Box>
                                <Typography variant="subtitle1" fontWeight={800} color="text.primary" noWrap>
                                    {block.dimension}
                                </Typography>
                            </Stack>
                            <Chip
                                label={`${filled} / ${total}`}
                                size="small"
                                sx={{
                                    borderRadius: 99,
                                    fontWeight: 700,
                                    flex: 'none',
                                    bgcolor: isComplete ? 'tint.successBg' : 'tint.secondaryBg',
                                    color: isComplete ? 'tint.successText' : 'tint.secondaryText',
                                }}
                            />
                        </AccordionSummary>
                        <AccordionDetails
                            id={`dimension-${block.dimension}-content`}
                            sx={{
                                px: { xs: 2, md: 2.5 },
                                pb: 2.5,
                                pt: 0,
                                borderTop: '1px solid',
                                borderColor: 'surface.lavenderGrey',
                            }}
                        >
                            <Stack spacing={1.5} sx={{ pt: 2 }}>
                                {block.items.map(item => (
                                    <RatingItemRow
                                        key={String(item.scoreKey)}
                                        scoreKey={String(item.scoreKey)}
                                        label={item.label}
                                        value={scores[String(item.scoreKey)] ?? null}
                                        onScoreChange={handleScoreChange(block)}
                                        min={min}
                                        max={max}
                                        comment={comments?.[String(item.scoreKey)]}
                                        onCommentChange={onCommentChange}
                                    />
                                ))}
                            </Stack>
                        </AccordionDetails>
                    </Accordion>
                );
            })}
        </Stack>
    );
}
