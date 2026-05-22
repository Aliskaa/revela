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
    TableSortLabel,
    Typography,
} from '@mui/material';
import type { AdminCampaign, Company } from '@aor/types';
import type * as React from 'react';

import { harmonizedListTableHeadCellSx } from '@/components/admin/campaign-detail/campaignDetailHarmonizedStyles';
import { StatCard } from '@/components/common/cards';
import { CompanyListStatusChip, resolveCompanyListStatus } from '@/components/common/chips';
import {
    EmptyTableRow,
    HarmonizedPaginationFooter,
    HarmonizedTableLink,
    OpenDetailButton,
    StandardTablePagination,
} from '@/components/common/data-table';
import { MobileListEmptyMessage, ResponsiveListViews } from '@/components/common/layout';
import { SkeletonCards, SkeletonTableRows } from '@/components/common/SkeletonRows';
import { companyInitial } from '@/lib/companyInitial';
import { CompanyStatusChip } from '@/components/common/chips/CompanyListStatusChip';

const ADMIN_TABLE_COLUMNS = 5;
const COACH_TABLE_COLUMNS = 4;

const harmonizedRowSx = {
    '&:hover': { bgcolor: 'rgba(245, 245, 251, 0.8)' },
    '& td': { borderColor: 'rgba(245, 245, 251, 0.8)' },
};

export type CompanySortKey = 'name' | 'contact_name' | 'participant_count';
export type CompanySortOrder = 'asc' | 'desc';

export type CompanyListViewsProps = {
    variant: 'admin' | 'coach';
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
    variant,
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
                    <Table sx={{ minWidth: isAdmin ? 900 : 800 }}>
                        <TableHead>
                            <TableRow>
                                {isAdmin ? (
                                    <TableCell sx={{ ...harmonizedListTableHeadCellSx, pl: 4 }}>Statut</TableCell>
                                ) : <TableCell />}
                                <SortableHeadCell
                                    harmonized={isAdmin}
                                    active={sortKey === 'name'}
                                    direction={sortKey === 'name' ? sortOrder : 'asc'}
                                    onClick={() => onSort('name')}
                                    pl={isAdmin ? 4 : undefined}
                                >
                                    Entreprise
                                </SortableHeadCell>
                                <SortableHeadCell
                                    harmonized={isAdmin}
                                    active={sortKey === 'contact_name'}
                                    direction={sortKey === 'contact_name' ? sortOrder : 'asc'}
                                    onClick={() => onSort('contact_name')}
                                >
                                    {isAdmin ? 'Contact principal' : 'Contact'}
                                </SortableHeadCell>
                                <SortableHeadCell
                                    harmonized={isAdmin}
                                    active={sortKey === 'participant_count'}
                                    direction={sortKey === 'participant_count' ? sortOrder : 'asc'}
                                    onClick={() => onSort('participant_count')}
                                >
                                    Participants
                                </SortableHeadCell>
                                {isAdmin ? (
                                    <>
                                        <TableCell align="right" sx={{ ...harmonizedListTableHeadCellSx, pr: 4 }} />
                                    </>
                                ) : (
                                    <TableCell />
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {isLoading ? (
                                <SkeletonTableRows rows={4} columns={tableColumns} />
                            ) : (
                                companies.map(company => (
                                    <CompanyTableRow
                                        key={company.id}
                                        company={company}
                                        campaigns={campaigns}
                                        variant={variant}
                                        detailPathPrefix={detailPathPrefix}
                                    />
                                ))
                            )}
                            {!isLoading && isEmpty ? (
                                <EmptyTableRow colSpan={tableColumns} message={emptyMessage} />
                            ) : null}
                        </TableBody>
                    </Table>
                    {pagination ? (
                        isAdmin ? <HarmonizedPaginationFooter>{pagination}</HarmonizedPaginationFooter> : pagination
                    ) : null}
                </>
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
                                variant={variant}
                                detailPathPrefix={detailPathPrefix}
                            />
                        ))
                    )}
                    {!isLoading && isEmpty ? <MobileListEmptyMessage message={emptyMessage} /> : null}
                </>
            }
        />
    );
}

type SortableHeadCellProps = {
    harmonized: boolean;
    active: boolean;
    direction: CompanySortOrder;
    onClick: () => void;
    pl?: number;
    children: React.ReactNode;
};

function SortableHeadCell({ harmonized, active, direction, onClick, pl, children }: SortableHeadCellProps) {
    const sortLabel = (
        <TableSortLabel active={active} direction={direction} onClick={onClick}>
            {children}
        </TableSortLabel>
    );

    if (harmonized) {
        return <TableCell sx={{ ...harmonizedListTableHeadCellSx, ...(pl != null ? { pl } : {}) }}>{sortLabel}</TableCell>;
    }

    return <TableCell>{sortLabel}</TableCell>;
}

type CompanyRowProps = {
    company: Company;
    campaigns: AdminCampaign[];
    variant: 'admin' | 'coach';
    detailPathPrefix: string;
};

function CompanyTableRow({ company, campaigns, variant, detailPathPrefix }: CompanyRowProps) {
    const isAdmin = variant === 'admin';
    const status = resolveCompanyListStatus(company.id, campaigns);
    const detailTo = `${detailPathPrefix}/${company.id}`;

    if (isAdmin) {
        return (
            <TableRow hover sx={harmonizedRowSx}>
                <TableCell sx={{ py: 2.5 }}>
                    <CompanyStatusChip status={status} />
                </TableCell>
                <TableCell sx={{ pl: 4, py: 2.5 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                            sx={{
                                width: 48,
                                height: 48,
                                borderRadius: 2,
                                bgcolor: 'tint.primaryBg',
                                color: 'primary.main',
                                display: 'grid',
                                placeItems: 'center',
                                fontWeight: 800,
                                fontSize: '1.125rem',
                                flexShrink: 0,
                            }}
                        >
                            {companyInitial(company.name)}
                        </Box>
                        <Typography fontWeight={700} color="primary.main" lineHeight={1.2}>
                            {company.name}
                        </Typography>
                    </Stack>
                </TableCell>
                <TableCell sx={{ py: 2.5 }}>
                    <Typography fontWeight={700} color="text.primary" lineHeight={1.2}>
                        {company.contact_name ?? '–'}
                    </Typography>
                    {company.contact_email ? (
                        <Typography variant="caption" color="text.secondary">
                            {company.contact_email}
                        </Typography>
                    ) : null}
                </TableCell>
                <TableCell sx={{ py: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                        <Typography fontWeight={800} color="primary.main">
                            {company.participant_count}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            participants
                        </Typography>
                    </Box>
                </TableCell>
                <TableCell align="right" sx={{ pr: 4, py: 2.5 }}>
                    <HarmonizedTableLink to={detailTo} />
                </TableCell>
            </TableRow>
        );
    }

    return (
        <TableRow hover>
            <TableCell>
                <Typography fontWeight={700} color="text.primary">
                    {company.name}
                </Typography>
            </TableCell>
            <TableCell>
                <Typography fontWeight={600} color="text.primary">
                    {company.contact_name ?? '–'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    {company.contact_email ?? ''}
                </Typography>
            </TableCell>
            <TableCell>{company.participant_count}</TableCell>
            <TableCell align="right">
                <OpenDetailButton to={detailTo} />
            </TableCell>
        </TableRow>
    );
}

function CompanyMobileCard({ company, campaigns, variant, detailPathPrefix }: CompanyRowProps) {
    const isAdmin = variant === 'admin';
    const status = resolveCompanyListStatus(company.id, campaigns);
    const detailTo = `${detailPathPrefix}/${company.id}`;

    return (
        <Card variant="outlined" sx={isAdmin ? { borderRadius: 3 } : undefined}>
            <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={isAdmin ? 2 : 1.8}>
                    {isAdmin ? (
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
                    ) : (
                        <Box>
                            <Typography variant="h6" fontWeight={800} color="text.primary">
                                {company.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                                {company.contact_name ?? '–'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {company.contact_email ?? ''}
                            </Typography>
                        </Box>
                    )}
                    {isAdmin ? (
                        <Typography variant="caption" color="text.secondary">
                            {company.participant_count} participants
                        </Typography>
                    ) : (
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                gap: 1.2,
                            }}
                        >
                            <StatCard variant="mini" label="Participants" value={String(company.participant_count)} />
                        </Box>
                    )}
                    <OpenDetailButton to={detailTo} variant="card" />
                </Stack>
            </CardContent>
        </Card>
    );
}
