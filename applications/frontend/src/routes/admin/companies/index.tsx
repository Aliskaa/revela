import { AdminCompanyDrawerForm } from '@/components/admin/AdminCompanyDrawerForm';
import { MiniStat } from '@/components/common/MiniStat';
import { SectionTitle } from '@/components/common/SectionTitle';
import { StatCard } from '@/components/common/StatCard';
import { useAdminCampaigns, useCompanies, useCreateCompany } from '@/hooks/admin';
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
import { ArrowRight, Building2, ClipboardList, Plus, Users } from 'lucide-react';
import * as React from 'react';

export const Route = createFileRoute('/admin/companies/')({
    component: AdminCompaniesRoute,
});

function AdminCompaniesRoute() {
    const [drawerOpen, setDrawerOpen] = React.useState(false);
    const [search, setSearch] = React.useState('');

    const { data: companies = [], isLoading: companiesLoading } = useCompanies();
    const { data: campaigns = [], isLoading: campaignsLoading } = useAdminCampaigns();
    const createCompany = useCreateCompany();

    const totalParticipants = React.useMemo(
        () => companies.reduce((sum, c) => sum + c.participant_count, 0),
        [companies]
    );

    const filtered = search.trim()
        ? companies.filter(
              c =>
                  c.name.toLowerCase().includes(search.toLowerCase()) ||
                  (c.contact_name ?? '').toLowerCase().includes(search.toLowerCase())
          )
        : companies;

    return (
        <Stack spacing={3}>
            <AdminCompanyDrawerForm
                open={drawerOpen}
                mode="create"
                onClose={() => {
                    setDrawerOpen(false);
                    createCompany.reset();
                }}
                onSubmit={async values => {
                    try {
                        await createCompany.mutateAsync({
                            name: values.name,
                            contactName: values.contactName || null,
                            contactEmail: values.contactEmail || null,
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
                                label="Entreprises"
                                sx={{ borderRadius: 99, bgcolor: 'tint.primaryBg', color: 'primary.main', mb: 1.5 }}
                            />
                            <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: -0.5 }}>
                                Entreprises
                            </Typography>
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                sx={{ mt: 1, lineHeight: 1.7, maxWidth: 860 }}
                            >
                                Référentiel des entreprises clientes, avec leurs campagnes, leurs participants et leurs
                                contacts.
                            </Typography>
                        </Box>
                        <Button
                            onClick={() => setDrawerOpen(true)}
                            variant="contained"
                            disableElevation
                            startIcon={<Plus size={16} />}
                            sx={{ borderRadius: 3, bgcolor: 'primary.main', textTransform: 'none' }}
                        >
                            Ajouter une entreprise
                        </Button>
                    </Stack>
                </CardContent>
            </Card>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
                <StatCard
                    label="Entreprises"
                    value={companies.length}
                    helper="référencées"
                    icon={Building2}
                    loading={companiesLoading}
                />
                <StatCard
                    label="Participants"
                    value={totalParticipants}
                    helper="rattachés"
                    icon={Users}
                    loading={companiesLoading}
                />
                <StatCard
                    label="Campagnes"
                    value={campaigns.length}
                    helper="rattachées"
                    icon={ClipboardList}
                    loading={campaignsLoading}
                />
            </Box>

            <Card variant="outlined">
                <CardContent sx={{ p: 2.5 }}>
                    <SectionTitle
                        title="Liste des entreprises"
                        subtitle="Recherche rapide et accès au détail des campagnes associées."
                        action={
                            <TextField
                                size="small"
                                placeholder="Rechercher une entreprise…"
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
                                    <TableCell>Entreprise</TableCell>
                                    <TableCell>Contact</TableCell>
                                    <TableCell>Participants</TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {companiesLoading
                                    ? Array.from({ length: 4 }).map((_, i) => (
                                          <TableRow key={i}>
                                              {Array.from({ length: 3 }).map((__, j) => (
                                                  <TableCell key={j}>
                                                      <Skeleton variant="text" />
                                                  </TableCell>
                                              ))}
                                          </TableRow>
                                      ))
                                    : filtered.map(company => (
                                          <TableRow hover key={company.id}>
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
                                                  <Button
                                                      href={`/admin/companies/${company.id}`}
                                                      variant="text"
                                                      endIcon={<ArrowRight size={16} />}
                                                      sx={{ textTransform: 'none' }}
                                                  >
                                                      Ouvrir
                                                  </Button>
                                              </TableCell>
                                          </TableRow>
                                      ))}
                                {!companiesLoading && filtered.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {search
                                                    ? 'Aucune entreprise ne correspond à la recherche.'
                                                    : 'Aucune entreprise pour le moment.'}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Box>

                    {/* Mobile cards */}
                    <Stack spacing={2} sx={{ display: { xs: 'flex', lg: 'none' }, mt: 2 }}>
                        {companiesLoading
                            ? Array.from({ length: 3 }).map((_, i) => (
                                  <Skeleton key={i} variant="rounded" height={140} />
                              ))
                            : filtered.map(company => (
                                  <Card variant="outlined" key={company.id}>
                                      <CardContent sx={{ p: 2.5 }}>
                                          <Stack spacing={1.8}>
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
                                              <Box
                                                  sx={{
                                                      display: 'grid',
                                                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                                      gap: 1.2,
                                                  }}
                                              >
                                                  <MiniStat
                                                      label="Participants"
                                                      value={String(company.participant_count)}
                                                  />
                                              </Box>
                                          </Stack>
                                      </CardContent>
                                  </Card>
                              ))}
                        {!companiesLoading && filtered.length === 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                {search
                                    ? 'Aucune entreprise ne correspond à la recherche.'
                                    : 'Aucune entreprise pour le moment.'}
                            </Typography>
                        )}
                    </Stack>
                </CardContent>
            </Card>
        </Stack>
    );
}
