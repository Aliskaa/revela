// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Box,
    Button,
    Card,
    CardContent,
    IconButton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Typography,
} from '@mui/material';
import { Link } from '@tanstack/react-router';
import { ChevronDown } from 'lucide-react';
import * as React from 'react';

import { ProgressChip } from '@/components/common/chips';
import type { ListTableColumn } from '@/components/common/data-table';
import { EmptyTableRow, ListTableHead, ListTablePagination } from '@/components/common/data-table';
import {
    harmonizedTableActionButtonSx,
    harmonizedTableCellSx,
    listRowSx,
    surfaceCardSx,
} from '@/components/common/styles/listSurfaces';
import { useTablePagination } from '@/lib/useTablePagination';
import type { CampaignParticipantProgress } from '@aor/types';

import { CampaignParticipantTransparencyButton } from './CampaignParticipantTransparencyButton';
import { ParticipantTokensRow } from './ParticipantTokensRow';

const EDGE_X = 5;
const TABLE_MIN_WIDTH = 900;

function participantInitials(fullName: string): string {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
        return '?';
    }
    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

export type CampaignParticipantsTableProps = {
    campaignId: number;
    participants: CampaignParticipantProgress[];
    /**
     * Préfixe d'URL pour la fiche participant (e.g. `/admin/companies/1/participants`).
     * Si non fourni, les liens vers la fiche et la matrix
     * sont masqués.
     */
    participantUrlPrefix?: string;
    /**
     * Préfixe d'URL pour la matrix scopée à la campagne (e.g. `/admin/campaigns` ou
     * `/coach/campaigns`). L'URL finale est
     * `${prefix}/${campaignId}/participants/${participantId}/matrix`.
     */
    matrixUrlPrefix?: string;
    /**
     * Préfixe d'URL pour la matrice de transparence scopée à la campagne (e.g.
     * `/admin/campaigns` ou `/coach/campaigns`). L'URL finale est
     * `${prefix}/${campaignId}/participants/${participantId}/transparency`.
     */
    transparencyUrlPrefix?: string;
};

export function CampaignParticipantsTable({
    campaignId,
    participants,
    participantUrlPrefix,
    matrixUrlPrefix,
    transparencyUrlPrefix,
}: CampaignParticipantsTableProps) {
    const [expandedParticipant, setExpandedParticipant] = React.useState<number | null>(null);

    const { page, rowsPerPage, paged, setPage, setRowsPerPage } = useTablePagination({
        items: participants,
        resetWhen: [participants.length],
    });

    React.useEffect(() => {
        const maxPage = Math.max(0, Math.ceil(participants.length / rowsPerPage) - 1);
        if (page > maxPage) setPage(maxPage);
    }, [participants.length, rowsPerPage, page, setPage]);

    const toggleExpanded = (participantId: number) =>
        setExpandedParticipant(prev => (prev === participantId ? null : participantId));

    const hasActions = Boolean(participantUrlPrefix && matrixUrlPrefix);

    const columns: ListTableColumn[] = [
        { key: 'expand', sx: { pl: EDGE_X, width: 48 } },
        { key: 'participant', label: 'Participant' },
        { key: 'self', label: 'Regard sur soi', align: 'center' },
        { key: 'peer', label: 'Pairs', align: 'center' },
        { key: 'element', label: 'Élément Humain', align: 'center' },
        ...(hasActions ? [{ key: 'actions', align: 'right' as const, sx: { pr: EDGE_X } }] : []),
    ];
    const colSpan = columns.length;

    const pagination =
        participants.length > 0 ? (
            <ListTablePagination
                count={participants.length}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={setPage}
                onRowsPerPageChange={setRowsPerPage}
            />
        ) : null;

    return (
        <Card variant="outlined" sx={{ ...surfaceCardSx, overflow: 'hidden' }}>
            <CardContent sx={{ p: 0 }}>
                <Box sx={{ px: 3, pt: 3, pb: 2 }}>
                    <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ mb: 0.5 }}>
                        Participants de la campagne
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        Vue opérationnelle des participants rattachés et de leur état de collecte.
                    </Typography>
                </Box>

                <Box sx={{ overflowX: 'auto' }}>
                    <Table sx={{ minWidth: TABLE_MIN_WIDTH }}>
                        <ListTableHead columns={columns} />
                        <TableBody>
                            {participants.length === 0 ? (
                                <EmptyTableRow colSpan={colSpan} message="Aucun participant pour le moment." />
                            ) : (
                                paged.map(p => (
                                    <React.Fragment key={p.participantId}>
                                        <TableRow
                                            hover
                                            sx={{ cursor: 'pointer', ...listRowSx }}
                                            onClick={() => toggleExpanded(p.participantId)}
                                        >
                                            <TableCell padding="checkbox" sx={{ pl: EDGE_X, ...harmonizedTableCellSx }}>
                                                <IconButton
                                                    size="small"
                                                    aria-label={
                                                        expandedParticipant === p.participantId
                                                            ? 'Replier les détails'
                                                            : 'Déplier les détails'
                                                    }
                                                    aria-expanded={expandedParticipant === p.participantId}
                                                >
                                                    <ChevronDown
                                                        size={16}
                                                        style={{
                                                            transition: 'transform 0.2s',
                                                            transform:
                                                                expandedParticipant === p.participantId
                                                                    ? 'rotate(180deg)'
                                                                    : 'rotate(0deg)',
                                                        }}
                                                    />
                                                </IconButton>
                                            </TableCell>
                                            <TableCell onClick={e => e.stopPropagation()} sx={harmonizedTableCellSx}>
                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                    <Box
                                                        sx={{
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: 2,
                                                            bgcolor: 'grey.100',
                                                            color: 'primary.main',
                                                            display: 'grid',
                                                            placeItems: 'center',
                                                            fontWeight: 800,
                                                            fontSize: '0.75rem',
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        {participantInitials(p.fullName)}
                                                    </Box>
                                                    <Box>
                                                        {participantUrlPrefix ? (
                                                            <Link
                                                                to={`${participantUrlPrefix}/${p.participantId}`}
                                                                style={{ color: 'inherit', textDecoration: 'none' }}
                                                            >
                                                                <Typography
                                                                    fontWeight={700}
                                                                    color="primary.main"
                                                                    lineHeight={1.2}
                                                                    sx={{
                                                                        fontSize: '1.0625rem',
                                                                        '&:hover': { textDecoration: 'underline' },
                                                                    }}
                                                                >
                                                                    {p.fullName}
                                                                </Typography>
                                                            </Link>
                                                        ) : (
                                                            <Typography fontWeight={700} color="text.primary">
                                                                {p.fullName}
                                                            </Typography>
                                                        )}
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            sx={{ display: 'block', mt: 0.25, opacity: 0.7 }}
                                                        >
                                                            {p.email}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </TableCell>
                                            <TableCell align="center" sx={harmonizedTableCellSx}>
                                                <ProgressChip status={p.selfRatingStatus} />
                                            </TableCell>
                                            <TableCell align="center" sx={harmonizedTableCellSx}>
                                                <ProgressChip status={p.peerFeedbackStatus} />
                                            </TableCell>
                                            <TableCell align="center" sx={harmonizedTableCellSx}>
                                                <ProgressChip status={p.elementHumainStatus} />
                                            </TableCell>
                                            {hasActions ? (
                                                <TableCell
                                                    align="right"
                                                    onClick={e => e.stopPropagation()}
                                                    sx={{ ...harmonizedTableCellSx, pr: EDGE_X }}
                                                >
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        justifyContent="flex-end"
                                                        flexWrap="wrap"
                                                        useFlexGap
                                                    >
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            color="primary"
                                                            href={`${matrixUrlPrefix}/${campaignId}/participants/${p.participantId}/matrix`}
                                                            sx={harmonizedTableActionButtonSx}
                                                        >
                                                            Réponses
                                                        </Button>
                                                        {transparencyUrlPrefix ? (
                                                            <CampaignParticipantTransparencyButton
                                                                campaignId={campaignId}
                                                                participantId={p.participantId}
                                                                transparencyUrlPrefix={transparencyUrlPrefix}
                                                            />
                                                        ) : null}
                                                    </Stack>
                                                </TableCell>
                                            ) : null}
                                        </TableRow>
                                        {expandedParticipant === p.participantId ? (
                                            <ParticipantTokensRow
                                                participantId={p.participantId}
                                                campaignId={campaignId}
                                                colSpan={colSpan}
                                            />
                                        ) : null}
                                    </React.Fragment>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Box>
                {pagination}
            </CardContent>
        </Card>
    );
}
