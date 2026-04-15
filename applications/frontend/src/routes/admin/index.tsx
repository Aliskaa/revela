import { DataTable } from '@/components/common/DataTable';
import { useAdminDashboard, useCompanies } from '@/hooks/admin';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Grid,
    IconButton,
    Skeleton,
    Stack,
    TableCell,
    TableRow,
    Typography,
} from '@mui/material';
import { Link, createFileRoute } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { BarChart3, ChevronRight, LayoutDashboard, Target, TrendingUp, Users2 } from 'lucide-react';
import { useMemo } from 'react';

export const Route = createFileRoute('/admin/')({
    component: AdminDashboardPage,
});

// Thème adouci pour les tags de questionnaires
type DashboardQuestionnaireRow = {
    qid: string;
    title: string;
    count: number;
    last_submitted_at: string | null;
};

const QID_THEME: Record<string, { bg: string; text: string }> = {
    B: { bg: 'rgba(21, 21, 176, 0.08)', text: '#1515B0' }, // Bleu AOR
    F: { bg: '#f0fdf4', text: '#166534' }, // Vert
    S: { bg: '#fffbeb', text: '#b45309' }, // Jaune/Orange
    C: { bg: '#f5f3ff', text: '#6d28d9' }, // Violet
};

function AdminDashboardPage() {
    const { data, isLoading } = useAdminDashboard();
    const { data: companies } = useCompanies();

    const rows: DashboardQuestionnaireRow[] = Object.entries(data?.by_questionnaire ?? {}).map(([qid, info]) => ({
        qid,
        ...info,
    }));
    const activeClients = (companies ?? []).filter(company => company.participant_count > 0).length;
    const campaignsInProgress = rows.filter(row => row.count > 0).length;

    // Protection contre la division par zéro
    const responseRateProxy =
        data?.total_participants && data.total_participants > 0
            ? Math.round((data.total_responses / data.total_participants) * 100)
            : 0;

    const kpis = [
        {
            label: 'Total Participants',
            value: data?.total_participants ?? 0,
            icon: <Users2 size={24} />,
            color: '#1515B0', // Bleu principal
            target: '/admin/participants',
        },
        {
            label: 'Clients Actifs',
            value: activeClients,
            icon: <Target size={24} />,
            color: '#0ea5e9', // Bleu clair
            target: '/admin/companies',
        },
        {
            label: 'Campagnes Actives',
            value: campaignsInProgress,
            icon: <TrendingUp size={24} />,
            color: '#f59e0b', // Jaune/Orange
            target: '/admin/campaigns',
        },
        {
            label: 'Taux de Complétion',
            value: `${responseRateProxy}%`,
            icon: <BarChart3 size={24} />,
            color: '#10b981', // Vert
            target: '/admin/responses',
        },
    ];

    const columns = useMemo<ColumnDef<DashboardQuestionnaireRow>[]>(
        () => [
            {
                accessorKey: 'qid',
                header: 'ID',
                enableSorting: false,
                cell: ({ getValue }) => (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        #{getValue() as string}
                    </Typography>
                ),
            },
            {
                id: 'type',
                header: 'Type de Questionnaire',
                enableSorting: false,
                cell: ({ row }) => {
                    const theme = QID_THEME[row.original.qid] ?? { bg: '#f3f4f6', text: '#4b5563' };
                    return (
                        <Chip
                            label={`${row.original.qid} — ${row.original.title}`}
                            size="small"
                            sx={{
                                bgcolor: theme.bg,
                                color: theme.text,
                                fontWeight: 700,
                                borderRadius: 1.5,
                                px: 1,
                            }}
                        />
                    );
                },
            },
            {
                accessorKey: 'count',
                header: 'Volume Collecté',
                enableSorting: false,
                cell: ({ getValue }) => (
                    <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>
                        {getValue() as number} réponses
                    </Typography>
                ),
            },
            {
                id: 'statut',
                header: 'Statut',
                enableSorting: false,
                cell: ({ row }) => {
                    const isActive = row.original.count > 0;
                    return (
                        <Chip
                            label={isActive ? 'En cours' : 'En attente'}
                            size="small"
                            color={isActive ? 'success' : 'default'}
                            variant={isActive ? 'filled' : 'outlined'}
                            sx={{ fontWeight: 600, height: 24 }}
                        />
                    );
                },
            },
            {
                id: 'link',
                header: '',
                enableSorting: false,
                cell: ({ row }) => (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Link
                            to="/admin/responses"
                            search={{ qid: row.original.qid }}
                            style={{ textDecoration: 'none' }}
                        >
                            <IconButton
                                size="small"
                                sx={{
                                    color: 'primary.main',
                                    bgcolor: 'rgba(21, 21, 176, 0.04)',
                                }}
                            >
                                <ChevronRight size={18} />
                            </IconButton>
                        </Link>
                    </Box>
                ),
            },
        ],
        []
    );

    return (
        <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, sm: 3, md: 4 } }}>
            {/* Header du Dashboard */}
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', md: 'center' }}
                spacing={2}
                sx={{ mb: 4 }}
            >
                <Box>
                    <Typography
                        variant="h4"
                        fontWeight={800}
                        sx={{ color: 'primary.main', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1.5 }}
                    >
                        <LayoutDashboard size={28} />
                        Vue d'ensemble
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Pilotage global des campagnes, des participants et de l'engagement.
                    </Typography>
                </Box>
            </Stack>

            {/* Section Bienvenue & KPIs */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12 }}>
                    <Card sx={{ borderRadius: 2.5, bgcolor: 'background.paper', p: 3 }}>
                        <Typography variant="h5" fontWeight={800} sx={{ color: 'text.primary', mb: 1 }}>
                            Bienvenue, Admin AOR !
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Le tableau de bord centralisé vous permet de visualiser rapidement l'état de vos initiatives
                            et de gérer vos campagnes en cours.
                        </Typography>
                        <Link to="/admin/campaigns" style={{ textDecoration: 'none' }}>
                            <Button variant="contained" color="primary" sx={{ boxShadow: 2, fontWeight: 600 }}>
                                + Nouvelle Campagne
                            </Button>
                        </Link>
                    </Card>
                </Grid>
                {kpis.map(kpi => (
                    <Grid size={{ xs: 6, lg: 4 }} key={kpi.label}>
                        <Link to={kpi.target} style={{ textDecoration: 'none' }}>
                            <Card
                                sx={{
                                    borderRadius: 2.5,
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    transition: 'box-shadow 0.3s ease',
                                    '&:hover': { boxShadow: '0 4px 15px rgba(0,0,0,0.05)' },
                                }}
                            >
                                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                                    <Box
                                        sx={{
                                            p: 1.5,
                                            borderRadius: '50%',
                                            color: kpi.color,
                                            bgcolor: `${kpi.color}15`,
                                            display: 'inline-flex',
                                            mb: 1,
                                        }}
                                    >
                                        {kpi.icon}
                                    </Box>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: 'text.secondary',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            letterSpacing: 0.5,
                                            display: 'block',
                                            mb: 0.5,
                                        }}
                                    >
                                        {kpi.label}
                                    </Typography>
                                    {isLoading ? (
                                        <Skeleton width={60} height={32} />
                                    ) : (
                                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                            {kpi.value}
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Link>
                    </Grid>
                ))}
            </Grid>

            <DataTable
                data={rows}
                columns={columns}
                isLoading={isLoading}
                minWidth={600}
                cardSx={{ boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}
                skeletonRowCount={4}
                toolbar={
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 2,
                        }}
                    >
                        <Box>
                            <Typography variant="h6" fontWeight={800} sx={{ color: 'text.primary' }}>
                                Suivi des Campagnes et Questionnaires
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                État actuel et volume des réponses collectées.
                            </Typography>
                        </Box>
                        <BarChart3 size={20} className="text-secondary" color="#6b7280" />
                    </Box>
                }
                afterRows={
                    !isLoading && rows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                Aucune donnée disponible.
                            </TableCell>
                        </TableRow>
                    ) : null
                }
            />
        </Box>
    );
}
