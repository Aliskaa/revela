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

export type CampaignParticipantsTableProps = {
    campaignId: number;
    participants: CampaignParticipantProgress[];
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

const COL_SPAN = 7;

export function CampaignParticipantsTable({
    campaignId,
    participants,
    participantUrlPrefix,
    matrixUrlPrefix,
    transparencyUrlPrefix,
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

    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
                <SectionTitle
                    title="Participants de la campagne"
                    subtitle="Vue opérationnelle des participants rattachés et de leur état de collecte."
                />

                <Box sx={{ overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 900 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox" />
                                <TableCell>Participant</TableCell>
                                <TableCell>Regard sur soi</TableCell>
                                <TableCell>Pairs</TableCell>
                                <TableCell>Élément Humain</TableCell>
                                <TableCell>Résultats</TableCell>
                                {participantUrlPrefix && matrixUrlPrefix ? <TableCell sx={stickyActionHeadSx} /> : null}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {participants.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={COL_SPAN} align="center" sx={{ py: 4 }}>
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
                                            sx={{ cursor: 'pointer' }}
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
                                                <Typography variant="caption" color="text.secondary">
                                                    {p.email}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <ProgressChip status={p.selfRatingStatus} />
                                            </TableCell>
                                            <TableCell>
                                                <ProgressChip status={p.peerFeedbackStatus} />
                                            </TableCell>
                                            <TableCell>
                                                <ProgressChip status={p.elementHumainStatus} />
                                            </TableCell>
                                            <TableCell>
                                                <ProgressChip status={p.resultsStatus} />
                                            </TableCell>
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
                                                            startIcon={<LayoutPanelLeft size={14} />}
                                                            href={`${matrixUrlPrefix}/${campaignId}/participants/${p.participantId}/matrix`}
                                                            sx={{ borderRadius: 99 }}
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
                                                colSpan={COL_SPAN}
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
