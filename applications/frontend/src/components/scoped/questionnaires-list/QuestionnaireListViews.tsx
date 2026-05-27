import type { QuestionnaireListItem } from '@aor/types';
import {
    Box,
    Card,
    CardContent,
    Chip,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Typography,
} from '@mui/material';

import { SkeletonCards, SkeletonTableRows } from '@/components/common/SkeletonRows';
import {
    EmptyTableRow,
    ListTableHead,
    ListTablePagination,
} from '@/components/common/data-table';
import type { ListTableColumn } from '@/components/common/data-table';
import { MobileListEmptyMessage, ResponsiveListViews } from '@/components/common/layout';
import { listRowSx } from '@/components/common/styles/listSurfaces';

const ADMIN_EDGE_X = 5;
const ADMIN_CELL_PY = 3;
const ADMIN_TABLE_MIN_WIDTH = 760;
const TABLE_COLUMNS = 3;

export type QuestionnaireListViewsProps = {
    questionnaires: QuestionnaireListItem[];
    isLoading: boolean;
    isEmpty: boolean;
    emptyMessage: string;
    page: number;
    rowsPerPage: number;
    totalCount: number;
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (rowsPerPage: number) => void;
};

export function QuestionnaireListViews({
    questionnaires,
    isLoading,
    isEmpty,
    emptyMessage,
    page,
    rowsPerPage,
    totalCount,
    onPageChange,
    onRowsPerPageChange,
}: QuestionnaireListViewsProps) {
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

    const adminColumns: ListTableColumn[] = [
        { key: 'code', label: 'Code', sx: { pl: ADMIN_EDGE_X } },
        { key: 'title', label: 'Questionnaire' },
        { key: 'dimensions', label: 'Dimensions', sx: { pr: ADMIN_EDGE_X } },
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
                                    questionnaires.map(q => (
                                        <QuestionnaireTableRow key={q.id} questionnaire={q} />
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
                            questionnaires.map(q => <QuestionnaireMobileCard key={q.id} questionnaire={q} />)
                        )}
                        {!isLoading && isEmpty ? <MobileListEmptyMessage message={emptyMessage} /> : null}
                    </>
                }
            />
            {pagination}
        </>
    );
}

type QuestionnaireRowProps = {
    questionnaire: QuestionnaireListItem;
};

function QuestionnaireTableRow({ questionnaire: q }: QuestionnaireRowProps) {
    return (
        <TableRow hover sx={listRowSx}>
            <TableCell sx={{ pl: ADMIN_EDGE_X, py: ADMIN_CELL_PY }}>
                <Typography fontWeight={700} color="primary.main" lineHeight={1.2} sx={{ fontSize: '1.0625rem' }}>
                    {q.id}
                </Typography>
            </TableCell>
            <TableCell sx={{ py: ADMIN_CELL_PY }}>
                <Typography fontWeight={700} color="primary.main" lineHeight={1.2}>
                    {q.title}
                </Typography>
                {q.description ? (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, opacity: 0.7 }}>
                        {q.description}
                    </Typography>
                ) : null}
            </TableCell>
            <TableCell sx={{ py: ADMIN_CELL_PY, pr: ADMIN_EDGE_X }}>
                <Typography color="text.secondary" fontWeight={600}>
                    {q.dimensions.map(d => d.name).join(' · ') || '–'}
                </Typography>
            </TableCell>
        </TableRow>
    );
}

function QuestionnaireMobileCard({ questionnaire: q }: QuestionnaireRowProps) {
    return (
        <Card
            variant="outlined"
            sx={{
                borderRadius: 3,
                transition: 'box-shadow 0.2s ease, transform 0.2s ease',
                '&:hover': {
                    boxShadow: theme => theme.palette.shadow.brandPaper,
                    transform: 'translateY(-1px)',
                },
            }}
        >
            <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={2}>
                    <Box>
                        <Typography variant="h6" fontWeight={800} color="primary.main">
                            {q.id} · {q.title}
                        </Typography>
                        {q.description ? (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {q.description}
                            </Typography>
                        ) : null}
                    </Box>
                    {q.dimensions.length > 0 ? (
                        <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                            {q.dimensions.map(d => (
                                <Chip
                                    key={d.name}
                                    label={d.name}
                                    size="small"
                                    sx={{
                                        borderRadius: 99,
                                        bgcolor: 'tint.primaryBg',
                                        color: 'primary.main',
                                    }}
                                />
                            ))}
                        </Stack>
                    ) : null}
                </Stack>
            </CardContent>
        </Card>
    );
}
