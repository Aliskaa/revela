import { AdminCoachDrawerForm } from '@/components/admin/AdminCoachDrawerForm';
import { MiniStat } from '@/components/common/MiniStat';
import { SectionTitle } from '@/components/common/SectionTitle';
import { StatCard } from '@/components/common/StatCard';
import { useAdminCampaigns, useCoaches, useCreateCoach } from '@/hooks/admin';
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
import { createFileRoute } from '@tanstack/react-router';
import { ClipboardList, Plus, UserRound } from 'lucide-react';
import * as React from 'react';

export const Route = createFileRoute('/admin/coaches/')({
    component: AdminCoachesRoute,
});

function StatusChip({ isActive }: { isActive: boolean }) {
    if (isActive)
        return (
            <Chip
                label="Actif"
                size="small"
                sx={{ borderRadius: 99, bgcolor: 'rgba(16,185,129,0.12)', color: 'rgb(4,120,87)' }}
            />
        );
    return (
        <Chip
            label="Inactif"
            size="small"
            sx={{ borderRadius: 99, bgcolor: 'rgba(148,163,184,0.16)', color: 'rgb(100,116,139)' }}
        />
    );
}

function AdminCoachesRoute() {
    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');

    const { data: coaches = [], isLoading: coachesLoading } = useCoaches();
    const { data: campaigns = [], isLoading: campaignsLoading } = useAdminCampaigns();
    const createCoach = useCreateCoach();

    const isLoading = coachesLoading;

    const campaignCountByCoach = React.useMemo(() => {
        const map = new Map<number, number>();
        for (const c of campaigns) {
            map.set(c.coachId, (map.get(c.coachId) ?? 0) + 1);
        }
        return map;
    }, [campaigns]);

    const filtered = search.trim()
        ? coaches.filter(
              c =>
                  c.displayName.toLowerCase().includes(search.toLowerCase()) ||
                  c.username.toLowerCase().includes(search.toLowerCase())
          )
        : coaches;

    const activeCount = coaches.filter(c => c.isActive).length;

    return (
        <Stack spacing={3}>
            <AdminCoachDrawerForm
                open={drawerOpen}
                mode="create"
                isSubmitting={createCoach.isPending}
                onClose={() => {
                    setDrawerOpen(false);
                    createCoach.reset();
                }}
                onSubmit={async values => {
                    try {
                        await createCoach.mutateAsync({
                            username: values.username,
                            password: values.password,
                            displayName: values.displayName,
                        });
                        setDrawerOpen(false);
                    } catch {
                        // Le toast d'erreur est émis par le hook ; on garde le drawer ouvert.
                    }
                }}
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
                                label="Coachs"
                                sx={{ borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main', mb: 1.5 }}
                            />
                            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                                Coachs
                            </Typography>
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}
                            >
                                Référentiel des coachs et des campagnes qui leur sont associées.
                            </Typography>
                        </Box>
                        <Button
                            onClick={() => setDrawerOpen(true)}
                            variant="contained"
                            disableElevation
                            startIcon={<Plus size={16} />}
                            sx={{ borderRadius: 3, bgcolor: 'primary.main' }}
                        >
                            Ajouter un coach
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
                <StatCard
                    label="Coachs"
                    value={coaches.length}
                    helper="référencés"
                    icon={UserRound}
                    loading={isLoading}
                />
                <StatCard
                    label="Actifs"
                    value={activeCount}
                    helper="en activité"
                    icon={UserRound}
                    loading={isLoading}
                />
                <StatCard
                    label="Campagnes"
                    value={campaigns.length}
                    helper="attribuées"
                    icon={ClipboardList}
                    loading={campaignsLoading}
                />
            </Box>

            <Card variant="outlined">
                <CardContent sx={{ p: 2.5 }}>
                    <SectionTitle
                        title="Liste des coachs"
                        subtitle="Recherche rapide et accès au détail des campagnes suivies."
                        action={
                            <TextField
                                size="small"
                                placeholder="Rechercher un coach…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                sx={{ minWidth: 300 }}
                            />
                        }
                    />

                    {/* Desktop table */}
                    <Box sx={{ display: { xs: 'none', lg: 'block' }, overflowX: 'auto' }}>
                        <Table sx={{ minWidth: 800 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Coach</TableCell>
                                    <TableCell>Username</TableCell>
                                    <TableCell>Campagnes</TableCell>
                                    <TableCell>Statut</TableCell>
                                    <TableCell>Créé le</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isLoading
                                    ? Array.from({ length: 4 }).map((_, i) => (
                                          <TableRow key={i}>
                                              {Array.from({ length: 5 }).map((__, j) => (
                                                  <TableCell key={j}>
                                                      <Skeleton variant="text" />
                                                  </TableCell>
                                              ))}
                                          </TableRow>
                                      ))
                                    : filtered.map(coach => (
                                          <TableRow hover key={coach.id}>
                                              <TableCell>
                                                  <Typography fontWeight={700} color="text.primary">
                                                      {coach.displayName}
                                                  </Typography>
                                              </TableCell>
                                              <TableCell>
                                                  <Typography variant="body2" color="text.secondary">
                                                      {coach.username}
                                                  </Typography>
                                              </TableCell>
                                              <TableCell>{campaignCountByCoach.get(coach.id) ?? 0}</TableCell>
                                              <TableCell>
                                                  <StatusChip isActive={coach.isActive} />
                                              </TableCell>
                                              <TableCell>
                                                  {coach.createdAt
                                                      ? new Date(coach.createdAt).toLocaleDateString('fr-FR')
                                                      : '–'}
                                              </TableCell>
                                          </TableRow>
                                      ))}
                                {!isLoading && filtered.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {search
                                                    ? 'Aucun coach ne correspond à la recherche.'
                                                    : 'Aucun coach pour le moment.'}
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
                                  <Skeleton key={i} variant="rounded" height={140} />
                              ))
                            : filtered.map(coach => (
                                  <Card variant="outlined" key={coach.id}>
                                      <CardContent sx={{ p: 2.5 }}>
                                          <Stack spacing={1.8}>
                                              <Stack
                                                  direction="row"
                                                  justifyContent="space-between"
                                                  alignItems="start"
                                                  spacing={2}
                                              >
                                                  <Box>
                                                      <Typography variant="h6" fontWeight={800} color="text.primary">
                                                          {coach.displayName}
                                                      </Typography>
                                                      <Typography
                                                          variant="body2"
                                                          color="text.secondary"
                                                          sx={{ mt: 0.4 }}
                                                      >
                                                          {coach.username}
                                                      </Typography>
                                                  </Box>
                                                  <StatusChip isActive={coach.isActive} />
                                              </Stack>
                                              <Box
                                                  sx={{
                                                      display: 'grid',
                                                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                                      gap: 1.2,
                                                  }}
                                              >
                                                  <MiniStat
                                                      label="Campagnes"
                                                      value={String(campaignCountByCoach.get(coach.id) ?? 0)}
                                                  />
                                                  <MiniStat
                                                      label="Créé le"
                                                      value={
                                                          coach.createdAt
                                                              ? new Date(coach.createdAt).toLocaleDateString('fr-FR')
                                                              : '–'
                                                      }
                                                  />
                                              </Box>
                                          </Stack>
                                      </CardContent>
                                  </Card>
                              ))}
                        {!isLoading && filtered.length === 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                {search ? 'Aucun coach ne correspond à la recherche.' : 'Aucun coach pour le moment.'}
                            </Typography>
                        )}
                    </Stack>
                </CardContent>
            </Card>
        </Stack>
    );
}
