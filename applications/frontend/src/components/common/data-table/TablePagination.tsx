// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Box,
    IconButton,
    MenuItem,
    Select,
    Stack,
    Typography,
} from '@mui/material';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { buildPageItems } from '@/lib/buildPageItems';

export type TablePaginationProps = {
    count: number;
    page: number;
    rowsPerPage: number;
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (rowsPerPage: number) => void;
    rowsPerPageOptions?: number[];
    /** Padding horizontal aligné sur le tableau parent (theme spacing). */
    edgePadding?: number;
};

/**
 * Pagination numérotée harmonisée (export Stitch) : sélecteur de lignes à gauche,
 * pages cliquables et flèches à droite.
 */
export function TablePagination({
    count,
    page,
    rowsPerPage,
    onPageChange,
    onRowsPerPageChange,
    rowsPerPageOptions = [10, 25, 50],
    edgePadding = 5,
}: TablePaginationProps) {
    const totalPages = Math.max(1, Math.ceil(count / rowsPerPage));
    const safePage = Math.min(page, totalPages - 1);
    const pageItems = buildPageItems(safePage, totalPages);
    const canGoBack = safePage > 0;
    const canGoForward = safePage < totalPages - 1;

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { sm: 'center' },
                justifyContent: 'space-between',
                gap: 2,
                px: { xs: 2.5, md: edgePadding },
                py: 3,
                bgcolor: 'surface.lavenderGreyFaint',
                borderTop: '1px solid',
                borderColor: 'surface.lavenderGrey',
            }}
        >
            <Stack direction="row" alignItems="center" spacing={2}>
                <Typography variant="caption" color="text.secondary">
                    Lignes par page :
                </Typography>
                <Select
                    value={rowsPerPage}
                    onChange={event => onRowsPerPageChange(Number(event.target.value))}
                    variant="standard"
                    disableUnderline
                    inputProps={{ 'aria-label': 'Lignes par page' }}
                    sx={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'primary.main',
                        '& .MuiSelect-select': { py: 0, pr: 3, pl: 0 },
                    }}
                >
                    {rowsPerPageOptions.map(option => (
                        <MenuItem key={option} value={option}>
                            {option}
                        </MenuItem>
                    ))}
                </Select>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1}>
                <IconButton
                    size="small"
                    disabled={!canGoBack}
                    onClick={() => onPageChange(safePage - 1)}
                    aria-label="Page précédente"
                    sx={{
                        color: canGoBack ? 'primary.main' : 'text.secondary',
                        opacity: canGoBack ? 1 : 0.3,
                        '&:hover': { bgcolor: 'background.paper' },
                    }}
                >
                    <ChevronLeft size={20} />
                </IconButton>

                <Stack direction="row" alignItems="center" spacing={0.5}>
                    {pageItems.map((item, index) =>
                        item === 'ellipsis' ? (
                            <Typography
                                key={`ellipsis-${index}`}
                                variant="caption"
                                color="text.secondary"
                                sx={{ px: 0.5, opacity: 0.3, userSelect: 'none' }}
                            >
                                …
                            </Typography>
                        ) : (
                            <Box
                                key={item}
                                component="button"
                                type="button"
                                onClick={() => onPageChange(item)}
                                aria-label={`Page ${item + 1}`}
                                aria-current={item === safePage ? 'page' : undefined}
                                sx={{
                                    width: 32,
                                    height: 32,
                                    border: 'none',
                                    borderRadius: 2,
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    lineHeight: 1,
                                    bgcolor: item === safePage ? 'primary.main' : 'transparent',
                                    color: item === safePage ? 'primary.contrastText' : 'text.secondary',
                                    transition: 'background-color 0.2s ease',
                                    '&:hover': {
                                        bgcolor: item === safePage ? 'primary.main' : 'background.paper',
                                    },
                                }}
                            >
                                {item + 1}
                            </Box>
                        )
                    )}
                </Stack>

                <IconButton
                    size="small"
                    disabled={!canGoForward}
                    onClick={() => onPageChange(safePage + 1)}
                    aria-label="Page suivante"
                    sx={{
                        color: canGoForward ? 'primary.main' : 'text.secondary',
                        opacity: canGoForward ? 1 : 0.3,
                        '&:hover': { bgcolor: 'background.paper' },
                    }}
                >
                    <ChevronRight size={20} />
                </IconButton>
            </Stack>
        </Box>
    );
}
