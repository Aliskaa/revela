import { AdminCampaignDrawerForm } from '@/components/admin/AdminCampaignDrawerForm';
import { MiniStat } from '@/components/common/MiniStat';
import { SectionTitle } from '@/components/common/SectionTitle';
import { StatCard } from '@/components/common/StatCard';
import { useAdminCampaigns, useAdminDashboard, useCoaches, useCompanies, useCreateAdminCampaign } from '@/hooks/admin';
import type { CampaignStatus } from '@aor/types';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { Link, createFileRoute } from '@tanstack/react-router';
import { ChevronRight, ClipboardList, Plus, Sparkles, Target, Users } from 'lucide-react';
import * as React from 'react';

export const Route = createFileRoute('/admin/campaigns/')({
    component: AdminCampaignsRoute,
});

const QUESTIONNAIRE_LABELS: Record<string, string> = {
    B: 'B — Comportement',
    F: 'F — Ressentis',
    S: 'S — Soi',
};

function StatusChip({ status }: { status: CampaignStatus }) {
    if (status === 'active')
        return (
            <Chip
                label="Active"
                size="small"
                sx={{ borderRadius: 99, bgcolor: 'rgba(16,185,129,0.12)', color: 'rgb(4,120,87)' }}
            />
        );
    if (status === 'closed' || status === 'archived')
        return (
            <Chip
                label="Archivée"
                size="small"
                sx={{ borderRadius: 99, bgcolor: 'rgba(148,163,184,0.16)', color: 'rgb(100,116,139)' }}
            />
        );
    return (
        <Chip
            label="Brouillon"
            size="small"
            sx={{ borderRadius: 99, bgcolor: 'rgba(255,204,0,0.16)', color: 'rgb(180,120,0)' }}
        />
    );
}

function AdminCampaignsRoute() {
    const [search, setSearch] = React.useState('');
    const [drawerOpen, setDrawerOpen] = React.useState(false);

    const { data: campaigns = [], isLoading: campaignsLoading } = useAdminCampaigns();
    const { data: coaches = [], isLoading: coachesLoading } = useCoaches();
    const { data: companies = [] } = useCompanies();
    const { data: dashboard, isLoading: dashboardLoading } = useAdminDashboard();
    const createCampaign = useCreateAdminCampaign();

    const isLoading = campaignsLoading || coachesLoading;

    const companyName = (id: number) => companies.find(c => c.id === id)?.name ?? '–';
    const coachName = (id: number) => coaches.find(c => c.id === id)?.displayName ?? '–';
    const questionnairesUsed = new Set(campaigns.map(c => c.questionnaireId).filter(Boolean)).size;

    const filtered = campaigns.filter(
        c =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            companyName(c.companyId).toLowerCase().includes(search.toLowerCase()) ||
            coachName(c.coachId).toLowerCase().includes(search.toLowerCase())
    );

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
                                label="Campagnes"
                                sx={{ borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main', mb: 1.5 }}
                            />
                            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                                Campagnes
                            </Typography>
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}
                            >
                                Visualisez les campagnes existantes, leur statut et leur progression.
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            disableElevation
                            startIcon={<Plus size={16} />}
                            onClick={() => setDrawerOpen(true)}
                            sx={{ borderRadius: 3, bgcolor: 'primary.main', textTransform: 'none' }}
                        >
                            Nouvelle campagne
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 2 }}>
                <StatCard
                    label="Campagnes"
                    value={campaigns.length}
                    helper="dans le système"
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
                    label="Participants"
                    value={dashboard?.total_participants ?? '–'}
                    helper="rattachés"
                    icon={Users}
                    loading={dashboardLoading}
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
                        subtitle="La table permet de comparer rapidement les campagnes et d'ouvrir leur détail."
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

                    {/* Desktop table */}
                    <Box sx={{ display: { xs: 'none', lg: 'block' }, overflowX: 'auto' }}>
                        <Table sx={{ minWidth: 1000 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Campagne</TableCell>
                                    <TableCell>Entreprise</TableCell>
                                    <TableCell>Coach</TableCell>
                                    <TableCell>Questionnaire</TableCell>
                                    <TableCell>Statut</TableCell>
                                    <TableCell>Créée le</TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isLoading
                                    ? Array.from({ length: 4 }).map((_, i) => (
                                          <TableRow key={i}>
                                              {Array.from({ length: 6 }).map((__, j) => (
                                                  <TableCell key={j}>
                                                      <Skeleton variant="text" />
                                                  </TableCell>
                                              ))}
                                              <TableCell />
                                          </TableRow>
                                      ))
                                    : filtered.map(campaign => (
                                          <TableRow hover key={campaign.id}>
                                              <TableCell>
                                                  <Typography fontWeight={700} color="text.primary">
                                                      {campaign.name}
                                                  </Typography>
                                              </TableCell>
                                              <TableCell>{companyName(campaign.companyId)}</TableCell>
                                              <TableCell>{coachName(campaign.coachId)}</TableCell>
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
                                                      component={Link}
                                                      to="/admin/campaigns/$campaignId"
                                                      params={{ campaignId: String(campaign.id) }}
                                                      variant="text"
                                                      endIcon={<ChevronRight size={16} />}
                                                      sx={{ textTransform: 'none' }}
                                                  >
                                                      Détail
                                                  </Button>
                                              </TableCell>
                                          </TableRow>
                                      ))}
                                {!isLoading && filtered.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
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
                    </Box>

                    {/* Mobile cards */}
                    <Stack spacing={2} sx={{ display: { xs: 'flex', lg: 'none' }, mt: 2 }}>
                        {isLoading
                            ? Array.from({ length: 3 }).map((_, i) => (
                                  <Skeleton key={i} variant="rounded" height={160} />
                              ))
                            : filtered.map(campaign => (
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
                                                          {companyName(campaign.companyId)} · Coach{' '}
                                                          {coachName(campaign.coachId)}
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
                                                  component={Link}
                                                  to="/admin/campaigns/$campaignId"
                                                  params={{ campaignId: String(campaign.id) }}
                                                  endIcon={<ChevronRight size={16} />}
                                                  sx={{
                                                      borderRadius: 3,
                                                      bgcolor: 'primary.main',
                                                      textTransform: 'none',
                                                      width: 'fit-content',
                                                  }}
                                              >
                                                  Ouvrir
                                              </Button>
                                          </Stack>
                                      </CardContent>
                                  </Card>
                              ))}
                        {!isLoading && filtered.length === 0 && (
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
