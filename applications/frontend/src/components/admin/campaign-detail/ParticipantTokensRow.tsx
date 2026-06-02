// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Collapse, TableCell, TableRow } from '@mui/material';

import { ParticipantInvitationTokensPanel } from './ParticipantInvitationTokensPanel';

export type ParticipantTokensRowProps = {
    participantId: number;
    campaignId: number;
    colSpan: number;
};

export function ParticipantTokensRow({ participantId, campaignId, colSpan }: ParticipantTokensRowProps) {
    return (
        <TableRow>
            <TableCell colSpan={colSpan} sx={{ py: 0, bgcolor: 'tint.subtleGhost' }}>
                <Collapse in unmountOnExit>
                    <Box sx={{ py: 2, px: 1 }}>
                        <ParticipantInvitationTokensPanel
                            participantId={participantId}
                            campaignId={campaignId}
                        />
                    </Box>
                </Collapse>
            </TableCell>
        </TableRow>
    );
}
