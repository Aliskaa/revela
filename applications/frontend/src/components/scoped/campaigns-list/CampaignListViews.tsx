import type { AdminCampaign } from '@aor/types';
import {
    Box,
    Card,
    CardContent,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';

import { SkeletonCards, SkeletonTableRows } from '@/components/common/SkeletonRows';
import { StatCard } from '@/components/common/cards';
import { CampaignStatusChip } from '@/components/common/chips';
import {
    EmptyTableRow,
    ListTableHead,
    OpenDetailButton,
    StandardTablePagination,
    stickyActionCellSx,
    stickyActionHeadSx,
    TablePaginationFooter,
    TableRowLink,
} from '@/components/common/data-table';
import { MobileListEmptyMessage, ResponsiveListViews } from '@/components/common/layout';
import { listRowSx } from '@/components/common/styles/listSurfaces';
import { companyInitial } from '@/lib/companyInitial';
import { questionnaireLabel } from '@/lib/labels';

const ADMIN_TABLE_COLUMNS = 7;
const COACH_TABLE_COLUMNS = 6;

export type CampaignListViewsProps = {
    variant: 'admin' | 'coach';
    campaigns: AdminCampaign[];
    isLoading: boolean;
    isEmpty: boolean;
    emptyMessage: string;
    detailPathPrefix: string;
    companyName: (id: number) => string;
    coachName: (id: number) => string;
    page: number;
    rowsPerPage: number;
    totalCount: number;
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (rowsPerPage: number) => void;
};

export function CampaignListViews({
    variant,
    campaigns,
    isLoading,
    isEmpty,
    emptyMessage,
    detailPathPrefix,
    companyName,
    coachName,
    page,
    rowsPerPage,
    totalCount,
    onPageChange,
    onRowsPerPageChange,
}: CampaignListViewsProps) {
    const isAdmin = variant === 'admin';
    const tableColumns = isAdmin ? ADMIN_TABLE_COLUMNS : COACH_TABLE_COLUMNS;
    const pagination =
        totalCount > 0 ? (
            <StandardTablePagination
                count={totalCount}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={onPageChange}
                onRowsPerPageChange={onRowsPerPageChange}
            />
        ) : null;

    return (
        <ResponsiveListViews
            mobileSx={isAdmin ? undefined : { p: 0, mt: 2 }}
            desktop={
                <>
                    <Table sx={{ minWidth: isAdmin ? 1000 : 900 }}>
                        {isAdmin ? (
                            <ListTableHead
                                columns={[
                                    { key: 'status', label: 'Statut', sx: { pl: 4 } },
                                    { key: 'name', label: 'Campagne' },
                                    { key: 'company', label: 'Entreprise' },
                                    { key: 'coach', label: 'Coach' },
                                    { key: 'questionnaire', label: 'Questionnaire' },
                                    { key: 'createdAt', label: 'Créée le' },
                                    { key: 'action', align: 'right', sx: { pr: 4, ...stickyActionHeadSx } },
                                ]}
                            />
                        ) : (
                            <TableHead>
                                <TableRow>
                                    <TableCell />
                                    <TableCell>Campagne</TableCell>
                                    <TableCell>Entreprise</TableCell>
                                    <TableCell>Questionnaire</TableCell>
                                    <TableCell>Créée le</TableCell>
                                    <TableCell sx={stickyActionHeadSx} />
                                </TableRow>
                            </TableHead>
                        )}
                        <TableBody>
                            {isLoading ? (
                                <SkeletonTableRows rows={4} columns={tableColumns} />
                            ) : (
                                campaigns.map(campaign => (
                                    <CampaignTableRow
                                        key={campaign.id}
                                        campaign={campaign}
                                        variant={variant}
                                        detailPathPrefix={detailPathPrefix}
                                        companyName={companyName}
                                        coachName={coachName}
                                    />
                                ))
                            )}
                            {!isLoading && isEmpty ? (
                                <EmptyTableRow colSpan={tableColumns} message={emptyMessage} />
                            ) : null}
                        </TableBody>
                    </Table>
                    {pagination ? (
                        isAdmin ? (
                            <TablePaginationFooter>{pagination}</TablePaginationFooter>
                        ) : (
                            pagination
                        )
                    ) : null}
                </>
            }
            mobile={
                <>
                    {isLoading ? (
                        <SkeletonCards count={3} height={160} />
                    ) : (
                        campaigns.map(campaign => (
                            <CampaignMobileCard
                                key={campaign.id}
                                campaign={campaign}
                                variant={variant}
                                detailPathPrefix={detailPathPrefix}
                                companyName={companyName}
                                coachName={coachName}
                            />
                        ))
                    )}
                    {!isLoading && isEmpty ? <MobileListEmptyMessage message={emptyMessage} /> : null}
                </>
            }
        />
    );
}

type CampaignRowProps = {
    campaign: AdminCampaign;
    variant: 'admin' | 'coach';
    detailPathPrefix: string;
    companyName: (id: number) => string;
    coachName: (id: number) => string;
};

function formatCreatedAt(createdAt: string | null | undefined): string {
    return createdAt ? new Date(createdAt).toLocaleDateString('fr-FR') : '–';
}

function CampaignTableRow({ campaign, variant, detailPathPrefix, companyName, coachName }: CampaignRowProps) {
    const isAdmin = variant === 'admin';
    const company = companyName(campaign.companyId);
    const detailTo = `${detailPathPrefix}/${campaign.id}`;

    if (isAdmin) {
        return (
            <TableRow hover key={campaign.id} sx={listRowSx}>
                <TableCell sx={{ pl: 4, py: 2.5 }}>
                    <CampaignStatusChip status={campaign.status} />
                </TableCell>
                <TableCell sx={{ py: 2.5 }}>
                    <Typography fontWeight={700} color="primary.main">
                        {campaign.name}
                    </Typography>
                </TableCell>
                <TableCell sx={{ py: 2.5 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 2,
                                bgcolor: 'rgba(255, 152, 0, 0.12)',
                                color: 'rgb(234, 88, 12)',
                                display: 'grid',
                                placeItems: 'center',
                                fontWeight: 800,
                                fontSize: '0.75rem',
                                flexShrink: 0,
                            }}
                        >
                            {companyInitial(company)}
                        </Box>
                        <Typography color="text.secondary" fontWeight={600}>
                            {company}
                        </Typography>
                    </Stack>
                </TableCell>
                <TableCell sx={{ py: 2.5 }}>
                    <Typography color="text.secondary" fontWeight={600}>
                        {coachName(campaign.coachId)}
                    </Typography>
                </TableCell>
                <TableCell sx={{ py: 2.5 }}>
                    <Typography color="text.secondary" fontWeight={600}>
                        {questionnaireLabel(campaign.questionnaireId)}
                    </Typography>
                </TableCell>
                <TableCell sx={{ py: 2.5 }}>
                    <Typography color="text.secondary" sx={{ opacity: 0.85 }}>
                        {formatCreatedAt(campaign.createdAt)}
                    </Typography>
                </TableCell>
                <TableCell align="right" sx={{ pr: 4, py: 2.5, ...stickyActionCellSx }}>
                    <TableRowLink to={detailTo} />
                </TableCell>
            </TableRow>
        );
    }

    return (
        <TableRow hover key={campaign.id}>
            <TableCell>
                <CampaignStatusChip status={campaign.status} />
            </TableCell>
            <TableCell>
                <Typography fontWeight={700} color="text.primary">
                    {campaign.name}
                </Typography>
            </TableCell>
            <TableCell>{company}</TableCell>
            <TableCell>{questionnaireLabel(campaign.questionnaireId)}</TableCell>
            <TableCell>{formatCreatedAt(campaign.createdAt)}</TableCell>
            <TableCell align="right" sx={stickyActionCellSx}>
                <OpenDetailButton to={detailTo} />
            </TableCell>
        </TableRow>
    );
}

function CampaignMobileCard({ campaign, variant, detailPathPrefix, companyName, coachName }: CampaignRowProps) {
    const isAdmin = variant === 'admin';
    const company = companyName(campaign.companyId);
    const detailTo = `${detailPathPrefix}/${campaign.id}`;

    return (
        <Card variant="outlined" sx={isAdmin ? { borderRadius: 3 } : undefined}>
            <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={2}>
                        <Box>
                            <Typography variant="h6" fontWeight={800} color={isAdmin ? 'primary.main' : 'text.primary'}>
                                {campaign.name}
                            </Typography>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 0.5, ...(isAdmin ? {} : { lineHeight: 1.7 }) }}
                            >
                                {isAdmin ? `${company} · Coach ${coachName(campaign.coachId)}` : company}
                            </Typography>
                        </Box>
                        <CampaignStatusChip status={campaign.status} />
                    </Stack>
                    {!isAdmin ? (
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                gap: 1.2,
                            }}
                        >
                            <StatCard
                                variant="mini"
                                label="Questionnaire"
                                value={questionnaireLabel(campaign.questionnaireId)}
                            />
                            <StatCard variant="mini" label="Créée le" value={formatCreatedAt(campaign.createdAt)} />
                        </Box>
                    ) : null}
                    <OpenDetailButton to={detailTo} variant="card" />
                </Stack>
            </CardContent>
        </Card>
    );
}
