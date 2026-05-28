// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    IconButton,
    Popover,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from '@mui/material';
import { Info } from 'lucide-react';
import * as React from 'react';

import { TRANSPARENCY_F_TO_P_TABLE } from '@aor/types';

const cellSx = {
    px: 1.25,
    py: 0.625,
    fontVariantNumeric: 'tabular-nums' as const,
    textAlign: 'center' as const,
};

/** Table de référence F → P affichée à la demande (popover) pour économiser l'espace. */
export function TransparencyFToPMappingPopover() {
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
    const open = Boolean(anchorEl);

    return (
        <>
            <Tooltip title="Voir la table de conversion F → P">
                <IconButton
                    size="small"
                    aria-label="Table de conversion F → P"
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    onClick={event => setAnchorEl(event.currentTarget)}
                    sx={{
                        color: 'primary.main',
                        bgcolor: 'tint.primaryBg',
                        border: '1px solid',
                        borderColor: 'tint.primaryRail',
                        '&:hover': { bgcolor: 'tint.primarySelected' },
                    }}
                >
                    <Info size={16} />
                </IconButton>
            </Tooltip>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{
                    paper: {
                        sx: {
                            mt: 0.75,
                            width: 200,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'surface.listTableRowBorder',
                            boxShadow: theme => theme.palette.shadow.brandSubtle,
                            overflow: 'hidden',
                        },
                    },
                }}
            >
                <Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'tint.primaryWash' }}>
                            <TableCell
                                colSpan={2}
                                align="center"
                                sx={{
                                    fontWeight: 800,
                                    color: 'primary.main',
                                    py: 1,
                                    fontSize: '0.625rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.06em',
                                    borderBottom: 'none',
                                }}
                            >
                                Conversions F → P
                            </TableCell>
                        </TableRow>
                        <TableRow sx={{ bgcolor: 'surface.lavenderGrey' }}>
                            <TableCell align="center" sx={{ ...cellSx, fontWeight: 700, fontSize: '0.6875rem' }}>
                                F
                            </TableCell>
                            <TableCell align="center" sx={{ ...cellSx, fontWeight: 700, fontSize: '0.6875rem' }}>
                                P
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {TRANSPARENCY_F_TO_P_TABLE.map(([f, p]) => (
                            <TableRow key={f}>
                                <TableCell align="center" sx={cellSx}>
                                    {f}
                                </TableCell>
                                <TableCell align="center" sx={{ ...cellSx, fontWeight: 700 }}>
                                    {p}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                        display: 'block',
                        width: '100%',
                        px: 1.5,
                        py: 1,
                        bgcolor: 'surface.lavenderGrey',
                        lineHeight: 1.5,
                        textAlign: 'center',
                    }}
                >
                    Référence utilisée pour la colonne P du calcul.
                </Typography>
            </Popover>
        </>
    );
}
