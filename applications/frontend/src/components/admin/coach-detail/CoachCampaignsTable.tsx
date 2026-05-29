// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import {
    Box,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    Typography,
} from '@mui/material';

import { CampaignStatusChip } from '@/components/common/chips';
import {
    ClickableTableRow,
    EmptyTableRow,
    ListTableHead,
    RowNavigateHint,
    type ListTableColumn,
} from '@/components/common/data-table';
import { harmonizedTableCellSx, surfaceCardSx } from '@/components/common/styles/listSurfaces';
import type { AdminCoachLinkedCampaign, CampaignStatus } from '@aor/types';

const EDGE_X = 3;
const TABLE_MIN_WIDTH = 640;

export type CoachCampaignsTableProps = {
    campaigns: AdminCoachLinkedCampaign[];
    companyNameById: ReadonlyMap<number, string>;
    archivedCount: number;
};

export function CoachCampaignsTable({
    campaigns,
    companyNameById,
    archivedCount,
}: CoachCampaignsTableProps) {
    const columns: ListTableColumn[] = [
        { key: 'status', sx: { pl: EDGE_X, width: 48 } },
        { key: 'campaign', label: 'Campagne' },
        { key: 'company', label: 'Entreprise' },
        { key: 'created', label: 'Créée le' },
        { key: 'navigate', align: 'right', sx: { pr: EDGE_X, width: 48 } },
    ];
    const colSpan = columns.length;

    return (
        <Card variant="outlined" sx={{ ...surfaceCardSx, overflow: 'hidden' }}>
            <CardContent sx={{ p: 0 }}>
                <Box sx={{ px: { xs: 2.5, md: 3 }, pt: 3, pb: 2 }}>
                    <Typography variant="h6" fontWeight={700} color="primary.main" sx={{ mb: 0.5 }}>
                        Campagnes
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        Campagnes pilotées par ce coach.
                        {archivedCount > 0 ? (
                            <>
                                {' '}
                                Dont {archivedCount} archivée{archivedCount > 1 ? 's' : ''}.
                            </>
                        ) : null}
                    </Typography>
                </Box>

                <Box sx={{ overflowX: 'auto', px: { xs: 1, md: 0 } }}>
                    <Table sx={{ minWidth: TABLE_MIN_WIDTH }}>
                        <ListTableHead columns={columns} />
                        <TableBody>
                            {campaigns.length === 0 ? (
                                <EmptyTableRow
                                    colSpan={colSpan}
                                    message="Aucune campagne rattachée à ce coach."
                                />
                            ) : (
                                campaigns.map(campaign => {
                                    const detailTo = `/admin/campaigns/${campaign.id}`;
                                    return (
                                        <ClickableTableRow
                                            key={campaign.id}
                                            to={detailTo}
                                            ariaLabel={`Ouvrir ${campaign.name}`}
                                        >
                                            <TableCell sx={{ pl: EDGE_X, ...harmonizedTableCellSx }}>
                                                <CampaignStatusChip status={campaign.status as CampaignStatus} />
                                            </TableCell>
                                            <TableCell sx={harmonizedTableCellSx}>
                                                <Typography
                                                    fontWeight={700}
                                                    color="primary.main"
                                                    lineHeight={1.2}
                                                    sx={{ fontSize: '1.0625rem' }}
                                                >
                                                    {campaign.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={harmonizedTableCellSx}>
                                                <Typography fontWeight={600} color="text.primary">
                                                    {companyNameById.get(campaign.companyId) ??
                                                        `Entreprise #${campaign.companyId}`}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={harmonizedTableCellSx}>
                                                <Typography color="text.secondary" fontWeight={600}>
                                                    {campaign.createdAt
                                                        ? new Date(campaign.createdAt).toLocaleDateString('fr-FR', {
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
