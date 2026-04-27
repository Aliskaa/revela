import { MiniStat } from '@/components/common/MiniStat';
import { SectionTitle } from '@/components/common/SectionTitle';
import { SkeletonCards, SkeletonTableRows } from '@/components/common/SkeletonRows';
import { StatCard } from '@/components/common/StatCard';
import { useAdminResponses } from '@/hooks/admin';
import { usePageResetEffect } from '@/lib/usePageResetEffect';
import type { ResponseSubmissionKind } from '@aor/types';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { createFileRoute } from '@tanstack/react-router';
import { ArrowRight, ClipboardList, MessageSquareText, Sparkles, Users } from 'lucide-react';
import * as React from 'react';

export const Route = createFileRoute('/admin/responses/')({
    component: AdminResponsesRoute,
});

const SUBMISSION_KIND_LABELS: Record<ResponseSubmissionKind, string> = {
    element_humain: 'Test Élément Humain',
    self_rating: 'Auto-évaluation',
    peer_rating: 'Feedback des pairs',
};

function kindLabel(kind: ResponseSubmissionKind): string {
    return SUBMISSION_KIND_LABELS[kind] ?? kind;
}

function AdminResponsesRoute() {
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(25);
    const [search, setSearch] = React.useState('');

    const { data, isLoading } = useAdminResponses(undefined, page + 1, rowsPerPage);

    const responses = data?.items ?? [];
    const totalCount = data?.total ?? 0;

    usePageResetEffect(setPage, [rowsPerPage]);

    const selfCount = responses.filter(r => r.submission_kind === 'self_rating').length;
    const peerCount = responses.filter(r => r.submission_kind === 'peer_rating').length;
    const ehCount = responses.filter(r => r.submission_kind === 'element_humain').length;

    const filtered = search.trim()
        ? responses.filter(
              r =>
                  r.name.toLowerCase().includes(search.toLowerCase()) ||
                  r.email.toLowerCase().includes(search.toLowerCase()) ||
                  r.organisation.toLowerCase().includes(search.toLowerCase())
          )
        : responses;

    return (
        <Stack spacing={3}>
            <Card variant="outlined">
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Stack
                        spacing={2.5}
                        direction={{ xs: 'column', lg: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'start', lg: 'start' }}
                    >
                        <Box>
                            <Chip
                                label="Réponses"
                                sx={{ borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main', mb: 1.5 }}
                            />
                            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                                Réponses
                            </Typography>
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}
                            >
                                Suivi des soumissions collectées par campagne, avec accès rapide aux dossiers de
                                collecte.
                            </Typography>
                        </Box>
                    </Stack>
                </CardContent>
            </Card>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 2 }}>
                <StatCard
                    label="Soumissions"
                    value={data?.total ?? '–'}
                    helper="tous types confondus"
                    icon={MessageSquareText}
                    loading={isLoading}
                />
                <StatCard
                    label="Auto-éval"
                    value={selfCount}
                    helper="sur cette page"
                    icon={Users}
                    loading={isLoading}
                />
                <StatCard label="Pairs" value={peerCount} helper="sur cette page" icon={Sparkles} loading={isLoading} />
                <StatCard
                    label="Élément Humain"
                    value={ehCount}
                    helper="sur cette page"
                    icon={ClipboardList}
                    loading={isLoading}
                />
            </Box>

            <Card variant="outlined">
                <CardContent sx={{ p: 2.5 }}>
                    <SectionTitle
                        title="Liste des soumissions"
                        subtitle="Chaque ligne correspond à un type de réponse relié à une campagne et à un participant."
                        action={
                            <TextField
                                size="small"
                                placeholder="Rechercher une soumission…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                sx={{ minWidth: 300 }}
                            />
                        }
                    />

                    {/* Desktop table */}
                    <Box sx={{ display: { xs: 'none', lg: 'block' }, overflowX: 'auto' }}>
                        <Table sx={{ minWidth: 900 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Questionnaire</TableCell>
                                    <TableCell>Organisation</TableCell>
                                    <TableCell>Scores</TableCell>
                                    <TableCell>Soumis le</TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isLoading ? (
                                    <SkeletonTableRows rows={5} columns={6} />
                                ) : (
                                    filtered.map(response => (
                                        <TableRow hover key={response.id}>
                                            <TableCell>
                                                <Typography fontWeight={700} color="text.primary">
                                                    {kindLabel(response.submission_kind)}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {response.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{response.questionnaire_id}</TableCell>
                                            <TableCell>{response.organisation || '–'}</TableCell>
                                            <TableCell>{Object.keys(response.scores).length}</TableCell>
                                            <TableCell>
                                                {new Date(response.submitted_at).toLocaleDateString('fr-FR')}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Button
                                                    href={`/admin/responses/${response.id}`}
                                                    variant="text"
                                                    endIcon={<ArrowRight size={16} />}
                                                >
                                                    Détail
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                                {!isLoading && filtered.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {search
                                                    ? 'Aucune soumission ne correspond à la recherche.'
                                                    : 'Aucune soumission pour le moment.'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Box>

                    {/* Mobile cards */}
                    <Stack spacing={2} sx={{ display: { xs: 'flex', lg: 'none' }, mt: 2 }}>
                        {isLoading ? (
                            <SkeletonCards count={3} height={160} />
                        ) : (
                            filtered.map(response => (
                                <Card variant="outlined" key={response.id}>
                                    <CardContent sx={{ p: 2.5 }}>
                                        <Stack spacing={1.8}>
                                            <Box>
                                                <Typography variant="h6" fontWeight={800} color="text.primary">
                                                    {kindLabel(response.submission_kind)}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                                                    {response.name}
                                                </Typography>
                                            </Box>
                                            <Box
                                                sx={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                                    gap: 1.2,
                                                }}
                                            >
                                                <MiniStat label="Questionnaire" value={response.questionnaire_id} />
                                                <MiniStat label="Organisation" value={response.organisation || '–'} />
                                                <MiniStat
                                                    label="Scores"
                                                    value={String(Object.keys(response.scores).length)}
                                                />
                                                <MiniStat
                                                    label="Soumis le"
                                                    value={new Date(response.submitted_at).toLocaleDateString('fr-FR')}
                                                />
                                            </Box>
                                            <Button
                                                href={`/admin/responses/${response.id}`}
                                                variant="outlined"
                                                endIcon={<ArrowRight size={16} />}
                                                sx={{ borderRadius: 3, alignSelf: 'flex-start' }}
                                            >
                                                Voir le détail
                                            </Button>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                        {!isLoading && filtered.length === 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                {search
                                    ? 'Aucune soumission ne correspond à la recherche.'
                                    : 'Aucune soumission pour le moment.'}
                            </Typography>
                        )}
                    </Stack>

                    {totalCount > 0 && (
                        <TablePagination
                            component="div"
                            count={totalCount}
                            page={page}
                            onPageChange={(_, newPage) => setPage(newPage)}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={e => setRowsPerPage(Number(e.target.value))}
                            rowsPerPageOptions={[25, 50, 100]}
                            labelRowsPerPage="Lignes par page"
                            labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
                        />
                    )}
                </CardContent>
            </Card>
        </Stack>
    );
}
