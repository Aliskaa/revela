// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    IconButton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TablePagination,
    TableRow,
    Typography,
} from '@mui/material';
import { Link } from '@tanstack/react-router';
import { ChevronDown, LayoutPanelLeft } from 'lucide-react';
import * as React from 'react';

import { SectionTitle } from '@/components/common/SectionTitle';
import { ProgressChip } from '@/components/common/chips';
import { stickyActionCellSx, stickyActionHeadSx } from '@/components/common/data-table';
import type { CampaignParticipantProgress } from '@aor/types';

import { CampaignParticipantTransparencyButton } from './CampaignParticipantTransparencyButton';
import { ParticipantTokensRow } from './ParticipantTokensRow';
import { surfaceCardSx } from '@/components/common/styles/listSurfaces';

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
    harmonized?: boolean;
    /**
     * Préfixe d'URL pour la fiche participant (e.g. `/admin/participants` ou
     * `/coach/participants`). Si non fourni, les liens vers la fiche et la matrix
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

const COL_SPAN_DEFAULT = 7;
const COL_SPAN_HARMONIZED = 6;

export function CampaignParticipantsTable({
    campaignId,
    participants,
    participantUrlPrefix,
    matrixUrlPrefix,
    transparencyUrlPrefix,
    harmonized = false,
}: CampaignParticipantsTableProps) {
    const [expandedParticipant, setExpandedParticipant] = React.useState<number | null>(null);
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

    const toggleExpanded = (participantId: number) =>
        setExpandedParticipant(prev => (prev === participantId ? null : participantId));

    const paged = React.useMemo(
        () => participants.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [participants, page, rowsPerPage]
    );

    React.useEffect(() => {
        const maxPage = Math.max(0, Math.ceil(participants.length / rowsPerPage) - 1);
        if (page > maxPage) setPage(maxPage);
    }, [participants.length, rowsPerPage, page]);

    const colSpan = harmonized ? COL_SPAN_HARMONIZED : COL_SPAN_DEFAULT;

    const headCellSx = harmonized
        ? {
              py: 2,
              fontSize: '0.625rem',
              fontWeight: 700,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.08em',
              color: 'text.secondary',
              bgcolor: 'rgba(79, 112, 229, 0.06)',
              borderBottom: 'none',
          }
        : undefined;

    return (
        <Card variant="outlined" sx={harmonized ? { ...surfaceCardSx, overflow: 'hidden' } : undefined}>
            <CardContent sx={{ p: 0 }}>
                <Box sx={{ px: harmonized ? 3 : 2.5, pt: harmonized ? 3 : 2.5, pb: harmonized ? 2 : 0 }}>
                    {harmonized ? (
                        <Box sx={{ mb: 1 }}>
                            <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ mb: 0.5 }}>
                                Participants de la campagne
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                                Vue opérationnelle des participants rattachés et de leur état de collecte.
                            </Typography>
                        </Box>
                    ) : (
                        <SectionTitle
                            title="Participants de la campagne"
                            subtitle="Vue opérationnelle des participants rattachés et de leur état de collecte."
                        />
                    )}
                </Box>

                <Box sx={{ overflowX: 'auto', px: harmonized ? 1 : 0, pb: harmonized ? 1 : 0 }}>
                    <Table sx={{ minWidth: 900 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox" sx={headCellSx} />
                                <TableCell sx={headCellSx}>Participant</TableCell>
                                <TableCell align={harmonized ? 'center' : 'left'} sx={headCellSx}>
                                    Regard sur soi
                                </TableCell>
                                <TableCell align={harmonized ? 'center' : 'left'} sx={headCellSx}>
                                    Pairs
                                </TableCell>
                                <TableCell align={harmonized ? 'center' : 'left'} sx={headCellSx}>
                                    Élément Humain
                                </TableCell>
                                {!harmonized ? <TableCell sx={headCellSx}>Résultats</TableCell> : null}
                                {participantUrlPrefix && matrixUrlPrefix ? (
                                    <TableCell
                                        align="right"
                                        sx={{ ...(headCellSx ?? {}), ...stickyActionHeadSx }}
                                    >
                                        Actions
                                    </TableCell>
                                ) : null}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {participants.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={colSpan} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Aucun participant pour le moment.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paged.map(p => (
                                    <React.Fragment key={p.participantId}>
                                        <TableRow
                                            hover
                                            sx={{
                                                cursor: 'pointer',
                                                ...(harmonized
                                                    ? {
                                                          '&:hover': { bgcolor: 'rgba(79, 112, 229, 0.06)' },
                                                          '& td': { borderColor: 'rgba(79, 112, 229, 0.08)' },
                                                      }
                                                    : {}),
                                            }}
                                            onClick={() => toggleExpanded(p.participantId)}
                                        >
                                            <TableCell padding="checkbox">
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
                                            <TableCell onClick={e => e.stopPropagation()}>
                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                    {harmonized ? (
                                                        <Avatar
                                                            sx={{
                                                                width: 40,
                                                                height: 40,
                                                                bgcolor: 'background.paper',
                                                                color: 'primary.main',
                                                                border: '1px solid',
                                                                borderColor: 'border',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 700,
                                                            }}
                                                        >
                                                            {participantInitials(p.fullName)}
                                                        </Avatar>
                                                    ) : null}
                                                    <Box>
                                                        {participantUrlPrefix ? (
                                                            <Link
                                                                to={`${participantUrlPrefix}/${p.participantId}`}
                                                                style={{ color: 'inherit', textDecoration: 'none' }}
                                                            >
                                                                <Typography
                                                                    fontWeight={700}
                                                                    color="primary.main"
                                                                    sx={{ '&:hover': { textDecoration: 'underline' } }}
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
                                                            sx={harmonized ? { fontSize: '0.6875rem' } : undefined}
                                                        >
                                                            {p.email}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </TableCell>
                                            <TableCell align={harmonized ? 'center' : 'left'}>
                                                <ProgressChip status={p.selfRatingStatus} />
                                            </TableCell>
                                            <TableCell align={harmonized ? 'center' : 'left'}>
                                                <ProgressChip status={p.peerFeedbackStatus} />
                                            </TableCell>
                                            <TableCell align={harmonized ? 'center' : 'left'}>
                                                <ProgressChip status={p.elementHumainStatus} />
                                            </TableCell>
                                            {!harmonized ? (
                                                <TableCell>
                                                    <ProgressChip status={p.resultsStatus} />
                                                </TableCell>
                                            ) : null}
                                            {participantUrlPrefix && matrixUrlPrefix ? (
                                                <TableCell
                                                    align="right"
                                                    onClick={e => e.stopPropagation()}
                                                    sx={stickyActionCellSx}
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
                                                            startIcon={harmonized ? undefined : <LayoutPanelLeft size={14} />}
                                                            href={`${matrixUrlPrefix}/${campaignId}/participants/${p.participantId}/matrix`}
                                                            sx={
                                                                harmonized
                                                                    ? {
                                                                          borderRadius: 2,
                                                                          fontSize: '0.6875rem',
                                                                          fontWeight: 700,
                                                                          px: 2,
                                                                      }
                                                                    : { borderRadius: 99 }
                                                            }
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
                                        {expandedParticipant === p.participantId && (
                                            <ParticipantTokensRow
                                                participantId={p.participantId}
                                                campaignId={campaignId}
                                                colSpan={colSpan}
                                            />
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    {participants.length > 0 && (
                        <TablePagination
                            component="div"
                            count={participants.length}
                            page={page}
                            onPageChange={(_, newPage) => setPage(newPage)}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={e => {
                                setRowsPerPage(Number(e.target.value));
                                setPage(0);
                            }}
                            rowsPerPageOptions={[10, 25, 50]}
                            labelRowsPerPage="Lignes par page"
                            labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
                        />
                    )}
                </Box>
            </CardContent>
        </Card>
    );
}
