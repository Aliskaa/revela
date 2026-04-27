import type { ParticipantQuestionnaireMatrix } from '@aor/types';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';

type MatrixTableModeProps = {
    matrix: ParticipantQuestionnaireMatrix;
};

export function MatrixTableMode({ matrix }: MatrixTableModeProps) {
    const peerHeaders = matrix.peer_columns.map(c => c.label);

    return (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5, boxShadow: 'none' }}>
            <Table size="medium" sx={{ minWidth: 720 }}>
                <TableHead sx={{ bgcolor: 'background.default' }}>
                    <TableRow>
                        <TableCell
                            sx={{
                                fontWeight: 800,
                                minWidth: 250,
                                textTransform: 'uppercase',
                                fontSize: '0.75rem',
                                color: 'text.secondary',
                                py: 2,
                            }}
                        >
                            Dimensions évaluées
                        </TableCell>
                        <TableCell
                            align="center"
                            sx={{
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                fontSize: '0.75rem',
                                color: 'primary.main',
                                py: 2,
                            }}
                        >
                            Auto-évaluation
                        </TableCell>
                        {peerHeaders.map((label, i) => (
                            <TableCell
                                key={matrix.peer_columns[i]?.response_id ?? i}
                                align="center"
                                sx={{
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    fontSize: '0.75rem',
                                    color: 'text.secondary',
                                    py: 2,
                                }}
                            >
                                {label}
                            </TableCell>
                        ))}
                        <TableCell
                            align="center"
                            sx={{
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                fontSize: '0.75rem',
                                color: '#10b981',
                                py: 2,
                            }}
                        >
                            Scientifique
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {matrix.rows.map(row => (
                        <TableRow key={row.score_key} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell sx={{ py: 2 }}>
                                <Typography variant="body2" fontWeight={700} color="text.primary">
                                    {row.label}
                                </Typography>
                            </TableCell>
                            <TableCell
                                align="center"
                                sx={{ fontWeight: 700, color: 'primary.main', bgcolor: 'rgba(21, 21, 176, 0.02)' }}
                            >
                                {row.self ?? '—'}
                            </TableCell>
                            {row.peers.map((v, i) => (
                                <TableCell
                                    key={`${row.score_key}-${matrix.peer_columns[i]?.response_id ?? i}`}
                                    align="center"
                                    sx={{ fontWeight: 500, color: 'text.secondary' }}
                                >
                                    {v ?? '—'}
                                </TableCell>
                            ))}
                            <TableCell
                                align="center"
                                sx={{ fontWeight: 700, color: '#10b981', bgcolor: 'rgba(16, 185, 129, 0.02)' }}
                            >
                                {row.scientific ?? '—'}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
