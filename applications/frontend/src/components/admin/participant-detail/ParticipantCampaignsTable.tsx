// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { Box, Card, CardContent, Table, TableBody, TableCell, Typography } from '@mui/material';

import { CampaignStatusChip } from '@/components/common/chips';
import {
    ClickableTableRow,
    EmptyTableRow,
    ListTableHead,
    RowNavigateHint,
    type ListTableColumn,
} from '@/components/common/data-table';
import { harmonizedTableCellSx, surfaceCardSx } from '@/components/common/styles/listSurfaces';
import type { CampaignStatus, ParticipantCampaignAssignment } from '@aor/types';

const EDGE_X = 3;
const TABLE_MIN_WIDTH = 640;

export type ParticipantCampaignsTableProps = {
    campaigns: ParticipantCampaignAssignment[];
    scopePrefix: '/admin' | '/coach';
};

export function ParticipantCampaignsTable({ campaigns, scopePrefix }: ParticipantCampaignsTableProps) {
    const columns: ListTableColumn[] = [
        { key: 'status', sx: { pl: EDGE_X, width: 48 } },
        { key: 'campaign', label: 'Campagne' },
        { key: 'company', label: 'Entreprise' },
        { key: 'joined', label: 'Rejoint le' },
        { key: 'navigate', align: 'right', sx: { pr: EDGE_X, width: 48 } },
    ];
    const colSpan = columns.length;

    return (
        <Card variant="outlined" sx={{ ...surfaceCardSx, overflow: 'hidden' }}>
            <CardContent sx={{ p: 0 }}>
                <Box
                    sx={{
                        px: { xs: 2.5, md: 3 },
                        pt: 3,
                        pb: 2,
                        borderBottom: '1px solid',
                        borderColor: 'surface.lavenderGrey',
                    }}
                >
                    <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ mb: 0.5 }}>
                        Campagnes
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        Campagnes auxquelles ce collaborateur est rattaché.
                    </Typography>
                </Box>

                <Box sx={{ overflowX: 'auto', px: { xs: 1, md: 0 } }}>
                    <Table sx={{ minWidth: TABLE_MIN_WIDTH }}>
                        <ListTableHead columns={columns} />
                        <TableBody>
                            {campaigns.length === 0 ? (
                                <EmptyTableRow colSpan={colSpan} message="Aucune campagne rattachée." />
                            ) : (
                                campaigns.map(c => {
                                    const detailTo = `${scopePrefix}/campaigns/${c.campaign_id}`;
                                    return (
                                        <ClickableTableRow
                                            key={c.campaign_id}
                                            to={detailTo}
                                            ariaLabel={`Ouvrir ${c.campaign_name}`}
                                        >
                                            <TableCell sx={{ pl: EDGE_X, ...harmonizedTableCellSx }}>
                                                <CampaignStatusChip status={c.status as CampaignStatus} />
                                            </TableCell>
                                            <TableCell sx={harmonizedTableCellSx}>
                                                <Typography
                                                    fontWeight={700}
                                                    color="primary.main"
                                                    lineHeight={1.2}
                                                    sx={{ fontSize: '1.0625rem' }}
                                                >
                                                    {c.campaign_name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={harmonizedTableCellSx}>
                                                <Typography fontWeight={600} color="text.primary">
                                                    {c.company_name ?? '–'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={harmonizedTableCellSx}>
                                                <Typography color="text.secondary" fontWeight={600}>
                                                    {c.joined_at
                                                        ? new Date(c.joined_at).toLocaleDateString('fr-FR', {
                                                              day: '2-digit',
                                                              month: 'long',
                                                              year: 'numeric',
                                                          })
                                                        : '–'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right" sx={{ pr: EDGE_X, ...harmonizedTableCellSx }}>
                                                <RowNavigateHint />
                                            </TableCell>
                                        </ClickableTableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </Box>
            </CardContent>
        </Card>
    );
}
