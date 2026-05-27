import type { AdminCampaign, Company } from '@aor/types';
import {
    Box,
    Card,
    CardContent,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableSortLabel,
    Typography,
} from '@mui/material';
import { Link } from '@tanstack/react-router';
import { SkeletonCards, SkeletonTableRows } from '@/components/common/SkeletonRows';
import { CompanyListStatusChip, resolveCompanyListStatus } from '@/components/common/chips';
import {
    ClickableTableRow,
    EmptyTableRow,
    ListTableHead,
    ListTablePagination,
    RowNavigateHint,
} from '@/components/common/data-table';
import type { ListTableColumn } from '@/components/common/data-table';
import { MobileListEmptyMessage, ResponsiveListViews } from '@/components/common/layout';
import { companyInitial } from '@/lib/companyInitial';

const ADMIN_EDGE_X = 5;
const ADMIN_CELL_PY = 3;
const ADMIN_TABLE_MIN_WIDTH = 760;
const TABLE_COLUMNS = 4;

export type CompanySortKey = 'name' | 'contact_name' | 'participant_count';
export type CompanySortOrder = 'asc' | 'desc';
export type CompanyListViewsProps = {
    companies: Company[];
    campaigns: AdminCampaign[];
    isLoading: boolean;
    isEmpty: boolean;
    emptyMessage: string;
    detailPathPrefix: string;
    sortKey: CompanySortKey;
    sortOrder: CompanySortOrder;
    onSort: (key: CompanySortKey) => void;
    page: number;
    rowsPerPage: number;
    totalCount: number;
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (rowsPerPage: number) => void;
};

export function CompanyListViews({
    companies,
    campaigns,
    isLoading,
    isEmpty,
    emptyMessage,
    detailPathPrefix,
    sortKey,
    sortOrder,
    onSort,
    page,
    rowsPerPage,
    totalCount,
    onPageChange,
    onRowsPerPageChange,
}: CompanyListViewsProps) {
    const pagination =
        totalCount > 0 ? (
            <ListTablePagination
                count={totalCount}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={onPageChange}
                onRowsPerPageChange={onRowsPerPageChange}
            />
        ) : null;
    const sortLabel = (key: CompanySortKey, label: string) => (
        <TableSortLabel
            active={sortKey === key}
            direction={sortKey === key ? sortOrder : 'asc'}
            onClick={() => onSort(key)}
        >
            {label}
        </TableSortLabel>
    );
    const adminColumns: ListTableColumn[] = [
        { key: 'name', label: sortLabel('name', 'Entreprise'), sx: { pl: ADMIN_EDGE_X } },
        { key: 'contact', label: sortLabel('contact_name', 'Contact principal') },
        { key: 'participants', label: sortLabel('participant_count', 'Participants') },
        { key: 'status', label: 'Statut', sx: { pr: ADMIN_EDGE_X } },
    ];
    return (
        <>
            <ResponsiveListViews
                desktopScroll={false}
                desktop={
                    <Box sx={{ overflowX: 'auto' }}>
                        <Table sx={{ minWidth: ADMIN_TABLE_MIN_WIDTH }}>
                            <ListTableHead columns={adminColumns} />
                            <TableBody>
                                {isLoading ? (
                                    <SkeletonTableRows rows={4} columns={TABLE_COLUMNS} />
                                ) : (
                                    companies.map(company => (
                                        <CompanyTableRow
                                            key={company.id}
                                            company={company}
                                            campaigns={campaigns}
                                            detailPathPrefix={detailPathPrefix}
                                        />
                                    ))
                                )}
                                {!isLoading && isEmpty ? (
                                    <EmptyTableRow colSpan={TABLE_COLUMNS} message={emptyMessage} />
                                ) : null}
                            </TableBody>
                        </Table>
                    </Box>
                }
                mobile={
                    <>
                        {isLoading ? (
                            <SkeletonCards count={3} height={140} />
                        ) : (
                            companies.map(company => (
                                <CompanyMobileCard
                                    key={company.id}
                                    company={company}
                                    campaigns={campaigns}
                                    detailPathPrefix={detailPathPrefix}
                                />
                            ))
                        )}
                        {!isLoading && isEmpty ? <MobileListEmptyMessage message={emptyMessage} /> : null}
                    </>
                }
            />
            {pagination}
        </>
    );
}

type CompanyRowProps = {
    company: Company;
    campaigns: AdminCampaign[];
    detailPathPrefix: string;
};

function CompanyTableRow({ company, campaigns, detailPathPrefix }: CompanyRowProps) {
    const status = resolveCompanyListStatus(company.id, campaigns);
    const detailTo = `${detailPathPrefix}/${company.id}`;
    const rowLabel = `Ouvrir ${company.name}`;
    return (
        <ClickableTableRow to={detailTo} ariaLabel={rowLabel}>
            <TableCell sx={{ pl: ADMIN_EDGE_X, py: ADMIN_CELL_PY }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            bgcolor: 'grey.100',
                            color: 'primary.main',
                            display: 'grid',
                            placeItems: 'center',
                            fontWeight: 800,
                            fontSize: '1.125rem',
                            flexShrink: 0,
                            overflow: 'hidden',
                        }}
                    >
                        {companyInitial(company.name)}
                    </Box>
                    <Box>
                        <Typography
                            fontWeight={700}
                            color="primary.main"
                            lineHeight={1}
                            sx={{ fontSize: '1.125rem' }}
                        >
                            {company.name}
                        </Typography>
                    </Box>
                </Stack>
            </TableCell>
            <TableCell sx={{ py: ADMIN_CELL_PY }}>
                <Typography fontWeight={700} color="text.primary" lineHeight={1.2}>
                    {company.contact_name ?? '–'}
                </Typography>
                {company.contact_email ? (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.25, opacity: 0.6 }}
                    >
                        {company.contact_email}
                    </Typography>
                ) : null}
            </TableCell>
            <TableCell sx={{ py: ADMIN_CELL_PY }}>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                    <Typography fontWeight={800} color="primary.main">
                        {company.participant_count}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.6 }}>
                        participants
                    </Typography>
                </Box>
            </TableCell>
            <TableCell sx={{ py: ADMIN_CELL_PY, pr: ADMIN_EDGE_X }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                    <CompanyListStatusChip status={status} />
                    <RowNavigateHint />
                </Stack>
            </TableCell>
        </ClickableTableRow>
    );
}

function CompanyMobileCard({ company, campaigns, detailPathPrefix }: CompanyRowProps) {
    const status = resolveCompanyListStatus(company.id, campaigns);
    const detailTo = `${detailPathPrefix}/${company.id}`;
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
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 2,
                                    bgcolor: 'tint.primaryBg',
                                    color: 'primary.main',
                                    display: 'grid',
                                    placeItems: 'center',
                                    fontWeight: 800,
                                }}
                            >
                                {companyInitial(company.name)}
                            </Box>
                            <Box>
                                <Typography variant="h6" fontWeight={800} color="primary.main">
                                    {company.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {company.contact_name ?? '–'}
                                </Typography>
                            </Box>
                        </Stack>
                        <CompanyListStatusChip status={status} />
                    </Stack>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">
                            {company.participant_count} participants
                        </Typography>
                        <RowNavigateHint />
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
}
