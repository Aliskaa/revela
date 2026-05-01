// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Box,
    Button,
    Card,
    CardContent,
    IconButton,
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
import type { CampaignParticipantProgress } from '@aor/types';

import { ParticipantTokensRow } from './ParticipantTokensRow';

export type CampaignParticipantsTableProps = {
    campaignId: number;
    participants: CampaignParticipantProgress[];
    /**
     * Préfixe d'URL pour l'accès à la matrix des réponses d'un participant. Permet de
     * dispatcher vers `/admin/participants/$id/matrix` ou `/coach/participants/$id/matrix`
     * selon l'espace de consommation. Si non fourni, le bouton « Voir les réponses » est masqué.
     */
    matrixUrlPrefix?: string;
    /** Questionnaire de la campagne — passé en query param `qid` à la matrix. */
    questionnaireId?: string | null;
};

const COL_SPAN = 7;

export function CampaignParticipantsTable({
    campaignId,
    participants,
    matrixUrlPrefix,
    questionnaireId,
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
                                <TableCell>Auto-éval</TableCell>
                                <TableCell>Pairs</TableCell>
                                <TableCell>Élément Humain</TableCell>
                                <TableCell>Résultats</TableCell>
                                {matrixUrlPrefix ? <TableCell /> : null}
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
                                                {matrixUrlPrefix ? (
                                                    <Link
                                                        to={`${matrixUrlPrefix}/${p.participantId}`}
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
                                            {matrixUrlPrefix ? (
                                                <TableCell align="right" onClick={e => e.stopPropagation()}>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<LayoutPanelLeft size={14} />}
                                                        href={`${matrixUrlPrefix}/${p.participantId}/matrix?qid=${questionnaireId ?? 'B'}`}
                                                        sx={{ borderRadius: 99 }}
                                                    >
                                                        Réponses
                                                    </Button>
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
