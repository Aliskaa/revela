// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Box,
    Card,
    CardContent,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { ChevronDown } from 'lucide-react';
import * as React from 'react';

import { SectionTitle } from '@/components/common/SectionTitle';
import type { CampaignParticipantProgress } from '@aor/types';

import { ParticipantTokensRow } from './ParticipantTokensRow';
import { ProgressChip } from './ProgressChip';

export type CampaignParticipantsTableProps = {
    campaignId: number;
    participants: CampaignParticipantProgress[];
};

const COL_SPAN = 6;

export function CampaignParticipantsTable({ campaignId, participants }: CampaignParticipantsTableProps) {
    const [expandedParticipant, setExpandedParticipant] = React.useState<number | null>(null);

    const toggleExpanded = (participantId: number) =>
        setExpandedParticipant(prev => (prev === participantId ? null : participantId));

    return (
        <Card variant="outlined">
            <CardContent sx={{ p: 2.5 }}>
                <SectionTitle
                    title="Participants de la campagne"
                    subtitle="Vue opérationnelle des participants rattachés et de leur état de collecte."
                />

                <Box sx={{ overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 800 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell padding="checkbox" />
                                <TableCell>Participant</TableCell>
                                <TableCell>Auto-éval</TableCell>
                                <TableCell>Pairs</TableCell>
                                <TableCell>Élément Humain</TableCell>
                                <TableCell>Résultats</TableCell>
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
                                participants.map(p => (
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
                                            <TableCell>
                                                <Typography fontWeight={700} color="text.primary">
                                                    {p.fullName}
                                                </Typography>
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
                </Box>
            </CardContent>
        </Card>
    );
}
