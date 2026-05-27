// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Typography } from '@mui/material';

export type SummaryFieldProps = {
    label: string;
    value: string;
};

/** Champ Entreprise / Coach / Questionnaire — maquette Stitch Résumé opérationnel. */
export function SummaryField({ label, value }: SummaryFieldProps) {
    return (
        <Box
            sx={{
                bgcolor: 'surface.softWhite',
                borderRadius: 2,
                p: 2,
                border: '1px solid',
                borderColor: 'surface.outlineVariantSoft',
            }}
        >
            <Typography
                component="span"
                variant="caption"
                sx={{
                    display: 'block',
                    color: 'text.secondary',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    lineHeight: 1.2,
                    mb: 0.5,
                }}
            >
                {label}
            </Typography>
            <Typography
                component="span"
                sx={{
                    display: 'block',
                    fontWeight: 600,
                    fontSize: '1.125rem',
                    color: 'text.primary',
                    lineHeight: 1.35,
                }}
            >
                {value}
            </Typography>
        </Box>
    );
}
