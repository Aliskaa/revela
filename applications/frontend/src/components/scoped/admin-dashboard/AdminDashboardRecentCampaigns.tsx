// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import type { AdminCampaign } from '@aor/types';
import {
    Box,
    Card,
    CardContent,
    Stack,
    Table,
    TableBody,
    TableCell,
    Typography,
} from '@mui/material';
import { Link } from '@tanstack/react-router';

import { ParticipantAvatar } from '@/components/common/ParticipantAvatar';
import { SkeletonCards, SkeletonTableRows } from '@/components/common/SkeletonRows';
import { CampaignStatusChip } from '@/components/common/chips';
import type { ListTableColumn } from '@/components/common/data-table';
import {
    ClickableTableRow,
    EmptyTableRow,
    ListTableHead,
    RowNavigateHint,
} from '@/components/common/data-table';
import { MobileListEmptyMessage, ResponsiveListViews } from '@/components/common/layout';
import { companyInitial } from '@/lib/companyInitial';
import { questionnaireLabel } from '@/lib/labels';

const EDGE_X = 5;
const CELL_PY = 3;
const TABLE_MIN_WIDTH = 960;
const TABLE_COLUMNS = 6;

function formatCreatedAt(createdAt: string | null | undefined): string {
    return createdAt ? new Date(createdAt).toLocaleDateString('fr-FR') : '–';
}

export type AdminDashboardRecentCampaignsProps = {
    campaigns: AdminCampaign[];
    isLoading: boolean;
    companyName: (id: number) => string;
    companyAvatarUrl: (id: number) => string | null;
    coachName: (id: number) => string;
};

export function AdminDashboardRecentCampaigns({
    campaigns,
    isLoading,
    companyName,
    companyAvatarUrl,
    coachName,
}: AdminDashboardRecentCampaignsProps) {
    const isEmpty = !isLoading && campaigns.length === 0;

    const columns: ListTableColumn[] = [
        { key: 'name', label: 'Campagne', sx: { pl: EDGE_X } },
        { key: 'company', label: 'Entreprise' },
        { key: 'coach', label: 'Coach' },
        { key: 'questionnaire', label: 'Questionnaire' },
        { key: 'createdAt', label: 'Créée le' },
        { key: 'status', label: 'Statut', sx: { pr: EDGE_X } },
    ];

    return (
        <ResponsiveListViews
            desktopScroll={false}
            desktop={
                <Box sx={{ overflowX: 'auto' }}>
                    <Table sx={{ minWidth: TABLE_MIN_WIDTH }}>
                        <ListTableHead columns={columns} />
                        <TableBody>
                            {isLoading ? (
                                <SkeletonTableRows rows={3} columns={TABLE_COLUMNS} />
                            ) : (
                                campaigns.map(campaign => (
                                    <RecentCampaignTableRow
                                        key={campaign.id}
                                        campaign={campaign}
                                        companyName={companyName}
                                        companyAvatarUrl={companyAvatarUrl}
                                        coachName={coachName}
                                    />
                                ))
                            )}
                            {isEmpty ? (
                                <EmptyTableRow colSpan={TABLE_COLUMNS} message="Aucune campagne pour le moment." />
                            ) : null}
                        </TableBody>
                    </Table>
                </Box>
            }
            mobile={
                <>
                    {isLoading ? (
                        <SkeletonCards count={3} height={160} />
                    ) : (
                        campaigns.map(campaign => (
                            <RecentCampaignMobileCard
                                key={campaign.id}
                                campaign={campaign}
                                companyName={companyName}
                                companyAvatarUrl={companyAvatarUrl}
                                coachName={coachName}
                            />
                        ))
                    )}
                    {isEmpty ? <MobileListEmptyMessage message="Aucune campagne pour le moment." /> : null}
                </>
            }
        />
    );
}

type RecentCampaignRowProps = {
    campaign: AdminCampaign;
    companyName: (id: number) => string;
    companyAvatarUrl: (id: number) => string | null;
    coachName: (id: number) => string;
};

function DashboardCompanyAvatar({ companyLabel, avatarUrl }: { companyLabel: string; avatarUrl: string | null }) {
    return (
        <ParticipantAvatar
            src={avatarUrl}
            initials={companyInitial(companyLabel)}
            alt={companyLabel}
            size={32}
            sx={{
                borderRadius: 2,
                bgcolor: 'grey.100',
                color: 'primary.main',
                fontWeight: 800,
                fontSize: '0.75rem',
            }}
        />
    );
}

function RecentCampaignTableRow({ campaign, companyName, companyAvatarUrl, coachName }: RecentCampaignRowProps) {
    const company = companyName(campaign.companyId);
    const avatarUrl = companyAvatarUrl(campaign.companyId);
    const detailTo = `/admin/campaigns/${campaign.id}`;

    return (
        <ClickableTableRow to={detailTo} ariaLabel={`Ouvrir ${campaign.name}`}>
            <TableCell sx={{ pl: EDGE_X, py: CELL_PY }}>
                <Typography fontWeight={700} color="primary.main" lineHeight={1.2} sx={{ fontSize: '1.0625rem' }}>
                    {campaign.name}
                </Typography>
            </TableCell>
            <TableCell sx={{ py: CELL_PY }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <DashboardCompanyAvatar companyLabel={company} avatarUrl={avatarUrl} />
                    <Typography color="text.secondary" fontWeight={600}>
                        {company}
                    </Typography>
                </Stack>
            </TableCell>
            <TableCell sx={{ py: CELL_PY }}>
                <Typography color="text.secondary" fontWeight={600}>
                    {coachName(campaign.coachId)}
                </Typography>
            </TableCell>
            <TableCell sx={{ py: CELL_PY }}>
                <Typography color="text.secondary" fontWeight={600}>
                    {questionnaireLabel(campaign.questionnaireId)}
                </Typography>
            </TableCell>
            <TableCell sx={{ py: CELL_PY }}>
                <Typography color="text.secondary" sx={{ opacity: 0.85 }}>
                    {formatCreatedAt(campaign.createdAt)}
                </Typography>
            </TableCell>
            <TableCell sx={{ py: CELL_PY, pr: EDGE_X }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                    <CampaignStatusChip status={campaign.status} />
                    <RowNavigateHint />
                </Stack>
            </TableCell>
        </ClickableTableRow>
    );
}

function RecentCampaignMobileCard({ campaign, companyName, companyAvatarUrl, coachName }: RecentCampaignRowProps) {
    const company = companyName(campaign.companyId);
    const avatarUrl = companyAvatarUrl(campaign.companyId);
    const detailTo = `/admin/campaigns/${campaign.id}`;

    return (
        <Card
            component={Link}
            to={detailTo}
            variant="outlined"
            sx={{
                borderRadius: 3,
                textDecoration: 'none',
                color: 'inherit',
                transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                '&:hover': {
                    boxShadow: theme => theme.palette.shadow.brandPaper,
                    transform: 'translateY(-1px)',
                },
            }}
        >
            <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={2}>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                            <DashboardCompanyAvatar companyLabel={company} avatarUrl={avatarUrl} />
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="h6" fontWeight={800} color="primary.main" noWrap>
                                    {campaign.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }} noWrap>
                                    {company} · Coach {coachName(campaign.coachId)}
                                </Typography>
                            </Box>
                        </Stack>
                        <CampaignStatusChip status={campaign.status} />
                    </Stack>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">
                            {questionnaireLabel(campaign.questionnaireId)} · {formatCreatedAt(campaign.createdAt)}
                        </Typography>
                        <RowNavigateHint />
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
}
