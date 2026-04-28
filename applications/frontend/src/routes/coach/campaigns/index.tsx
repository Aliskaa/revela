// Copyright (c) 2026 AOR Conseil — proprietary, see LICENSE.md.

import { AdminCampaignDrawerForm } from '@/components/admin/AdminCampaignDrawerForm';
import { MiniStat } from '@/components/common/MiniStat';
import { SectionTitle } from '@/components/common/SectionTitle';
import { SkeletonCards, SkeletonTableRows } from '@/components/common/SkeletonRows';
import { StatCard } from '@/components/common/StatCard';
import { useAdminCampaigns, useCompanies, useCreateAdminCampaign } from '@/hooks/admin';
import { usePageResetEffect } from '@/lib/usePageResetEffect';
import type { CampaignStatus } from '@aor/types';
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
import { ChevronRight, ClipboardList, Plus, Sparkles, Target, Users } from 'lucide-react';
import * as React from 'react';

/**
 * Liste des campagnes du coach (filtrée backend par scope=coach via `useAdminCampaigns`).
 * Réplique fidèle de `routes/admin/campaigns/index.tsx` adaptée au contexte coach :
 * - colonne « Coach » masquée (le coach ne voit que ses propres campagnes) ;
 * - liens vers `/coach/campaigns/$id` au lieu de `/admin/campaigns/$id` ;
 * - création de campagne autorisée — le backend force `coach_id = req.user.coachId`
 *   pour scope=coach (cf. admin-campaigns.controller).
 */
export const Route = createFileRoute('/coach/campaigns/')({
    component: CoachCampaignsRoute,
});

const QUESTIONNAIRE_LABELS: Record<string, string> = {
    B: 'B — Comportement',
    F: 'F — Ressentis',
    S: 'S — Soi',
};

function StatusChip({ status }: { status: CampaignStatus }) {
    if (status === 'active') {
        return (
            <Chip
                label="Active"
                size="small"
                sx={{ borderRadius: 99, bgcolor: 'rgba(16,185,129,0.12)', color: 'rgb(4,120,87)' }}
            />
        );
    }
    if (status === 'closed' || status === 'archived') {
        return (
            <Chip
                label="Archivée"
                size="small"
                sx={{ borderRadius: 99, bgcolor: 'rgba(148,163,184,0.16)', color: 'rgb(100,116,139)' }}
            />
        );
    }
    return (
        <Chip
            label="Brouillon"
            size="small"
            sx={{ borderRadius: 99, bgcolor: 'rgba(255,204,0,0.16)', color: 'rgb(180,120,0)' }}
        />
    );
}

function CoachCampaignsRoute() {
    const [search, setSearch] = React.useState('');
    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

    const { data: campaigns = [], isLoading: campaignsLoading } = useAdminCampaigns();
    const { data: companies = [] } = useCompanies();
    const createCampaign = useCreateAdminCampaign();

    const companyName = (id: number) => companies.find(c => c.id === id)?.name ?? '–';
    const questionnairesUsed = new Set(campaigns.map(c => c.questionnaireId).filter(Boolean)).size;

    const filtered = React.useMemo(() => {
        const q = search.toLowerCase();
        return campaigns.filter(c => {
            const company = companies.find(co => co.id === c.companyId)?.name ?? '';
            return c.name.toLowerCase().includes(q) || company.toLowerCase().includes(q);
        });
    }, [campaigns, companies, search]);

    const paged = React.useMemo(
        () => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [filtered, page, rowsPerPage]
    );

    usePageResetEffect(setPage, [search]);

    return (
        <Stack spacing={3}>
            <AdminCampaignDrawerForm
                open={drawerOpen}
                mode="create"
                onClose={() => {
                    setDrawerOpen(false);
                    createCampaign.reset();
                }}
                onSubmit={async values => {
                    try {
                        await createCampaign.mutateAsync({
                            name: values.name,
                            companyId: values.companyId,
                            coachId: values.coachId,
                            questionnaireId: values.questionnaireId,
                            startsAt: values.startDate ? new Date(values.startDate).toISOString() : null,
                            endsAt: values.endDate ? new Date(values.endDate).toISOString() : null,
                            allowTestWithoutManualInputs: values.allowTestWithoutManualInputs,
                            status: values.status,
                        });
                        setDrawerOpen(false);
                    } catch {
                        // Le toast d'erreur est émis par le hook ; on garde le drawer ouvert.
                    }
                }}
                isSubmitting={createCampaign.isPending}
            />

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
                                label="Mes campagnes"
                                sx={{ borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main', mb: 1.5 }}
                            />
                            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                                Campagnes attribuées
                            </Typography>
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}
                            >
                                Toutes les campagnes que vous accompagnez. Cliquez sur « Détail » pour ouvrir leur
                                cockpit (participants, soumissions, statut).
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            disableElevation
                            startIcon={<Plus size={16} />}
                            onClick={() => setDrawerOpen(true)}
                            sx={{ borderRadius: 3, bgcolor: 'primary.main' }}
                        >
                            Nouvelle campagne
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 2 }}>
                <StatCard
                    label="Mes campagnes"
                    value={campaigns.length}
                    helper="dans mon périmètre"
                    icon={ClipboardList}
                    loading={campaignsLoading}
                />
                <StatCard
                    label="Actives"
                    value={campaigns.filter(c => c.status === 'active').length}
                    helper="en cours"
                    icon={Target}
                    loading={campaignsLoading}
                />
                <StatCard
                    label="Entreprises"
                    value={new Set(campaigns.map(c => c.companyId)).size}
                    helper="rattachées"
                    icon={Users}
                    loading={campaignsLoading}
                />
                <StatCard
                    label="Questionnaires"
                    value={questionnairesUsed}
                    helper="B / F / S"
                    icon={Sparkles}
                    loading={campaignsLoading}
                />
            </Box>

            <Card variant="outlined">
                <CardContent sx={{ p: 2.5 }}>
                    <SectionTitle
                        title="Liste des campagnes"
                        subtitle="La table permet de comparer rapidement vos campagnes et d'ouvrir leur détail."
                        action={
                            <TextField
                                size="small"
                                placeholder="Rechercher…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                sx={{ minWidth: 260 }}
                            />
                        }
                    />

                    {/* Desktop table — colonne « Coach » masquée car le coach ne voit que ses propres campagnes */}
                    <Box sx={{ display: { xs: 'none', lg: 'block' }, overflowX: 'auto' }}>
                        <Table sx={{ minWidth: 900 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Campagne</TableCell>
                                    <TableCell>Entreprise</TableCell>
                                    <TableCell>Questionnaire</TableCell>
                                    <TableCell>Statut</TableCell>
                                    <TableCell>Créée le</TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {campaignsLoading ? (
                                    <SkeletonTableRows rows={4} columns={6} />
                                ) : (
                                    paged.map(campaign => (
                                        <TableRow hover key={campaign.id}>
                                            <TableCell>
                                                <Typography fontWeight={700} color="text.primary">
                                                    {campaign.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{companyName(campaign.companyId)}</TableCell>
                                            <TableCell>
                                                {campaign.questionnaireId
                                                    ? (QUESTIONNAIRE_LABELS[campaign.questionnaireId] ??
                                                      campaign.questionnaireId)
                                                    : '–'}
                                            </TableCell>
                                            <TableCell>
                                                <StatusChip status={campaign.status} />
                                            </TableCell>
                                            <TableCell>
                                                {campaign.createdAt
                                                    ? new Date(campaign.createdAt).toLocaleDateString('fr-FR')
                                                    : '–'}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Button
                                                    href={`/coach/campaigns/${campaign.id}`}
                                                    variant="text"
                                                    endIcon={<ChevronRight size={16} />}
                                                >
                                                    Détail
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                                {!campaignsLoading && filtered.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {search
                                                    ? 'Aucune campagne ne correspond à la recherche.'
                                                    : 'Aucune campagne pour le moment.'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        {filtered.length > 0 && (
                            <TablePagination
                                component="div"
                                count={filtered.length}
                                page={page}
                                onPageChange={(_, newPage) => setPage(newPage)}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={e => {
                                    setRowsPerPage(Number(e.target.value));
                                    setPage(0);
                                }}
                                rowsPerPageOptions={[10, 25, 50]}
                                labelRowsPerPage="Lignes par page"
                                labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
                            />
                        )}
                    </Box>

                    {/* Mobile cards */}
                    <Stack spacing={2} sx={{ display: { xs: 'flex', lg: 'none' }, mt: 2 }}>
                        {campaignsLoading ? (
                            <SkeletonCards count={3} height={160} />
                        ) : (
                            filtered.map(campaign => (
                                <Card variant="outlined" key={campaign.id}>
                                    <CardContent sx={{ p: 2.5 }}>
                                        <Stack spacing={2}>
                                            <Stack
                                                direction="row"
                                                justifyContent="space-between"
                                                alignItems="start"
                                                spacing={2}
                                            >
                                                <Box>
                                                    <Typography variant="h6" fontWeight={800} color="text.primary">
                                                        {campaign.name}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{ mt: 0.5, lineHeight: 1.7 }}
                                                    >
                                                        {companyName(campaign.companyId)}
                                                    </Typography>
                                                </Box>
                                                <StatusChip status={campaign.status} />
                                            </Stack>

                                            <Box
                                                sx={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                                    gap: 1.2,
                                                }}
                                            >
                                                <MiniStat
                                                    label="Questionnaire"
                                                    value={
                                                        campaign.questionnaireId
                                                            ? (QUESTIONNAIRE_LABELS[campaign.questionnaireId] ??
                                                              campaign.questionnaireId)
                                                            : '–'
                                                    }
                                                />
                                                <MiniStat
                                                    label="Créée le"
                                                    value={
                                                        campaign.createdAt
                                                            ? new Date(campaign.createdAt).toLocaleDateString('fr-FR')
                                                            : '–'
                                                    }
                                                />
                                            </Box>

                                            <Button
                                                variant="contained"
                                                disableElevation
                                                href={`/coach/campaigns/${campaign.id}`}
                                                endIcon={<ChevronRight size={16} />}
                                                sx={{
                                                    borderRadius: 3,
                                                    bgcolor: 'primary.main',
                                                    width: 'fit-content',
                                                }}
                                            >
                                                Ouvrir
                                            </Button>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                        {!campaignsLoading && filtered.length === 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                {search
                                    ? 'Aucune campagne ne correspond à la recherche.'
                                    : 'Aucune campagne pour le moment.'}
                            </Typography>
                        )}
                    </Stack>
                </CardContent>
            </Card>
        </Stack>
    );
}
