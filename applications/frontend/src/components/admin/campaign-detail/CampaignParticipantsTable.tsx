// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Box,
    Button,
    Card,
    CardContent,
    Collapse,
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

import type { ListTableColumn } from '@/components/common/data-table';
import { EmptyTableRow, ListTableHead, ListTablePagination } from '@/components/common/data-table';
import { MobileListEmptyMessage, ResponsiveListViews } from '@/components/common/layout';
import {
    tableActionButtonSx,
    tableCellSx,
    listRowSx,
    surfaceCardSx,
} from '@/components/common/styles/listSurfaces';
import { useTablePagination } from '@/lib/useTablePagination';
import type { CampaignParticipantProgress } from '@aor/types';

import { CampaignParticipantTransparencyButton } from './CampaignParticipantTransparencyButton';
import { ParticipantInvitationTokensPanel } from './ParticipantInvitationTokensPanel';
import { ParticipantProgressAvancement } from './ParticipantProgressAvancement';
import { ParticipantTokensRow } from './ParticipantTokensRow';

const EDGE_X = 5;
const TABLE_MIN_WIDTH = 680;

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
        { key: 'avancement', label: 'Avancement', align: 'center' },
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

                <ResponsiveListViews
                    desktopScroll={false}
                    mobileSx={{ px: 2.5, pt: 0, pb: 2 }}
                    desktop={
                        <Box sx={{ overflowX: 'auto' }}>
                            <Table sx={{ minWidth: TABLE_MIN_WIDTH }}>
                                <ListTableHead columns={columns} />
                                <TableBody>
                                    {participants.length === 0 ? (
                                        <EmptyTableRow
                                            colSpan={colSpan}
                                            message="Aucun participant pour le moment."
                                        />
                                    ) : (
                                        paged.map(p => (
                                            <React.Fragment key={p.participantId}>
                                                <TableRow
                                                    hover
                                                    sx={{ cursor: 'pointer', ...listRowSx }}
                                                    onClick={() => toggleExpanded(p.participantId)}
                                                >
                                                    <TableCell padding="checkbox" sx={{ pl: EDGE_X, ...tableCellSx }}>
                                                        <ExpandToggle
                                                            expanded={expandedParticipant === p.participantId}
                                                        />
                                                    </TableCell>
                                                    <TableCell
                                                        onClick={e => e.stopPropagation()}
                                                        sx={tableCellSx}
                                                    >
                                                        <ParticipantIdentity
                                                            participant={p}
                                                            participantUrlPrefix={participantUrlPrefix}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="center" sx={tableCellSx}>
                                                        <ParticipantProgressAvancement participant={p} />
                                                    </TableCell>
                                                    {hasActions ? (
                                                        <TableCell
                                                            align="right"
                                                            onClick={e => e.stopPropagation()}
                                                            sx={{ ...tableCellSx, pr: EDGE_X }}
                                                        >
                                                            <CampaignParticipantRowActions
                                                                campaignId={campaignId}
                                                                participantId={p.participantId}
                                                                matrixUrlPrefix={matrixUrlPrefix}
                                                                transparencyUrlPrefix={transparencyUrlPrefix}
                                                            />
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
                    }
                    mobile={
                        participants.length === 0 ? (
                            <MobileListEmptyMessage message="Aucun participant pour le moment." />
                        ) : (
                            paged.map(p => (
                                <CampaignParticipantMobileCard
                                    key={p.participantId}
                                    campaignId={campaignId}
                                    participant={p}
                                    expanded={expandedParticipant === p.participantId}
                                    onToggleExpand={() => toggleExpanded(p.participantId)}
                                    participantUrlPrefix={participantUrlPrefix}
                                    matrixUrlPrefix={matrixUrlPrefix}
                                    transparencyUrlPrefix={transparencyUrlPrefix}
                                    showActions={hasActions}
                                />
                            ))
                        )
                    }
                />
                {pagination}
            </CardContent>
        </Card>
    );
}

type ExpandToggleProps = {
    expanded: boolean;
};

function ExpandToggle({ expanded }: ExpandToggleProps) {
    return (
        <IconButton
            size="small"
            aria-label={expanded ? 'Replier les détails' : 'Déplier les détails'}
            aria-expanded={expanded}
        >
            <ChevronDown
                size={16}
                style={{
                    transition: 'transform 0.2s',
                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
            />
        </IconButton>
    );
}

type ParticipantIdentityProps = {
    participant: CampaignParticipantProgress;
    participantUrlPrefix?: string;
};

function ParticipantIdentity({ participant, participantUrlPrefix }: ParticipantIdentityProps) {
    return (
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
                {participantInitials(participant.fullName)}
            </Box>
            <Box sx={{ minWidth: 0 }}>
                {participantUrlPrefix ? (
                    <Link
                        to={`${participantUrlPrefix}/${participant.participantId.toString()}` as any}
                        style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                        <Typography
                            fontWeight={700}
                            color="primary.main"
                            lineHeight={1.2}
                            noWrap
                            sx={{
                                fontSize: '1.0625rem',
                                '&:hover': { textDecoration: 'underline' },
                            }}
                        >
                            {participant.fullName}
                        </Typography>
                    </Link>
                ) : (
                    <Typography fontWeight={700} color="text.primary" noWrap>
                        {participant.fullName}
                    </Typography>
                )}
                <Typography
                    variant="caption"
                    color="text.secondary"
                    noWrap
                    sx={{ display: 'block', mt: 0.25, opacity: 0.7 }}
                >
                    {participant.email}
                </Typography>
            </Box>
        </Stack>
    );
}

type CampaignParticipantRowActionsProps = {
    campaignId: number;
    participantId: number;
    matrixUrlPrefix?: string;
    transparencyUrlPrefix?: string;
};

function CampaignParticipantRowActions({
    campaignId,
    participantId,
    matrixUrlPrefix,
    transparencyUrlPrefix,
}: CampaignParticipantRowActionsProps) {
    if (!matrixUrlPrefix) {
        return null;
    }

    return (
        <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
            <Button
                size="small"
                variant="outlined"
                color="primary"
                href={`${matrixUrlPrefix}/${campaignId}/participants/${participantId}/matrix`}
                sx={tableActionButtonSx}
            >
                Réponses
            </Button>
            {transparencyUrlPrefix ? (
                <CampaignParticipantTransparencyButton
                    campaignId={campaignId}
                    participantId={participantId}
                    transparencyUrlPrefix={transparencyUrlPrefix}
                />
            ) : null}
        </Stack>
    );
}

type CampaignParticipantMobileCardProps = {
    campaignId: number;
    participant: CampaignParticipantProgress;
    expanded: boolean;
    onToggleExpand: () => void;
    participantUrlPrefix?: string;
    matrixUrlPrefix?: string;
    transparencyUrlPrefix?: string;
    showActions: boolean;
};

function CampaignParticipantMobileCard({
    campaignId,
    participant,
    expanded,
    onToggleExpand,
    participantUrlPrefix,
    matrixUrlPrefix,
    transparencyUrlPrefix,
    showActions,
}: CampaignParticipantMobileCardProps) {
    return (
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={2}>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <ParticipantIdentity
                                participant={participant}
                                participantUrlPrefix={participantUrlPrefix}
                            />
                        </Box>
                        <IconButton
                            size="small"
                            onClick={onToggleExpand}
                            aria-label={expanded ? 'Replier les détails' : 'Déplier les détails'}
                            aria-expanded={expanded}
                        >
                            <ChevronDown
                                size={16}
                                style={{
                                    transition: 'transform 0.2s',
                                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                }}
                            />
                        </IconButton>
                    </Stack>

                    <Box>
                        <Typography
                            variant="caption"
                            fontWeight={700}
                            color="text.secondary"
                            sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1, display: 'block' }}
                        >
                            Avancement
                        </Typography>
                        <ParticipantProgressAvancement participant={participant} align="flex-start" />
                    </Box>

                    {showActions ? (
                        <CampaignParticipantRowActions
                            campaignId={campaignId}
                            participantId={participant.participantId}
                            matrixUrlPrefix={matrixUrlPrefix}
                            transparencyUrlPrefix={transparencyUrlPrefix}
                        />
                    ) : null}

                    <Collapse in={expanded} unmountOnExit>
                        <Box
                            sx={{
                                pt: 1,
                                borderTop: '1px solid',
                                borderColor: 'divider',
                            }}
                        >
                            <ParticipantInvitationTokensPanel
                                participantId={participant.participantId}
                                campaignId={campaignId}
                            />
                        </Box>
                    </Collapse>
                </Stack>
            </CardContent>
        </Card>
    );
}
